// src/components/Canvas/hooks/useRenderBathroomPods.ts
import { useEffect } from 'react';
import type { Canvas } from 'fabric';
import * as fabric from 'fabric';
import { useObjectStore } from '@/state/objectStore';
import { useCanvasStore } from '@/state/canvasStore';

export default function useRenderBathroomPods(canvas: Canvas | null) {
  const bathroomPods = useObjectStore(s => s.bathroomPods);
  const modules      = useObjectStore(s => s.modules);
  const scaleFactor  = useCanvasStore(s => s.scaleFactor);

  useEffect(() => {
    if (!canvas) return;

    // видаляємо старі об’єкти pods
    canvas.getObjects().forEach(o => {
      if ((o as any).isBathroomPod) {
        canvas.remove(o);
      }
    });

    // рендеримо заново
    bathroomPods.forEach(bp => {
      const mod = modules.find(m => m.id === bp.moduleId);
      if (!mod) return;

      const left  = mod.x0! * scaleFactor + bp.x_offset * scaleFactor;
      const top   = mod.y0! * scaleFactor + bp.y_offset * scaleFactor;
      const width = bp.width  * scaleFactor;
      const height= bp.length * scaleFactor;

      const rect = new fabric.Rect({
        left,
        top,
        width,
        height,
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
