// src/components/Canvas/hooks/useRenderOpenings.ts
import {useEffect} from 'react';
import {Canvas, Rect} from 'fabric';
import {useCurrentFloorElements} from './useFloorElements';
import {useCanvasStore} from '@/state/canvasStore';
import { rectBottomToTopYMm } from '@/utils/coordinateTransform';
import { rotatePointAroundOrigin, transformWallSide } from '@/utils/rotationTransform';


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

      const rotation = mod.rotation || 0;

      // Convert module position from bottom-left to canvas coordinates
      const moduleTopYMm = rectBottomToTopYMm(mod.y0, mod.length, gridHeightM);
      const moduleBottomLeftX = Math.round(mod.x0 * scale);
      const moduleBottomLeftY = Math.round((moduleTopYMm + mod.length) * scale);

      // товщина маркера в px
      const THICK = 3;

      // Calculate opening position in module coordinates (bottom-left system)
      let openingX = 0;
      let openingY = 0;
      let rw: number, rh: number;

      // Position based on original wall side (before rotation)
      switch (o.wallSide) {
        case 1: // bottom wall (Y=0)
          openingX = o.distanceAlongWall * scale;
          openingY = 0;
          rw = Math.round(o.width * scale);
          rh = THICK;
          break;
        case 2: // right wall (X=width)
          openingX = mod.width * scale;
          openingY = o.distanceAlongWall * scale;
          rw = THICK;
          rh = Math.round(o.width * scale);
          break;
        case 3: // top wall (Y=length)
          openingX = o.distanceAlongWall * scale;
          openingY = mod.length * scale;
          rw = Math.round(o.width * scale);
          rh = THICK;
          break;
        case 4: // left wall (X=0)
          openingX = 0;
          openingY = o.distanceAlongWall * scale;
          rw = THICK;
          rh = Math.round(o.width * scale);
          break;
        default:
          openingX = 0;
          openingY = 0;
          rw = THICK;
          rh = THICK;
      }

      // If module is rotated, rotate the opening position around module's bottom-left
      let finalOpeningX = openingX;
      let finalOpeningY = openingY;

      if (rotation !== 0) {
        const rotated = rotatePointAroundOrigin(
          openingX,
          openingY,
          0,
          0,
          rotation
        );
        finalOpeningX = rotated.x;
        finalOpeningY = rotated.y;
      }

      // Convert to canvas coordinates
      const left = Math.round(moduleBottomLeftX + finalOpeningX);
      const top = Math.round(moduleBottomLeftY - finalOpeningY - rh); // Subtract height for top-left positioning

      const mark = new Rect({
        left: Math.round(left),
        top: Math.round(top),
        width: Math.round(rw),
        height: Math.round(rh),
        fill: 'rgba(245,158,11,0.6)',
        selectable: false,
        evented: false,
        angle: 0, // Don't apply rotation to object - position is already rotated
        originX: 'left',
        originY: 'top',
      });
      (mark as any).isOpening = o.id;
      canvas.add(mark);
    });

    canvas.requestRenderAll();
  }, [canvas, openings, modules, scale, gridHeightM]);
}
