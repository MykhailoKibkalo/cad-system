// src/components/Canvas/hooks/useCorridorTool.ts
import { useEffect, useRef } from 'react';
import {Canvas} from 'fabric';
import * as fabric from 'fabric';
import { useCanvasStore } from '@/state/canvasStore';
import { useObjectStore } from '@/state/objectStore';
import {useToolStore} from "@/state/toolStore";

export default function useCorridorTool(canvas: Canvas | null) {
  const tool = useToolStore(s => s.tool);
  const scaleFactor = useCanvasStore(s => s.scaleFactor);
  const floor = useCanvasStore(s => s.currentFloor);
  const addCorridor = useObjectStore(s => s.addCorridor);

  const startRef = useRef<{ x: number; y: number } | null>(null);
  const rectRef = useRef<fabric.Rect | null>(null);

  useEffect(() => {
    if (!canvas) return;

    const onMouseDown = (opt: any) => {
      if (tool !== 'corridor') return;
      const { x, y } = canvas.getPointer(opt.e);
      startRef.current = { x, y };
      const rect = new fabric.Rect({
        left: x,
        top: y,
        width: 0,
        height: 0,
        fill: 'rgba(128,128,128,0.3)',
        stroke: '#666',
        strokeDashArray: [4, 4],
        selectable: true,
        evented: true,
        hasControls: true,
        lockUniScaling: true,
        cornerColor: '#666',
      });
      canvas.add(rect);
      rectRef.current = rect;
    };

    const onMouseMove = (opt: any) => {
      if (tool !== 'corridor' || !startRef.current || !rectRef.current) return;
      const { x, y } = canvas.getPointer(opt.e);
      const { x: sx, y: sy } = startRef.current;
      rectRef.current.set({
        width: x - sx,
        height: y - sy,
      });
      canvas.requestRenderAll();
    };

    const onMouseUp = () => {
      if (tool !== 'corridor' || !startRef.current || !rectRef.current) return;
      const r = rectRef.current;
      if (r.width! > 0 && r.height! > 0) {
        const x1 = r.left!,
          y1 = r.top!;
        const x2 = x1 + r.width!,
          y2 = y1 + r.height!;
        addCorridor({
          id: Date.now().toString(),
          x1: x1 / scaleFactor,
          y1: y1 / scaleFactor,
          x2: x2 / scaleFactor,
          y2: y2 / scaleFactor,
          floor,
        });
      }
      canvas.remove(r);
      canvas.requestRenderAll();
      startRef.current = null;
      rectRef.current = null;
      useToolStore.getState().setTool('select');
    };

    canvas.on('mouse:down', onMouseDown);
    canvas.on('mouse:move', onMouseMove);
    canvas.on('mouse:up', onMouseUp);

    return () => {
      canvas.off('mouse:down', onMouseDown);
      canvas.off('mouse:move', onMouseMove);
      canvas.off('mouse:up', onMouseUp);
    };
  }, [canvas, tool, scaleFactor, floor, addCorridor]);
}
