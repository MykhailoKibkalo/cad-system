// src/components/Canvas/hooks/useRenderBalconies.ts
import { useEffect } from 'react';
import type { Canvas } from 'fabric';
import * as fabric from 'fabric';
import { useCurrentFloorElements } from './useFloorElements';
import { useCanvasStore } from '@/state/canvasStore';
import { rectBottomToTopYMm } from '@/utils/coordinateTransform';
import { rotatePointAroundOrigin, transformWallSide } from '@/utils/rotationTransform';

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

      const rotation = mod.rotation || 0;
      
      // Transform the wall side based on rotation
      const effectiveWallSide = transformWallSide(bc.wallSide, rotation);

      // Convert module position from bottom-left to canvas coordinates
      const moduleTopYMm = rectBottomToTopYMm(mod.y0!, mod.length!, gridHeightM);
      const moduleBottomLeftX = Math.round(mod.x0! * scale);
      const moduleBottomLeftY = Math.round((moduleTopYMm + mod.length!) * scale);
      
      // Calculate balcony position in module coordinates (bottom-left system)
      let balconyX = 0;
      let balconyY = 0;
      let w = Math.round(bc.width * scale);
      let h = Math.round(bc.length * scale);

      // Position based on original wall side (before rotation)
      switch (bc.wallSide) {
        case 1: // bottom wall (Y=0)
          balconyX = bc.distanceAlongWall * scale;
          balconyY = -bc.width * scale; // Extend outward from wall
          break;
        case 2: // right wall (X=width)
          balconyX = mod.width! * scale;
          balconyY = bc.distanceAlongWall * scale;
          w = Math.round(bc.length * scale);
          h = Math.round(bc.width * scale);
          break;
        case 3: // top wall (Y=length)
          balconyX = bc.distanceAlongWall * scale;
          balconyY = mod.length! * scale;
          break;
        case 4: // left wall (X=0)
          balconyX = -bc.length * scale;
          balconyY = bc.distanceAlongWall * scale;
          w = Math.round(bc.length * scale);
          h = Math.round(bc.width * scale);
          break;
      }
      
      // If module is rotated, rotate the balcony position around module's bottom-left
      let finalBalconyX = balconyX;
      let finalBalconyY = balconyY;
      
      if (rotation !== 0) {
        const rotated = rotatePointAroundOrigin(
          balconyX,
          balconyY,
          0,
          0,
          rotation
        );
        finalBalconyX = rotated.x;
        finalBalconyY = rotated.y;
      }
      
      // Convert to canvas coordinates
      const left = Math.round(moduleBottomLeftX + finalBalconyX);
      const top = Math.round(moduleBottomLeftY - finalBalconyY - h); // Subtract height for top-left positioning

      const rect = new fabric.Rect({
        left: Math.round(left),
        top: Math.round(top),
        width: Math.round(w),
        height: Math.round(h),
        fill: 'rgba(150,0,200,0.3)',
        stroke: '#9600c8',
        strokeWidth: 2,
        strokeUniform: true,
        angle: 0, // Don't apply rotation to object - position is already rotated

        // IMPORTANT: Set origin to left/top for predictable positioning
        originX: 'left',
        originY: 'top',

        selectable: true,
        evented: true,
        hasControls: true,

        // Lock rotation but allow scaling
        lockRotation: true,

        // Disable pixel hit-test for better performance
        perPixelTargetFind: false,
      });
      
      // Hide rotation control
      rect.setControlsVisibility({
        mtr: false, // rotation control
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
