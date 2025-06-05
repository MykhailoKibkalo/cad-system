// src/components/Canvas/hooks/useRenderBathroomPods.ts
import { useEffect } from 'react';
import type { Canvas } from 'fabric';
import * as fabric from 'fabric';
import { useCurrentFloorElements } from './useFloorElements';
import { useCanvasStore } from '@/state/canvasStore';

export default function useRenderBathroomPods(canvas: Canvas | null) {
  const { bathroomPods, modules } = useCurrentFloorElements();
  const scaleFactor = useCanvasStore(s => s.scaleFactor);

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

      // Ensure all calculations result in integers
      const left = Math.round(Math.round(mod.x0! * scaleFactor) + Math.round(bp.x_offset * scaleFactor));
      const top = Math.round(Math.round(mod.y0! * scaleFactor) + Math.round(bp.y_offset * scaleFactor));
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
  }, [canvas, bathroomPods, modules, scaleFactor]);
}
