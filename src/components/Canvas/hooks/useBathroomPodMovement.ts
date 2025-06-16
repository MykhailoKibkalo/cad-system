// src/components/Canvas/hooks/useBathroomPodMovement.ts
import { useEffect, useMemo } from 'react';
import type { Canvas } from 'fabric';
import { useObjectStore } from '@/state/objectStore';
import { useCanvasStore } from '@/state/canvasStore';
import { useCurrentFloorElements } from './useFloorElements';
import { rectBottomToTopYMm } from '@/utils/coordinateTransform';

export default function useBathroomPodMovement(canvas: Canvas | null) {
  const updateBathroomPod = useObjectStore(s => s.updateBathroomPod);
  const floorElements = useCurrentFloorElements();
  const scaleFactor = useCanvasStore(s => s.scaleFactor);
  const gridHeightM = useCanvasStore(s => s.gridHeightM);
  
  // Use useMemo to ensure stable references for dependency array
  const bathroomPods = useMemo(() => floorElements.bathroomPods || [], [floorElements.bathroomPods]);
  const modules = useMemo(() => floorElements.modules || [], [floorElements.modules]);

  useEffect(() => {
    if (!canvas) return;

    // Функція обмеження в межах модуля при переміщенні
    const onMoving = (opt: any) => {
      const obj = opt.target as any;
      const bpId = obj.isBathroomPod as string | undefined;
      if (!bpId) return;

      const bp = bathroomPods.find(b => b.id === bpId);
      const mod = modules.find(m => m.id === bp?.moduleId);
      if (!bp || !mod) return;

      // Convert module boundaries to canvas coordinates
      const moduleTopYMm = rectBottomToTopYMm(mod.y0!, mod.length!, gridHeightM);
      const modLeft = Math.round(mod.x0! * scaleFactor);
      const modTop = Math.round(moduleTopYMm * scaleFactor);
      const modRight = modLeft + Math.round(mod.width! * scaleFactor);
      const modBottom = modTop + Math.round(mod.length! * scaleFactor);

      // розміри прямокутника - ensure integers
      const rectW = Math.round(obj.getScaledWidth());
      const rectH = Math.round(obj.getScaledHeight());

      // обчислюємо нові координати з кліпом - ensure integers
      let left = Math.round(obj.left!);
      let top = Math.round(obj.top!);

      // clamp X
      if (left < modLeft) left = modLeft;
      if (left + rectW > modRight) left = modRight - rectW;

      // clamp Y
      if (top < modTop) top = modTop;
      if (top + rectH > modBottom) top = modBottom - rectH;

      // застосовуємо - ensure integers
      obj.set({ left: Math.round(left), top: Math.round(top) });
    };

    // Оновлення даних після завершення переміщення
    const onModified = (opt: any) => {
      const obj = opt.target as any;
      const bpId = obj.isBathroomPod as string | undefined;
      if (!bpId) return;

      const bp = bathroomPods.find(b => b.id === bpId);
      const mod = modules.find(m => m.id === bp?.moduleId);
      if (!bp || !mod) return;

      // Calculate position relative to parent module in bottom-left coordinates
      const objLeft = Math.round(obj.left || 0);
      const objTop = Math.round(obj.top || 0);
      const objHeight = Math.round(obj.getScaledHeight());
      
      // Convert module position to canvas coordinates
      const moduleTopYMm = rectBottomToTopYMm(mod.y0!, mod.length!, gridHeightM);
      const moduleLeft = Math.round(mod.x0! * scaleFactor);
      const moduleTop = Math.round(moduleTopYMm * scaleFactor);
      
      // Calculate offsets relative to module
      const x1 = Math.round((objLeft - moduleLeft) / scaleFactor);
      // For Y, convert canvas position back to bottom-left relative position
      const canvasYFromModuleTop = objTop - moduleTop;
      const y1 = Math.round((mod.length! - (canvasYFromModuleTop / scaleFactor) - (objHeight / scaleFactor)));

      updateBathroomPod(bpId, {
        x_offset: Math.round(x1),
        y_offset: Math.round(y1),
        // Don't update width/length during movement - only during resize
      });
    };

    canvas.on('object:moving', onMoving);
    canvas.on('object:modified', onModified);

    return () => {
      canvas.off('object:moving', onMoving);
      canvas.off('object:modified', onModified);
    };
  }, [canvas, bathroomPods, modules, scaleFactor, gridHeightM, updateBathroomPod]);
}
