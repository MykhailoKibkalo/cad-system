// src/components/Canvas/hooks/useOpeningTool.ts
import { useEffect, useRef } from 'react';
import { Canvas, Rect } from 'fabric';
import { useToolStore } from '@/state/toolStore';
import { useObjectStore } from '@/state/objectStore';
import { useCanvasStore } from '@/state/canvasStore';
import { Opening } from '@/types/geometry';

export default function useOpeningTool(canvas: Canvas | null) {
  const tool = useToolStore(s => s.tool);
  const setTool = useToolStore(s => s.setTool);
  const addOpening = useObjectStore(s => s.addOpening);
  const scale = useCanvasStore(s => s.scaleFactor);
  const snapMode = useCanvasStore(s => s.snapMode);
  const gridMm = useCanvasStore(s => s.gridSizeMm);

  const startRef = useRef<{ x: number; y: number } | null>(null);
  const rectRef = useRef<Rect | null>(null);
  const moduleHitRef = useRef<any>(null); // тут зберігаємо модуль-попадання
  const parentModuleRef = useRef<string | null>(null);

  useEffect(() => {
    if (!canvas) return;

    const onMouseDown = (opt: any) => {
      if (tool !== 'opening') return;
      const p = canvas.getPointer(opt.e);

      // знаходимо, по якому Module клікнули
      const hit = canvas.getObjects().find(o => (o as any).isModule && o.containsPoint!(p));
      if (!hit) return;

      moduleHitRef.current = hit;
      parentModuleRef.current = (hit as any).isModule;

      let x = Math.round(p.x),
        y = Math.round(p.y);
      if (snapMode === 'grid') {
        const g = Math.round(gridMm * scale);
        x = Math.round(Math.round(x / g) * g);
        y = Math.round(Math.round(y / g) * g);
      }
      startRef.current = { x, y };

      const r = new Rect({
        left: Math.round(x),
        top: Math.round(y),
        width: 0,
        height: 0,
        fill: 'rgba(255,165,0,0.3)',
        stroke: '#fa8c16',
        strokeWidth: 1,
        selectable: false,
        evented: false,
      });
      rectRef.current = r;
      canvas.add(r);
    };

    const onMouseMove = (opt: any) => {
      if (tool !== 'opening' || !startRef.current || !rectRef.current) return;
      const p = canvas.getPointer(opt.e);
      let x2 = Math.round(p.x),
        y2 = Math.round(p.y);
      if (snapMode === 'grid') {
        const g = Math.round(gridMm * scale);
        x2 = Math.round(Math.round(x2 / g) * g);
        y2 = Math.round(Math.round(y2 / g) * g);
      }
      const { x: x1, y: y1 } = startRef.current;
      const w = x2 - x1,
        h = y2 - y1;
      rectRef.current.set({
        left: w < 0 ? x2 : x1,
        top: h < 0 ? y2 : y1,
        width: Math.round(Math.abs(w)),
        height: Math.round(Math.abs(h)),
      });
      canvas.requestRenderAll();
    };

    const onMouseUp = () => {
      if (tool !== 'opening' || !startRef.current || !rectRef.current || !moduleHitRef.current) return;
      const rect = rectRef.current;
      const w = Math.round(rect.width!),
        h = Math.round(rect.height!);
      if (w > 0 && h > 0 && parentModuleRef.current) {
        rect.set({ selectable: true, evented: true, hasControls: true });
        rect.setCoords();
        canvas.setActiveObject(rect);

        const id = Date.now().toString();
        (rect as any).isOpening = id;

        // Вираховуємо параметри opening відносно hit-модуля - ensure integers
        const hit = moduleHitRef.current;
        const moduleLeft = Math.round(hit.left! as number);
        const moduleTop = Math.round(hit.top! as number);

        const opening: Opening = {
          id,
          moduleId: parentModuleRef.current,
          wallSide: 1, // залишаємо заглушку, пізніше детектор стіни
          width: Math.round(w / scale),
          height: Math.round(h / scale),
          distanceAlongWall: Math.round((Math.round(rect.left!) - moduleLeft) / scale),
          yOffset: Math.round((Math.round(rect.top!) - moduleTop) / scale),
        };
        addOpening(opening);
        canvas.requestRenderAll();
      } else {
        canvas.remove(rect);
      }
      startRef.current = null;
      rectRef.current = null;
      moduleHitRef.current = null;
      parentModuleRef.current = null;
      setTool('select');
    };

    canvas.on('mouse:down', onMouseDown);
    canvas.on('mouse:move', onMouseMove);
    canvas.on('mouse:up', onMouseUp);

    return () => {
      canvas.off('mouse:down', onMouseDown);
      canvas.off('mouse:move', onMouseMove);
      canvas.off('mouse:up', onMouseUp);
    };
  }, [canvas, tool, scale, snapMode, gridMm, addOpening, setTool]);
}
