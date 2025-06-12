// src/components/Canvas/hooks/useRenderBathroomPods.ts
import { useEffect } from 'react';
import type { Canvas } from 'fabric';
import * as fabric from 'fabric';
import { useCurrentFloorElements } from './useFloorElements';
import { useCanvasStore } from '@/state/canvasStore';
import { rectBottomToTopYMm } from '@/utils/coordinateTransform';

export default function useRenderBathroomPods(canvas: Canvas | null) {
  const { bathroomPods, modules } = useCurrentFloorElements();
  const scaleFactor = useCanvasStore(s => s.scaleFactor);
  const gridHeightM = useCanvasStore(s => s.gridHeightM);

  useEffect(() => {
    if (!canvas) return;

    // видаляємо старі об'єкти pods
    canvas.getObjects().forEach(o => {
      if ((o as any).isBathroomPod) {
        canvas.remove(o);
      }
    });

    // рендеримо заново
    bathroomPods.forEach(bp => {
      const mod = modules.find(m => m.id === bp.moduleId);
      if (!mod) return;

      // Convert module position from bottom-left to canvas coordinates
      const moduleTopYMm = rectBottomToTopYMm(mod.y0!, mod.length!, gridHeightM);
      const moduleCanvasLeft = Math.round(mod.x0! * scaleFactor);
      const moduleCanvasTop = Math.round(moduleTopYMm * scaleFactor);
      
      // Calculate bathroom pod position relative to module (canvas coordinates)
      // Bathroom pod y_offset is from bottom of module in bottom-left coordinate system
      const left = Math.round(moduleCanvasLeft + Math.round(bp.x_offset * scaleFactor));
      const top = Math.round(moduleCanvasTop + Math.round((mod.length! - bp.y_offset - bp.length) * scaleFactor));
      const width = Math.round(bp.width * scaleFactor);
      const height = Math.round(bp.length * scaleFactor);

      const rect = new fabric.Rect({
        left: Math.round(left),
        top: Math.round(top),
        width: Math.round(width),
        height: Math.round(height),
        fill: 'rgba(0,150,200,0.3)',
        stroke: '#0096c8',
        strokeWidth: 1,

        // ← allow selection & dragging/resizing
        selectable: true,
        evented: true,
        hasControls: true,
        lockUniScaling: false,
      });
      (rect as any).isBathroomPod = bp.id;
      canvas.add(rect);
      // можемо шанувати порядок шарів за потребою
    });

    canvas.requestRenderAll();
  }, [canvas, bathroomPods, modules, scaleFactor, gridHeightM]);
}
