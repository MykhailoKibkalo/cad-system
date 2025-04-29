// src/components/Canvas/hooks/useGrid.ts
import React, { useEffect } from 'react';
import { Canvas, Line } from 'fabric';
import { DEFAULT_GRID_MM } from '@/utils/fabricUtils';

export default function useGrid(
  canvasRef: Canvas | null,
  scaleFactor: number,
  gridMm: number = DEFAULT_GRID_MM
) {
  useEffect(() => {
    const canvas = canvasRef;
    if (!canvas) return;

    // очистити попередню
    canvas.getObjects().forEach(o => {
      if ((o as any).isGrid) canvas.remove(o);
    });

    const gridPx = gridMm * scaleFactor;
    const w = canvas.getWidth();
    const h = canvas.getHeight();

    // вертикальні
    for (let x = 0; x <= w; x += gridPx) {
      const line = new Line([x, 0, x, h], {
        stroke: '#ddd',
        selectable: false,
        evented: false,
      });
      (line as any).isGrid = true;
      canvas.add(line);
      canvas.sendObjectToBack(line);
    }
    // горизонтальні
    for (let y = 0; y <= h; y += gridPx) {
      const line = new Line([0, y, w, y], {
        stroke: '#ddd',
        selectable: false,
        evented: false,
      });
      (line as any).isGrid = true;
      canvas.add(line);
      canvas.sendObjectToBack(line);
    }

    canvas.requestRenderAll();
  }, [canvasRef, scaleFactor, gridMm]);
}
