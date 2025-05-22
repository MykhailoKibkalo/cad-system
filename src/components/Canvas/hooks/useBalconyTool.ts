// src/components/Canvas/hooks/useBalconyTool.ts
import { useEffect, useRef } from 'react';
import type { Canvas } from 'fabric';
import * as fabric from 'fabric';
import { useToolStore } from '@/state/toolStore';
import { useObjectStore } from '@/state/objectStore';
import { useCanvasStore } from '@/state/canvasStore';

export default function useBalconyTool(canvas: Canvas | null) {
  const tool = useToolStore(s => s.tool);
  const setTool = useToolStore(s => s.setTool);
  const modules = useObjectStore(s => s.modules);
  const addBalcony = useObjectStore(s => s.addBalcony);
  const scale = useCanvasStore(s => s.scaleFactor);

  const rectRef = useRef<fabric.Rect | null>(null);
  const startRef = useRef<{ x: number; y: number } | null>(null);
  const sideRef = useRef<1 | 2 | 3 | 4 | null>(null);
  const parentRef = useRef<string | null>(null);

  useEffect(() => {
    if (!canvas || tool !== 'balcony') return;

    const thresholdPx = 10;

    const onMouseDown = (opt: any) => {
      const p = canvas.getPointer(opt.e);
      // знайти модуль поруч зі стіною в межах thresholdPx
      const mod = modules.find(m => {
        const left = m.x0! * scale,
          top = m.y0! * scale;
        const w = m.width! * scale,
          h = m.length! * scale;
        const inX = p.x >= left - thresholdPx && p.x <= left + w + thresholdPx;
        const inY = p.y >= top - thresholdPx && p.y <= top + h + thresholdPx;
        // top side
        if (inX && Math.abs(p.y - top) <= thresholdPx) return true;
        // bottom
        if (inX && Math.abs(p.y - (top + h)) <= thresholdPx) return true;
        // left
        if (inY && Math.abs(p.x - left) <= thresholdPx) return true;
        // right
        if (inY && Math.abs(p.x - (left + w)) <= thresholdPx) return true;
        return false;
      });
      if (!mod) {
        setTool('select');
        return;
      }

      // зберігаємо
      parentRef.current = mod.id;
      startRef.current = p;

      // визначаємо сторону
      const left = mod.x0! * scale,
        top = mod.y0! * scale;
      const w = mod.width! * scale,
        h = mod.length! * scale;
      const dTop = Math.abs(p.y - top);
      const dBottom = Math.abs(p.y - (top + h));
      const dLeft = Math.abs(p.x - left);
      const dRight = Math.abs(p.x - (left + w));
      const m = Math.min(dTop, dRight, dBottom, dLeft);
      sideRef.current = m === dTop ? 1 : m === dRight ? 2 : m === dBottom ? 3 : 4;

      // малюємо тимчасовий прямокутник
      const rect = new fabric.Rect({
        left: p.x,
        top: p.y,
        width: 0,
        height: 0,
        fill: 'rgba(200,150,0,0.3)',
        stroke: '#c89600',
        selectable: false,
        evented: false,
      });
      rectRef.current = rect;
      canvas.add(rect);
    };

    const onMouseMove = (opt: any) => {
      const rect = rectRef.current;
      const start = startRef.current;
      const side = sideRef.current;
      if (!rect || !start || !side) return;
      const p = canvas.getPointer(opt.e);
      let x = start.x,
        y = start.y,
        w = 0,
        h = 0;

      switch (side) {
        case 1: // top
          x = p.x < start.x ? p.x : start.x;
          w = Math.abs(p.x - start.x);
          y = start.y;
          h = p.y - start.y;
          break;
        case 3: // bottom
          x = p.x < start.x ? p.x : start.x;
          w = Math.abs(p.x - start.x);
          y = p.y;
          h = start.y - p.y;
          break;
        case 2: // right
          x = start.x;
          w = p.x - start.x;
          y = p.y < start.y ? p.y : start.y;
          h = Math.abs(p.y - start.y);
          break;
        case 4: // left
          x = p.x;
          w = start.x - p.x;
          y = p.y < start.y ? p.y : start.y;
          h = Math.abs(p.y - start.y);
          break;
      }

      rect.set({
        left: x,
        top: y,
        width: Math.abs(w),
        height: Math.abs(h),
      });
      canvas.requestRenderAll();
    };

    const onMouseUp = () => {
      const rect = rectRef.current;
      const start = startRef.current;
      const side = sideRef.current;
      const parent = parentRef.current;
      if (rect && start && side && parent) {
        const mod = modules.find(m => m.id === parent)!;
        const leftPx = rect.left!,
          topPx = rect.top!;
        const wPx = rect.getScaledWidth(),
          hPx = rect.getScaledHeight();

        let distanceAlongWall: number, widthMm: number, lengthMm: number;

        if (side === 1 || side === 3) {
          distanceAlongWall = (leftPx - mod.x0! * scale) / scale;
          widthMm = wPx / scale;
          lengthMm = hPx / scale;
        } else {
          distanceAlongWall = (topPx - mod.y0! * scale) / scale;
          widthMm = hPx / scale;
          lengthMm = wPx / scale;
        }

        addBalcony({
          id: `BC${Date.now()}`,
          moduleId: parent,
          name: `BC${Date.now()}`,
          width: widthMm,
          length: lengthMm,
          distanceAlongWall,
          wallSide: side,
        });
      }

      if (rect) canvas.remove(rect);
      rectRef.current = null;
      startRef.current = null;
      sideRef.current = null;
      parentRef.current = null;
      setTool('select');
      canvas.requestRenderAll();
    };

    canvas.on('mouse:down', onMouseDown);
    canvas.on('mouse:move', onMouseMove);
    canvas.on('mouse:up', onMouseUp);

    return () => {
      canvas.off('mouse:down', onMouseDown);
      canvas.off('mouse:move', onMouseMove);
      canvas.off('mouse:up', onMouseUp);
    };
  }, [canvas, tool, modules, scale, addBalcony, setTool]);
}
