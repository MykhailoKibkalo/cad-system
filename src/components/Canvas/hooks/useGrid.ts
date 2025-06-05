// src/components/Canvas/hooks/useGrid.ts
import { useEffect } from 'react';
import type { Canvas } from 'fabric';
import * as fabric from 'fabric';
import { useCanvasStore } from '@/state/canvasStore';

export default function useGrid(
    canvas: Canvas | null,
    scaleFactor: number,
    gridMm: number = 100
) {
  const { zoomLevel } = useCanvasStore();

  useEffect(() => {
    if (!canvas) return;

    // 1) Створюємо pattern-канвас
    const basePx = Math.round(gridMm * scaleFactor);
    const size = Math.round(basePx * zoomLevel);
    const patternCanvas = document.createElement('canvas');
    patternCanvas.width = Math.round(size);
    patternCanvas.height = Math.round(size);
    const ctx = patternCanvas.getContext('2d')!;
    ctx.strokeStyle = '#9e9e9e';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, Math.round(size));
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.round(size), 0);
    ctx.stroke();

    // 2) Встановлюємо як backgroundColor
    //    (замість виклику неіснуючого setBackgroundColor)
    canvas.backgroundColor = new fabric.Pattern({ source: patternCanvas, repeat: 'repeat' }) as any;
    canvas.requestRenderAll();

    // 3) Затемнення поза робочою областю — додаємо прямокутник
    const workingPx = Math.round(1000 * scaleFactor * zoomLevel);
    const cover = new fabric.Rect({
      left: 0,
      top: 0,
      width: Math.round(workingPx),
      height: Math.round(workingPx),
      fill: 'rgba(255,255,255,0)', // прозорий всередині
      selectable: false,
      evented: false,
    });
    // темна підкладка поза зоною:
    // const overlay = new fabric.Rect({
    //   left: 0,
    //   top: 0,
    //   width: canvas.getWidth(),
    //   height: canvas.getHeight(),
    //   fill: 'rgba(0,0,0,0.1)',
    //   selectable: false,
    //   evented: false,
    // });

    // додаємо та штовхаємо вниз
    canvas.add(cover);
    // canvas.sendObjectToBack(overlay);
    canvas.sendObjectBackwards(cover);

    canvas.requestRenderAll();
  }, [canvas, scaleFactor, gridMm, zoomLevel]);
}
