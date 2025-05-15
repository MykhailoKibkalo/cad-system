// src/components/Canvas/hooks/useRenderOpenings.ts
import {useEffect} from 'react';
import {Canvas, Rect} from 'fabric';
import {useObjectStore} from '../../../state/objectStore';
import {useCanvasStore} from '../../../state/canvasStore';

/**
 * На плані (top-view) малюємо opening як тонку смугу на межі модуля.
 */
export default function useRenderOpenings(canvas: Canvas | null) {
  const openings = useObjectStore(s => s.openings);
  const modules = useObjectStore(s => s.modules);
  const scale = useCanvasStore(s => s.scaleFactor);

  useEffect(() => {
    if (!canvas) return;

    // 1) видаляємо попередні opening-маркери
    canvas.getObjects().forEach(o => {
      if ((o as any).isOpening) {
        canvas.remove(o);
      }
    });

    // 2) заново малюємо по кожному opening
    openings.forEach(o => {
      const mod = modules.find(m => m.id === o.moduleId);
      if (!mod) return;

      // координати модуля в px
      const x = mod.x0 * scale;
      const y = mod.y0 * scale;
      const w = mod.width * scale;
      const h = mod.length * scale;

      // товщина маркера в px
      const THICK = 3;

      let left: number, top: number, rw: number, rh: number;

      if (o.wallSide === 1) {
        // bottom wall: по X — довжина отвору, Y — 3px товщина
        left = x + o.distanceAlongWall * scale;
        top = y + h - THICK;
        rw = o.width * scale;
        rh = THICK;
      } else if (o.wallSide === 3) {
        // top wall
        left = x + o.distanceAlongWall * scale;
        top = y;
        rw = o.width * scale;
        rh = THICK;
      } else if (o.wallSide === 2) {
        // left wall
        left = x;
        top = y + h - o.distanceAlongWall * scale - o.width * scale;
        rw = THICK;
        rh = o.width * scale;
      } else {
        // right wall (4)
        left = x + w - THICK;
        top = y + o.distanceAlongWall * scale;
        rw = THICK;
        rh = o.width * scale;
      }

      const mark = new Rect({
        left,
        top,
        width: rw,
        height: rh,
        fill: 'rgba(245,158,11,0.6)',
        selectable: false,
        evented: false,
      });
      (mark as any).isOpening = o.id;
      canvas.add(mark);
    });

    canvas.requestRenderAll();
  }, [canvas, openings, modules, scale]);
}
