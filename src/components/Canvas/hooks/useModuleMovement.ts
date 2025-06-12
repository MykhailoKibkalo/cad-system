import {useEffect} from 'react';
import {Canvas} from 'fabric';
import {useObjectStore} from '@/state/objectStore';
import {useCanvasStore} from '@/state/canvasStore';
import { rectTopToBottomYMm } from '@/utils/coordinateTransform';
import { useCurrentFloorModules } from './useFloorElements';

/**
 * Listens for module dragging and updates their coordinates in the store
 * with bottom-left coordinate system
 */
export default function useModuleMovement(canvas: Canvas | null) {
  const updateModule = useObjectStore(s => s.updateModule);
  const scaleFactor = useCanvasStore(s => s.scaleFactor);
  const gridHeightM = useCanvasStore(s => s.gridHeightM);
  const modules = useCurrentFloorModules();

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

      // New positions in millimeters
      const newX0 = Math.round(Math.round(obj.left ?? 0) / scaleFactor);
      const topYMm = Math.round(Math.round(obj.top ?? 0) / scaleFactor);
      
      // Convert from canvas top-left to bottom-left coordinate system
      const newY0 = rectTopToBottomYMm(topYMm, module.length, gridHeightM);

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
