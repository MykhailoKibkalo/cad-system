// src/components/Canvas/hooks/useRenderModules.ts
import { useEffect } from 'react';
import type { Canvas } from 'fabric';
import * as fabric from 'fabric';
import { useCurrentFloorModules } from './useFloorElements';
import { useCanvasStore } from '@/state/canvasStore';

/**
 * Reactive hook to render modules when data changes within the same floor
 * This is different from useModuleRestore which only runs on floor changes
 */
export default function useRenderModules(canvas: Canvas | null) {
  const modules = useCurrentFloorModules();
  const scaleFactor = useCanvasStore(s => s.scaleFactor);

  useEffect(() => {
    if (!canvas) return;

    console.log('🔧 useRenderModules triggered - modules:', modules.length);
    console.log('🔧 Non-grouped modules:', modules.filter(m => !m.isGrouped).length);
    console.log('🔧 Grouped modules:', modules.filter(m => m.isGrouped).length);

    // Track which modules exist on canvas
    const existingModuleMap = new Map<string, fabric.Object>();
    canvas.getObjects().forEach(obj => {
      if ((obj as any).isModule) {
        existingModuleMap.set((obj as any).isModule, obj);
      }
    });

    // Track which modules should exist
    const shouldExistSet = new Set<string>();
    
    // Process each module
    modules.forEach(module => {
      // Skip modules that are part of a group
      if (module.isGrouped) {
        console.log(`🔧 Skipping grouped module: ${module.id}`);
        return;
      }

      shouldExistSet.add(module.id);
      
      // Check if module already exists on canvas
      const existingObj = existingModuleMap.get(module.id);
      
      if (existingObj) {
        // Module exists - check if it needs updating (but don't update during active interactions)
        const rect = existingObj as fabric.Rect;
        
        // Skip updates if the object is being actively manipulated
        if (canvas.getActiveObject() === rect) {
          console.log(`🔧 Skipping update for actively selected module: ${module.id}`);
          return;
        }
        
        // Calculate expected values
        const expectedLeft = Math.round(module.x0 * scaleFactor);
        const expectedTop = Math.round(module.y0 * scaleFactor);
        const expectedWidth = Math.round(module.width * scaleFactor);
        const expectedHeight = Math.round(module.length * scaleFactor);
        
        // Update position and size if they differ
        const needsUpdate = 
          Math.abs((rect.left || 0) - expectedLeft) > 1 ||
          Math.abs((rect.top || 0) - expectedTop) > 1 ||
          Math.abs((rect.width || 0) - expectedWidth) > 1 ||
          Math.abs((rect.height || 0) - expectedHeight) > 1;
          
        if (needsUpdate) {
          console.log(`🔧 Updating module geometry: ${module.id}`);
          rect.set({
            left: expectedLeft,
            top: expectedTop,
            width: expectedWidth,
            height: expectedHeight,
          });
          rect.setCoords();
        }
        
        // Update visual properties if they changed
        const newStroke = module.showBorder ? '#36a2eb' : 'transparent';
        const newStrokeWidth = module.showBorder ? 2 : 0;
        
        if (rect.stroke !== newStroke || rect.strokeWidth !== newStrokeWidth) {
          rect.set({
            stroke: newStroke,
            strokeWidth: newStrokeWidth,
          });
        }
      } else {
        // Module doesn't exist - create it
        console.log(`🔧 Creating new module: ${module.id} at (${module.x0}, ${module.y0})`);
        
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
          lockScalingX: false,
          lockScalingY: false,
          lockUniScaling: false,
          lockMovementX: false,
          lockMovementY: false,
        });

        // Store module ID for identification
        (rect as any).isModule = module.id;
        
        canvas.add(rect);
      }
    });

    // Remove modules that shouldn't exist
    existingModuleMap.forEach((obj, moduleId) => {
      if (!shouldExistSet.has(moduleId)) {
        console.log(`🔧 Removing module that should not exist: ${moduleId}`);
        canvas.remove(obj);
      }
    });

    canvas.requestRenderAll();
  }, [canvas, modules, scaleFactor]);
}
