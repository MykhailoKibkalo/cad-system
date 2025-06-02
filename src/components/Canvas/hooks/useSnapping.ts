// src/components/Canvas/hooks/useSnapping.ts (Updated)
import { useEffect } from 'react';
import type { Canvas } from 'fabric';
import { useCanvasStore } from '@/state/canvasStore';
import { useFloorStore } from '@/state/floorStore';

export default function useSnapping(canvas: Canvas | null) {
  const { scaleFactor } = useCanvasStore();
  const { getCurrentFloor } = useFloorStore();

  useEffect(() => {
    if (!canvas) return;

    const currentFloor = getCurrentFloor();
    if (!currentFloor) return;

    const snapMode = currentFloor.gridSettings.snapMode;
    const gridSizeMm = currentFloor.gridSettings.gridSize;
    const elementGapMm = currentFloor.gridSettings.elementGap;

    const gapPx = Math.round(elementGapMm * scaleFactor);
    const TOL = 24;

    function snapAxis(pos: number, size: number, leftEdges: number[], rightEdges: number[]): number {
      const candidates: number[] = [];
      // Snap to other.right + gap
      for (const e of rightEdges) {
        candidates.push(Math.round(e + gapPx));
      }
      // Snap to other.left - gap - size
      for (const e of leftEdges) {
        candidates.push(Math.round(e - gapPx - size));
      }
      let best = Math.round(pos);
      let dist = Infinity;
      for (const c of candidates) {
        const d = Math.abs(Math.round(pos) - c);
        if (d < dist) {
          dist = d;
          best = c;
        }
      }
      return dist < TOL ? Math.round(best) : Math.round(pos);
    }

    const onMoving = (opt: any) => {
      if (snapMode !== 'element' && snapMode !== 'grid') return;
      const obj = opt.target;
      let left = Math.round(obj.left!);
      let top = Math.round(obj.top!);
      const bObj = obj.getBoundingRect(true);
      const myW = Math.round(bObj.width),
        myH = Math.round(bObj.height);

      // Grid-snap - ensure integers
      if (snapMode === 'grid') {
        const gridPx = Math.round(gridSizeMm * scaleFactor);
        left = Math.round(Math.round(left / gridPx) * gridPx);
        top = Math.round(Math.round(top / gridPx) * gridPx);
      }

      // Element-snap - ensure integers
      if (snapMode === 'element') {
        const leftEdges: number[] = [];
        const rightEdges: number[] = [];
        const topEdges: number[] = [];
        const bottomEdges: number[] = [];

        canvas.getObjects().forEach(o => {
          if ((o as any).isModule && o !== obj) {
            const b = (o as any).getBoundingRect(true);
            leftEdges.push(Math.round(b.left));
            rightEdges.push(Math.round(b.left + b.width));
            topEdges.push(Math.round(b.top));
            bottomEdges.push(Math.round(b.top + b.height));
          }
        });

        // Snap X-axis - ensure integers
        left = snapAxis(left, myW, leftEdges, rightEdges);
        // Snap Y-axis - ensure integers
        top = snapAxis(top, myH, topEdges, bottomEdges);
      }

      obj.set({ left: Math.round(left), top: Math.round(top) });
    };

    canvas.on('object:moving', onMoving);
    return () => void canvas.off('object:moving', onMoving);
  }, [canvas, scaleFactor]);
}
