// src/components/Canvas/hooks/useRenderBathroomPods.ts
import { useEffect } from 'react';
import type { Canvas } from 'fabric';
import * as fabric from 'fabric';
import { useCurrentFloorElements } from './useFloorElements';
import { useCanvasStore } from '@/state/canvasStore';
import { rectBottomToTopYMm } from '@/utils/coordinateTransform';
import { rotatePointAroundOrigin } from '@/utils/rotationTransform';

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

      const rotation = mod.rotation || 0;

      // Convert module position from bottom-left to canvas coordinates
      const moduleTopYMm = rectBottomToTopYMm(mod.y0!, mod.length!, gridHeightM);
      const moduleBottomLeftX = Math.round(mod.x0! * scaleFactor);
      const moduleBottomLeftY = Math.round((moduleTopYMm + mod.length!) * scaleFactor); // Bottom edge in canvas coords
      
      // Calculate bathroom pod position in module coordinates (bottom-left system)
      const podBottomLeftX = bp.x_offset * scaleFactor;
      const podBottomLeftY = bp.y_offset * scaleFactor;
      
      // If module is rotated, rotate the bathroom pod position around module's bottom-left
      let finalPodX = podBottomLeftX;
      let finalPodY = podBottomLeftY;
      
      if (rotation !== 0) {
        const rotated = rotatePointAroundOrigin(
          podBottomLeftX,
          podBottomLeftY,
          0, // Module's bottom-left is our origin
          0,
          rotation
        );
        finalPodX = rotated.x;
        finalPodY = rotated.y;
      }
      
      // Convert to canvas coordinates (canvas Y is inverted)
      const left = Math.round(moduleBottomLeftX + finalPodX);
      const top = Math.round(moduleBottomLeftY - finalPodY - (bp.length * scaleFactor)); // Subtract height for top-left canvas positioning
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
        angle: 0, // Don't apply rotation to the object itself - position is already rotated
        originX: 'left',
        originY: 'top',

        // ← allow selection & dragging/resizing
        selectable: true,
        evented: true,
        hasControls: true,
        lockUniScaling: false,
        lockRotation: true, // Disable manual rotation
      });
      
      // Hide rotation control
      rect.setControlsVisibility({
        mtr: false, // rotation control
      });
      
      (rect as any).isBathroomPod = bp.id;
      canvas.add(rect);
      // можемо шанувати порядок шарів за потребою
    });

    canvas.requestRenderAll();
  }, [canvas, bathroomPods, modules, scaleFactor, gridHeightM]);
}
