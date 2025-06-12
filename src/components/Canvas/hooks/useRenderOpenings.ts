// src/components/Canvas/hooks/useRenderOpenings.ts
import {useEffect} from 'react';
import {Canvas, Rect} from 'fabric';
import {useCurrentFloorElements} from './useFloorElements';
import {useCanvasStore} from '@/state/canvasStore';
import { rectBottomToTopYMm } from '@/utils/coordinateTransform';

/**
 * На плані (top-view) малюємо opening як тонку смугу на межі модуля.
 */
export default function useRenderOpenings(canvas: Canvas | null) {
  const { openings, modules } = useCurrentFloorElements();
  const scale = useCanvasStore(s => s.scaleFactor);
  const gridHeightM = useCanvasStore(s => s.gridHeightM);

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

      // Convert module position from bottom-left to canvas coordinates
      const moduleTopYMm = rectBottomToTopYMm(mod.y0, mod.length, gridHeightM);
      const x = Math.round(mod.x0 * scale); // Left edge stays the same
      const y = Math.round(moduleTopYMm * scale); // Top edge in canvas coordinates
      const w = Math.round(mod.width * scale);
      const h = Math.round(mod.length * scale);

      // товщина маркера в px
      const THICK = 3;

      let left: number, top: number, rw: number, rh: number;

      if (o.wallSide === 1) {
        // bottom wall: по X — довжина отвору, Y — 3px товщина
        left = Math.round(x + Math.round(o.distanceAlongWall * scale));
        top = Math.round(y + h - THICK);
        rw = Math.round(o.width * scale);
        rh = THICK;
      } else if (o.wallSide === 3) {
        // top wall
        left = Math.round(x + Math.round(o.distanceAlongWall * scale));
        top = y;
        rw = Math.round(o.width * scale);
        rh = THICK;
      } else if (o.wallSide === 2) {
        // left wall
        left = x;
        top = Math.round(y + h - Math.round(o.distanceAlongWall * scale) - Math.round(o.width * scale));
        rw = THICK;
        rh = Math.round(o.width * scale);
      } else {
        // right wall (4)
        left = Math.round(x + w - THICK);
        top = Math.round(y + Math.round(o.distanceAlongWall * scale));
        rw = THICK;
        rh = Math.round(o.width * scale);
      }

      const mark = new Rect({
        left: Math.round(left),
        top: Math.round(top),
        width: Math.round(rw),
        height: Math.round(rh),
        fill: 'rgba(245,158,11,0.6)',
        selectable: false,
        evented: false,
      });
      (mark as any).isOpening = o.id;
      canvas.add(mark);
    });

    canvas.requestRenderAll();
  }, [canvas, openings, modules, scale, gridHeightM]);
}
