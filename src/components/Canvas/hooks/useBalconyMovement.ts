// src/components/Canvas/hooks/useBalconyMovement.ts
import { useEffect } from 'react';
import type { Canvas } from 'fabric';
import { useObjectStore } from '@/state/objectStore';
import { useCanvasStore } from '@/state/canvasStore';

export default function useBalconyMovement(canvas: Canvas | null) {
  const updateBalcony = useObjectStore(s => s.updateBalcony);
  const balconies = useObjectStore(s => s.balconies);
  const modules = useObjectStore(s => s.modules);
  const scale = useCanvasStore(s => s.scaleFactor);

  useEffect(() => {
    if (!canvas) return;

    const onMoving = (opt: any) => {
      const obj = opt.target as any;
      const id = obj.isBalcony as string | undefined;
      if (!id) return;
      const bc = balconies.find(b => b.id === id)!;
      const mod = modules.find(m => m.id === bc.moduleId)!;
      // bounding box
      const b = obj.getBoundingRect(true);
      let left = b.left,
        top = b.top,
        w = b.width,
        h = b.height;

      // clamp based on wallSide
      const mx = mod.x0! * scale,
        my = mod.y0! * scale;
      const mw = mod.width! * scale,
        mh = mod.length! * scale;

      switch (bc.wallSide) {
        case 1: // top
          top = my - h;
          left = Math.min(Math.max(left, mx), mx + mw - w);
          break;
        case 3: // bottom
          top = my + mh;
          left = Math.min(Math.max(left, mx), mx + mw - w);
          break;
        case 2: // right
          left = mx + mw;
          top = Math.min(Math.max(top, my), my + mh - h);
          break;
        case 4: // left
          left = mx - w;
          top = Math.min(Math.max(top, my), my + mh - h);
          break;
      }

      obj.set({ left, top });
    };

    const onModified = (opt: any) => {
      const obj = opt.target as any;
      const id = obj.isBalcony as string | undefined;
      if (!id) return;
      const bc = balconies.find(b => b.id === id)!;
      const mod = modules.find(m => m.id === bc.moduleId)!;
      const b = obj.getBoundingRect(true);

      let distanceAlongWall: number, widthMm: number, lengthMm: number;

      switch (bc.wallSide) {
        case 1:
          distanceAlongWall = (b.left - mod.x0! * scale) / scale;
          widthMm = b.width / scale;
          lengthMm = b.height / scale;
          break;
        case 3:
          distanceAlongWall = (b.left - mod.x0! * scale) / scale;
          widthMm = b.width / scale;
          lengthMm = b.height / scale;
          break;
        case 2:
          distanceAlongWall = (b.top - mod.y0! * scale) / scale;
          widthMm = b.height / scale;
          lengthMm = b.width / scale;
          break;
        case 4:
          distanceAlongWall = (b.top - mod.y0! * scale) / scale;
          widthMm = b.height / scale;
          lengthMm = b.width / scale;
          break;
      }

      updateBalcony(id, {
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
