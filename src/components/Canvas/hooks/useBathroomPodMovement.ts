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

      // bounding box для врахування масштабів і поворотів - ensure integers
      const b = obj.getBoundingRect(true);
      const x1 = Math.round((Math.round(b.left) - Math.round(mod.x0! * scaleFactor)) / scaleFactor);
      const y1 = Math.round((Math.round(b.top) - Math.round(mod.y0! * scaleFactor)) / scaleFactor);
      const w = Math.round(Math.round(b.width) / scaleFactor);
      const h = Math.round(Math.round(b.height) / scaleFactor);

      updateBathroomPod(bpId, {
        x_offset: Math.round(x1),
        y_offset: Math.round(y1),
        width: Math.round(w),
        length: Math.round(h),
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
