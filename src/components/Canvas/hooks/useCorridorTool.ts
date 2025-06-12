// src/components/Canvas/hooks/useCorridorTool.ts
import { useEffect, useRef } from 'react';
import * as fabric from 'fabric';
import { Canvas } from 'fabric';
import { useCanvasStore } from '@/state/canvasStore';
import { useObjectStore } from '@/state/objectStore';
import { useToolStore } from '@/state/toolStore';
import { topToBottomYMm } from '@/utils/coordinateTransform';

export default function useCorridorTool(canvas: Canvas | null) {
  const tool = useToolStore(s => s.tool);
  const scaleFactor = useCanvasStore(s => s.scaleFactor);
  const floor = useCanvasStore(s => s.currentFloor);
  const gridHeightM = useCanvasStore(s => s.gridHeightM);
  const addCorridor = useObjectStore(s => s.addCorridor);

  const startRef = useRef<{ x: number; y: number } | null>(null);
  const rectRef = useRef<fabric.Rect | null>(null);

  useEffect(() => {
    if (!canvas) return;

    const onMouseDown = (opt: any) => {
      if (tool !== 'corridor') return;
      const { x, y } = canvas.getPointer(opt.e);
      // Ensure integer coordinates
      const xInt = Math.round(x);
      const yInt = Math.round(y);
      startRef.current = { x: xInt, y: yInt };
      const rect = new fabric.Rect({
        left: Math.round(xInt),
        top: Math.round(yInt),
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
      // Ensure integer coordinates
      const xInt = Math.round(x);
      const yInt = Math.round(y);
      const { x: sx, y: sy } = startRef.current;
      rectRef.current.set({
        width: Math.round(xInt - sx),
        height: Math.round(yInt - sy),
      });
      canvas.requestRenderAll();
    };

    const onMouseUp = () => {
      if (tool !== 'corridor' || !startRef.current || !rectRef.current) return;
      const r = rectRef.current;
      if (r.width! > 0 && r.height! > 0) {
        const x1Px = Math.round(r.left!);
        const y1Px = Math.round(r.top!);
        const x2Px = Math.round(x1Px + r.width!);
        const y2Px = Math.round(y1Px + r.height!);
        
        // Convert to mm
        const x1Mm = Math.round(x1Px / scaleFactor);
        const y1TopMm = Math.round(y1Px / scaleFactor);
        const x2Mm = Math.round(x2Px / scaleFactor);
        const y2TopMm = Math.round(y2Px / scaleFactor);
        
        // Convert Y coordinates from top-left to bottom-left
        const y1BottomMm = topToBottomYMm(y1TopMm, gridHeightM);
        const y2BottomMm = topToBottomYMm(y2TopMm, gridHeightM);
        
        // Store with bottom-left Y coordinates (smaller Y is bottom)
        addCorridor({
          id: Date.now().toString(),
          x1: x1Mm,
          y1: Math.min(y1BottomMm, y2BottomMm), // bottom edge
          x2: x2Mm,
          y2: Math.max(y1BottomMm, y2BottomMm), // top edge
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
  }, [canvas, tool, scaleFactor, floor, gridHeightM, addCorridor]);
}
