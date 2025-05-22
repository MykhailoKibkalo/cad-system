import { useEffect, useRef } from 'react';
import { Canvas, Rect } from 'fabric';
import { useToolStore } from '@/state/toolStore';
import { useObjectStore } from '@/state/objectStore';
import { useCanvasStore } from '@/state/canvasStore';

export default function useBathroomPodTool(canvas: Canvas | null) {
  const tool = useToolStore(s => s.tool);
  const setTool = useToolStore(s => s.setTool);
  const addBathroomPod = useObjectStore(s => s.addBathroomPod);
  const modules = useObjectStore(s => s.modules);

  const scaleFactor = useCanvasStore(s => s.scaleFactor);
  const snapMode    = useCanvasStore(s => s.snapMode);
  const gridSizeMm  = useCanvasStore(s => s.gridSizeMm);

  const startRef = useRef<{ x: number; y: number } | null>(null);
  const rectRef  = useRef<Rect | null>(null);
  const parentModuleId = useRef<string | null>(null);

  useEffect(() => {
    if (!canvas) return;

    const onMouseDown = (opt: any) => {
      if (tool !== 'bathroomPod') return;
      const p = canvas.getPointer(opt.e);
      // знаходимо модуль під курсором
      const hit = canvas.getObjects().find(o => (o as any).isModule && o.containsPoint!(p));
      if (!hit) return;
      parentModuleId.current = (hit as any).isModule as string;

      let x = p.x, y = p.y;
      if (snapMode === 'grid') {
        const g = gridSizeMm * scaleFactor;
        x = Math.round(x / g) * g;
        y = Math.round(y / g) * g;
      }
      startRef.current = { x, y };

      const r = new Rect({
        left: x,
        top: y,
        width: 0,
        height: 0,
        fill: 'rgba(0,150,200,0.3)',
        stroke: '#0096c8',
        strokeWidth: 1,
        selectable: false,
        evented: false,
      });
      rectRef.current = r;
      canvas.add(r);
    };

    const onMouseMove = (opt: any) => {
      if (tool !== 'bathroomPod' || !startRef.current || !rectRef.current) return;
      const p = canvas.getPointer(opt.e);
      let x2 = p.x, y2 = p.y;
      if (snapMode === 'grid') {
        const g = gridSizeMm * scaleFactor;
        x2 = Math.round(x2 / g) * g;
        y2 = Math.round(y2 / g) * g;
      }
      const { x: x1, y: y1 } = startRef.current;
      const w = x2 - x1, h = y2 - y1;
      rectRef.current.set({
        left:  w < 0 ? x2 : x1,
        top:   h < 0 ? y2 : y1,
        width: Math.abs(w),
        height: Math.abs(h),
      });
      canvas.requestRenderAll();
    };

    const onMouseUp = () => {
      if (tool !== 'bathroomPod' || !startRef.current || !rectRef.current) return;
      const r = rectRef.current;
      const mod = modules.find(m => m.id === parentModuleId.current);
      if (r.width! > 0 && r.height! > 0 && mod) {
        const leftPx   = r.left!;
        const topPx    = r.top!;
        const widthPx  = r.width!;
        const heightPx = r.height!;

        const x_offset = (leftPx - mod.x0! * scaleFactor) / scaleFactor;
        const y_offset = (topPx  - mod.y0! * scaleFactor) / scaleFactor;
        const width    = widthPx  / scaleFactor;
        const length   = heightPx / scaleFactor;

        const id = `BP${Date.now()}`;
        addBathroomPod({
          id,
          moduleId: mod.id,
          name: id,
          width,
          length,
          x_offset,
          y_offset,
          type: 'F',
        });
      }
      // cleanup & повернення до select
      if (r) canvas.remove(r);
      rectRef.current = null;
      startRef.current = null;
      parentModuleId.current = null;
      setTool('select');
      canvas.requestRenderAll();
    };

    canvas.on('mouse:down', onMouseDown);
    canvas.on('mouse:move', onMouseMove);
    canvas.on('mouse:up',   onMouseUp);

    return () => {
      canvas.off('mouse:down', onMouseDown);
      canvas.off('mouse:move', onMouseMove);
      canvas.off('mouse:up',   onMouseUp);
    };
  }, [
    canvas,
    tool,
    modules,
    scaleFactor,
    snapMode,
    gridSizeMm,
    addBathroomPod,
    setTool,
  ]);
}
