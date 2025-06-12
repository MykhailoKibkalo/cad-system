// src/components/Canvas/hooks/useRenderCorridors.ts
import { useEffect } from 'react';
import type { Canvas } from 'fabric';
import * as fabric from 'fabric';
import { useCurrentFloorCorridors } from './useFloorElements';
import { useCanvasStore } from '@/state/canvasStore';
import { bottomToTopYMm } from '@/utils/coordinateTransform';

export default function useRenderCorridors(canvas: Canvas | null) {
  const corridors = useCurrentFloorCorridors();
  const scaleFactor = useCanvasStore(s => s.scaleFactor);
  const gridHeightM = useCanvasStore(s => s.gridHeightM);

  useEffect(() => {
    if (!canvas) return;

    console.log('🔧 useRenderCorridors triggered - corridors:', corridors.length);
    console.log('🔧 Non-grouped corridors:', corridors.filter(c => !c.isGrouped).length);

    // Track which corridors exist on canvas
    const existingCorridorMap = new Map<string, fabric.Object>();
    canvas.getObjects().forEach(obj => {
      if ((obj as any).isCorridor && typeof (obj as any).isCorridor === 'string') {
        existingCorridorMap.set((obj as any).isCorridor, obj);
      }
    });

    // Track which corridors should exist
    const shouldExistSet = new Set<string>();
    
    // Process each corridor
    corridors.forEach(corridor => {
      // Skip corridors that are part of a group
      if (corridor.isGrouped) {
        console.log(`🔧 Skipping grouped corridor: ${corridor.id}`);
        return;
      }

      shouldExistSet.add(corridor.id);
      
      // Check if corridor already exists on canvas
      const existingObj = existingCorridorMap.get(corridor.id);
      
      if (existingObj) {
        // Corridor exists - check if it needs updating (but don't update during move)
        const rect = existingObj as fabric.Rect;
        
        // Skip updates if the object is being actively manipulated
        if (canvas.getActiveObject() === rect) {
          console.log(`🔧 Skipping update for actively selected corridor: ${corridor.id}`);
          return;
        }
        
        // Calculate expected values - convert from bottom-left to top-left for canvas
        const expectedLeft = Math.round(corridor.x1 * scaleFactor);
        const expectedWidth = Math.round((corridor.x2 - corridor.x1) * scaleFactor);
        const expectedHeight = Math.round((corridor.y2 - corridor.y1) * scaleFactor);
        
        // Convert Y from bottom-left to top-left (y2 is top edge in bottom-left system)
        const topYMm = bottomToTopYMm(corridor.y2, gridHeightM);
        const expectedTop = Math.round(topYMm * scaleFactor);
        
        // Update position and size if they differ significantly
        const needsUpdate = 
          Math.abs((rect.left || 0) - expectedLeft) > 1 ||
          Math.abs((rect.top || 0) - expectedTop) > 1 ||
          Math.abs((rect.width || 0) - expectedWidth) > 1 ||
          Math.abs((rect.height || 0) - expectedHeight) > 1;
          
        if (needsUpdate) {
          console.log(`🔧 Updating corridor geometry: ${corridor.id}`);
          rect.set({
            left: expectedLeft,
            top: expectedTop,
            width: expectedWidth,
            height: expectedHeight,
          });
          rect.setCoords();
        }
      } else {
        // Corridor doesn't exist - create it
        console.log(`🔧 Creating new corridor: ${corridor.id}`);
        
        const left = Math.round(corridor.x1 * scaleFactor);
        const width = Math.round((corridor.x2 - corridor.x1) * scaleFactor);
        const height = Math.round((corridor.y2 - corridor.y1) * scaleFactor);
        
        // Convert Y from bottom-left to top-left (y2 is top edge in bottom-left system)
        const topYMm = bottomToTopYMm(corridor.y2, gridHeightM);
        const top = Math.round(topYMm * scaleFactor);

        const rect = new fabric.Rect({
          left: left,
          top: top,
          width: width,
          height: height,
          fill: 'rgba(128,128,128,0.3)',
          stroke: '#666',
          strokeDashArray: [4, 4],
          selectable: true,
          evented: true,
          hasControls: true,
          hasBorders: true,
          lockUniScaling: false,
          perPixelTargetFind: true, // Improve selection accuracy
        });

        // Store corridor ID for identification
        (rect as any).isCorridor = corridor.id;

        canvas.add(rect);
        // Send to back but ensure it remains selectable
        canvas.sendObjectToBack(rect);
      }
    });

    // Remove corridors that shouldn't exist
    existingCorridorMap.forEach((obj, corridorId) => {
      if (!shouldExistSet.has(corridorId)) {
        console.log(`🔧 Removing corridor that should not exist: ${corridorId}`);
        canvas.remove(obj);
      }
    });

    canvas.requestRenderAll();
  }, [canvas, corridors, scaleFactor, gridHeightM]);
}
