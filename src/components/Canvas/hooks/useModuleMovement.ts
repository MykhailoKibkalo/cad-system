import {useEffect} from 'react';
import {Canvas} from 'fabric';
import {useObjectStore} from '@/state/objectStore';
import {useCanvasStore} from '@/state/canvasStore';
import { rectTopToBottomYMm } from '@/utils/coordinateTransform';
import { useCurrentFloorModules, useCurrentFloorGridSettings } from './useFloorElements';

/**
 * Listens for module dragging and updates their coordinates in the store
 * with bottom-left coordinate system
 */
export default function useModuleMovement(canvas: Canvas | null) {
  const updateModule = useObjectStore(s => s.updateModule);
  const scaleFactor = useCanvasStore(s => s.scaleFactor);
  const { gridHeightM } = useCurrentFloorGridSettings();
  const modules = useCurrentFloorModules();
  
  console.log(`🔍 useModuleMovement - floor gridHeightM: ${gridHeightM}`);

  useEffect(() => {
    if (!canvas) return;

    const onModified = (opt: any) => {
      const obj = opt.target;
      // Only for our modules
      const moduleId = (obj as any).isModule;
      if (!moduleId) return;

      // Find the module to get its dimensions
      const module = modules.find(m => m.id === moduleId);
      if (!module) return;

      // Check if this was a resize operation by comparing current dimensions to store
      const strokeWidth = obj.strokeWidth || 0;
      const currentWidthPx = Math.round((obj.getScaledWidth ? obj.getScaledWidth() : (obj.width || 0)) - strokeWidth);
      const currentHeightPx = Math.round((obj.getScaledHeight ? obj.getScaledHeight() : (obj.height || 0)) - strokeWidth);
      const expectedWidthPx = Math.round(module.width * scaleFactor);
      const expectedHeightPx = Math.round(module.length * scaleFactor);
      
      // If dimensions changed, this is a resize operation - let useModuleResize handle it
      if (Math.abs(currentWidthPx - expectedWidthPx) > 1 || Math.abs(currentHeightPx - expectedHeightPx) > 1) {
        console.log(`🚫 Movement handler skipping resize operation for ${moduleId}`);
        return;
      }

      // Only handle pure movement (no dimension changes)
      const newX0 = Math.round(Math.round(obj.left ?? 0) / scaleFactor);
      const topYMm = Math.round(Math.round(obj.top ?? 0) / scaleFactor);
      
      // Convert from canvas top-left to bottom-left coordinate system
      const newY0 = rectTopToBottomYMm(topYMm, module.length, gridHeightM);

      console.log(`📍 Movement - Module ${moduleId}:`, {
        oldPos: { x0: module.x0, y0: module.y0 },
        newPos: { x0: newX0, y0: newY0 },
        canvas: { left: obj.left, top: obj.top }
      });

      updateModule(moduleId, {
        x0: Math.round(newX0),
        y0: Math.round(newY0),
      });
    };

    // Моніторимо завершення перетягування
    canvas.on('object:modified', onModified);

    return () => {
      canvas.off('object:modified', onModified);
    };
  }, [canvas, updateModule, scaleFactor, gridHeightM, modules]);
}
