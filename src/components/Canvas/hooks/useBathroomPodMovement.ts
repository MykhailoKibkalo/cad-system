// src/components/Canvas/hooks/useBathroomPodMovement.ts
import { useEffect } from 'react';
import type { Canvas } from 'fabric';
import { useObjectStore } from '@/state/objectStore';
import { useCanvasStore } from '@/state/canvasStore';
import { useCurrentFloorElements } from './useFloorElements';

export default function useBathroomPodMovement(canvas: Canvas | null) {
  const updateBathroomPod = useObjectStore(s => s.updateBathroomPod);
  const { bathroomPods, modules } = useCurrentFloorElements();
  const scaleFactor = useCanvasStore(s => s.scaleFactor);

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

      // межі модуля в пікселях - ensure integers
      const modLeft = Math.round(mod.x0! * scaleFactor);
      const modTop = Math.round(mod.y0! * scaleFactor);
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

      // Only update position during movement, not dimensions
      // Calculate position relative to parent module
      const objLeft = Math.round(obj.left || 0);
      const objTop = Math.round(obj.top || 0);
      const moduleLeft = Math.round(mod.x0! * scaleFactor);
      const moduleTop = Math.round(mod.y0! * scaleFactor);
      
      const x1 = Math.round((objLeft - moduleLeft) / scaleFactor);
      const y1 = Math.round((objTop - moduleTop) / scaleFactor);

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
  }, [canvas, bathroomPods, modules, scaleFactor, updateBathroomPod]);
}
