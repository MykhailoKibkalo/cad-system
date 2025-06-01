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
      // Round pointer coordinates to integers
      const px = Math.round(p.x);
      const py = Math.round(p.y);

      // знайти модуль поруч зі стіною в межах thresholdPx
      const mod = modules.find(m => {
        const left = Math.round(m.x0! * scale),
          top = Math.round(m.y0! * scale);
        const w = Math.round(m.width! * scale),
          h = Math.round(m.length! * scale);
        const inX = px >= left - thresholdPx && px <= left + w + thresholdPx;
        const inY = py >= top - thresholdPx && py <= top + h + thresholdPx;
        // top side
        if (inX && Math.abs(py - top) <= thresholdPx) return true;
        // bottom
        if (inX && Math.abs(py - (top + h)) <= thresholdPx) return true;
        // left
        if (inY && Math.abs(px - left) <= thresholdPx) return true;
        // right
        if (inY && Math.abs(px - (left + w)) <= thresholdPx) return true;
        return false;
      });
      if (!mod) {
        setTool('select');
        return;
      }

      // зберігаємо
      parentRef.current = mod.id;
      startRef.current = { x: px, y: py };

      // визначаємо сторону
      const left = Math.round(mod.x0! * scale),
        top = Math.round(mod.y0! * scale);
      const w = Math.round(mod.width! * scale),
        h = Math.round(mod.length! * scale);
      const dTop = Math.abs(py - top);
      const dBottom = Math.abs(py - (top + h));
      const dLeft = Math.abs(px - left);
      const dRight = Math.abs(px - (left + w));
      const m = Math.min(dTop, dRight, dBottom, dLeft);
      sideRef.current = m === dTop ? 1 : m === dRight ? 2 : m === dBottom ? 3 : 4;

      // малюємо тимчасовий прямокутник
      const rect = new fabric.Rect({
        left: Math.round(px),
        top: Math.round(py),
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
      // Round coordinates to integers
      const px = Math.round(p.x);
      const py = Math.round(p.y);
      let x = start.x,
        y = start.y,
        w = 0,
        h = 0;

      switch (side) {
        case 1: // top
          x = px < start.x ? px : start.x;
          w = Math.abs(px - start.x);
          y = start.y;
          h = py - start.y;
          break;
        case 3: // bottom
          x = px < start.x ? px : start.x;
          w = Math.abs(px - start.x);
          y = py;
          h = start.y - py;
          break;
        case 2: // right
          x = start.x;
          w = px - start.x;
          y = py < start.y ? py : start.y;
          h = Math.abs(py - start.y);
          break;
        case 4: // left
          x = px;
          w = start.x - px;
          y = py < start.y ? py : start.y;
          h = Math.abs(py - start.y);
          break;
      }

      rect.set({
        left: Math.round(x),
        top: Math.round(y),
        width: Math.round(Math.abs(w)),
        height: Math.round(Math.abs(h)),
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
        const leftPx = Math.round(rect.left!),
          topPx = Math.round(rect.top!);
        const wPx = Math.round(rect.getScaledWidth()),
          hPx = Math.round(rect.getScaledHeight());

        let distanceAlongWall: number, widthMm: number, lengthMm: number;

        if (side === 1 || side === 3) {
          distanceAlongWall = Math.round((leftPx - Math.round(mod.x0! * scale)) / scale);
          widthMm = Math.round(wPx / scale);
          lengthMm = Math.round(hPx / scale);
        } else {
          distanceAlongWall = Math.round((topPx - Math.round(mod.y0! * scale)) / scale);
          widthMm = Math.round(hPx / scale);
          lengthMm = Math.round(wPx / scale);
        }

        addBalcony({
          id: `BC${Date.now()}`,
          moduleId: parent,
          name: `BC${Date.now()}`,
          width: Math.round(widthMm),
          length: Math.round(lengthMm),
          distanceAlongWall: Math.round(distanceAlongWall),
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
