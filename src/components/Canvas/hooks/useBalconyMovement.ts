// src/components/Canvas/hooks/useBalconyMovement.ts
import { useEffect } from 'react';
import type { Canvas } from 'fabric';
import { useObjectStore } from '@/state/objectStore';
import { useCanvasStore } from '@/state/canvasStore';

export default function useBalconyMovement(canvas: Canvas | null) {
  const balconies = useObjectStore(s => s.balconies);
  const modules = useObjectStore(s => s.modules);
  const updateBalcony = useObjectStore(s => s.updateBalcony);
  const scale = useCanvasStore(s => s.scaleFactor);

  useEffect(() => {
    if (!canvas) return;

    const onMoving = (opt: any) => {
      const obj: any = opt.target;
      const balconyId = obj.isBalcony as string | undefined;
      if (!balconyId) return;

      const bc = balconies.find(b => b.id === balconyId)!;
      const mod = modules.find(m => m.id === bc.moduleId)!;

      // Поточні pixel‐координати
      const brect = obj.getBoundingRect(true);
      let left = brect.left;
      let top = brect.top;
      const w = brect.width;
      const h = brect.height;

      // межі модуля
      const mx = mod.x0! * scale;
      const my = mod.y0! * scale;
      const mw = mod.width! * scale;
      const mh = mod.length! * scale;

      switch (bc.wallSide) {
        case 1: // верхня стіна — фіксуємо top, рухаємо left у межах [mx, mx+mw−w]
          top = my - h;
          left = Math.min(Math.max(left, mx), mx + mw - w);
          break;
        case 3: // нижня стіна — фіксуємо top, рухаємо left
          top = my + mh;
          left = Math.min(Math.max(left, mx), mx + mw - w);
          break;
        case 2: // права стіна — фіксуємо left, рухаємо top у межах [my, my+mh−h]
          left = mx + mw;
          top = Math.min(Math.max(top, my), my + mh - h);
          break;
        case 4: // ліва стіна — фіксуємо left, рухаємо top
          left = mx - w;
          top = Math.min(Math.max(top, my), my + mh - h);
          break;
      }

      obj.set({ left, top });
      obj.setCoords();
    };

    const onModified = (opt: any) => {
      const obj: any = opt.target;
      const balconyId = obj.isBalcony as string | undefined;
      if (!balconyId) return;

      const bc = balconies.find(b => b.id === balconyId)!;
      const mod = modules.find(m => m.id === bc.moduleId)!;
      const brect = obj.getBoundingRect(true);

      let distanceAlongWall: number, widthMm: number, lengthMm: number;

      switch (bc.wallSide) {
        case 1:
        case 3:
          distanceAlongWall = (brect.left - mod.x0! * scale) / scale;
          widthMm = brect.width / scale;
          lengthMm = brect.height / scale;
          break;
        case 2:
        case 4:
          distanceAlongWall = (brect.top - mod.y0! * scale) / scale;
          widthMm = brect.height / scale;
          lengthMm = brect.width / scale;
          break;
      }

      updateBalcony(balconyId, {
        distanceAlongWall,
        width: widthMm,
        length: lengthMm,
      });
    };

    canvas.on('object:moving', onMoving);
    canvas.on('object:modified', onModified);

    return () => {
      canvas.off('object:moving', onMoving);
      canvas.off('object:modified', onModified);
    };
  }, [canvas, balconies, modules, scale, updateBalcony]);
}
