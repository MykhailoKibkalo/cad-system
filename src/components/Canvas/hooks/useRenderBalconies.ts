// src/components/Canvas/hooks/useRenderBalconies.ts
import { useEffect } from 'react';
import type { Canvas } from 'fabric';
import * as fabric from 'fabric';
import { useCurrentFloorElements } from './useFloorElements';
import { useCanvasStore } from '@/state/canvasStore';
import { rectBottomToTopYMm } from '@/utils/coordinateTransform';

export default function useRenderBalconies(canvas: Canvas | null) {
  const { balconies, modules } = useCurrentFloorElements();
  const scale = useCanvasStore(s => s.scaleFactor);
  const gridHeightM = useCanvasStore(s => s.gridHeightM);

  useEffect(() => {
    if (!canvas) return;
    // почистимо старі
    canvas.getObjects().forEach(o => {
      if ((o as any).isBalcony) canvas.remove(o);
    });
    // і нарисуємо нові
    balconies.forEach(bc => {
      const mod = modules.find(m => m.id === bc.moduleId);
      if (!mod) return;

      // Convert module position from bottom-left to canvas coordinates
      const moduleTopYMm = rectBottomToTopYMm(mod.y0!, mod.length!, gridHeightM);
      let left = Math.round(mod.x0! * scale);
      let top = Math.round(moduleTopYMm * scale);
      let w = Math.round(bc.width * scale);
      let h = Math.round(bc.length * scale);

      switch (bc.wallSide) {
        case 1: // top (in bottom-left system, this is actually the "top" wall)
          left += Math.round(bc.distanceAlongWall * scale);
          top -= h; // Balcony extends upward from top wall
          break;
        case 2: // right
          left += Math.round(mod.width! * scale);
          top += Math.round(bc.distanceAlongWall * scale);
          w = Math.round(bc.length * scale);
          h = Math.round(bc.width * scale);
          break;
        case 3: // bottom (in bottom-left system, this is actually the "bottom" wall)
          left += Math.round(bc.distanceAlongWall * scale);
          top += Math.round(mod.length! * scale); // Balcony extends downward from bottom wall
          break;
        case 4: // left
          left -= Math.round(bc.length * scale);
          top += Math.round(bc.distanceAlongWall * scale);
          w = Math.round(bc.length * scale);
          h = Math.round(bc.width * scale);
          break;
      }

      const rect = new fabric.Rect({
        left: Math.round(left),
        top: Math.round(top),
        width: Math.round(w),
        height: Math.round(h),
        fill: 'rgba(150,0,200,0.3)',
        stroke: '#9600c8',
        strokeWidth: 2,
        strokeUniform: true,

        // IMPORTANT: Set origin to left/top for predictable movement
        originX: 'left',
        originY: 'top',

        selectable: true,
        evented: true,
        hasControls: true,

        // Lock rotation but allow scaling
        lockRotation: true,

        // Hide rotation control
        setControlsVisibility: {
          mtr: false, // rotation control
        } as any,

        // Disable pixel hit-test for better performance
        perPixelTargetFind: false,
      });
      (rect as any).isBalcony = bc.id;
      (rect as any).balconyData = {
        wallSide: bc.wallSide,
        moduleId: bc.moduleId,
        originalLeft: Math.round(left),
        originalTop: Math.round(top),
      };
      canvas.add(rect);
    });
    canvas.requestRenderAll();
  }, [canvas, balconies, modules, scale, gridHeightM]);
}
