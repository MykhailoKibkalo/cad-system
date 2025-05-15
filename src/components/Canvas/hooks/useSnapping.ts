// src/components/Canvas/hooks/useSnapping.ts
import { useEffect } from 'react';
import type { Canvas } from 'fabric';
import { useCanvasStore } from '@/state/canvasStore';

export default function useSnapping(canvas: Canvas | null) {
  const { snapMode, gridSizeMm, elementGapMm, scaleFactor } = useCanvasStore();

  useEffect(() => {
    if (!canvas) return;

    const gapPx = elementGapMm * scaleFactor;
    const TOL = 24;

    function snapAxis(pos: number, size: number, leftEdges: number[], rightEdges: number[]): number {
      const candidates: number[] = [];
      // Ставимо this.left = other.right + gap
      for (const e of rightEdges) {
        candidates.push(e + gapPx);
      }
      // Ставимо this.right = other.left - gap → this.left = other.left - gap - size
      for (const e of leftEdges) {
        candidates.push(e - gapPx - size);
      }
      let best = pos;
      let dist = Infinity;
      for (const c of candidates) {
        const d = Math.abs(pos - c);
        if (d < dist) {
          dist = d;
          best = c;
        }
      }
      return dist < TOL ? best : pos; // поріг лишаємо лише TOL, а не gapPx
    }

    const onMoving = (opt: any) => {
      if (snapMode !== 'element' && snapMode !== 'grid') return;
      const obj = opt.target;
      let left = obj.left!;
      let top = obj.top!;
      const bObj = obj.getBoundingRect(true);
      const myW = bObj.width,
        myH = bObj.height;

      // grid-snap
      if (snapMode === 'grid') {
        const gridPx = gridSizeMm * scaleFactor;
        left = Math.round(left / gridPx) * gridPx;
        top = Math.round(top / gridPx) * gridPx;
      }

      // element-snap
      if (snapMode === 'element') {
        const leftEdges: number[] = [];
        const rightEdges: number[] = [];
        const topEdges: number[] = [];
        const bottomEdges: number[] = [];

        canvas.getObjects().forEach(o => {
          if ((o as any).isModule && o !== obj) {
            const b = (o as any).getBoundingRect(true);
            leftEdges.push(b.left);
            rightEdges.push(b.left + b.width);
            topEdges.push(b.top);
            bottomEdges.push(b.top + b.height);
          }
        });

        // прив’язуємо X-вісь
        left = snapAxis(left, myW, leftEdges, rightEdges);
        // прив’язуємо Y-вісь аналогічним чином
        top = snapAxis(top, myH, topEdges, bottomEdges);
      }

      obj.set({ left, top });
    };

    canvas.on('object:moving', onMoving);
    return () => void canvas.off('object:moving', onMoving);
  }, [canvas, snapMode, gridSizeMm, elementGapMm, scaleFactor]);
}
