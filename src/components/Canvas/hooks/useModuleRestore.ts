// src/components/Canvas/hooks/useModuleRestore.ts
import { useEffect, useRef } from 'react';
import type { Canvas } from 'fabric';
import * as fabric from 'fabric';
import { useFloorStore } from '@/state/floorStore';
import { useCanvasStore } from '@/state/canvasStore';

/**
 * Hook to restore modules to canvas when switching floors
 * This is different from useRenderModules - it only runs when floor changes,
 * not on every reactive update, to avoid interfering with user interactions
 */
export default function useModuleRestore(canvas: Canvas | null) {
  const selectedFloorId = useFloorStore(s => s.selectedFloorId);
  const getActiveGridState = useFloorStore(s => s.getActiveGridState);
  const scaleFactor = useCanvasStore(s => s.scaleFactor);
  const previousFloorRef = useRef<string | null>(null);

  useEffect(() => {
    if (!canvas || !selectedFloorId) return;

    // Only restore modules when floor actually changes, not on initial load
    if (previousFloorRef.current !== null && previousFloorRef.current !== selectedFloorId) {
      // Small delay to ensure floor sync has cleared the canvas
      setTimeout(() => {
        const gridState = getActiveGridState();
        if (!gridState) return;

        // Check if there are modules to restore but no module objects on canvas
        const existingModules = canvas.getObjects().filter(o => (o as any).isModule);
        if (gridState.modules.length > 0 && existingModules.length === 0) {
          // Restore modules to canvas
          gridState.modules.forEach(module => {
            const rect = new fabric.Rect({
              left: Math.round(module.x0 * scaleFactor),
              top: Math.round(module.y0 * scaleFactor),
              width: Math.round(module.width * scaleFactor),
              height: Math.round(module.length * scaleFactor),
              fill: 'rgba(54, 162, 235, 0.2)',
              stroke: module.showBorder ? '#36a2eb' : 'transparent',
              strokeWidth: module.showBorder ? 2 : 0,
              selectable: true,
              evented: true,
              hasControls: true,
              hasBorders: true,
              // Allow resizing
              lockScalingX: false,
              lockScalingY: false,
              lockUniScaling: false,
              lockMovementX: false,
              lockMovementY: false,
            });

            // Store module ID for identification
            (rect as any).isModule = module.id;
            
            canvas.add(rect);
          });

          canvas.requestRenderAll();
          console.log(`🔧 Restored ${gridState.modules.length} modules for floor: ${selectedFloorId}`);
        }
      }, 100);
    }

    previousFloorRef.current = selectedFloorId;
  }, [canvas, selectedFloorId, getActiveGridState, scaleFactor]);
}