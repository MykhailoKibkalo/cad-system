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
  const { zoomLevel, gridHeightM, gridWidthM } = useCanvasStore();

  useEffect(() => {
    if (!canvas) return;

    // Remove existing origin indicators and axis labels
    const existingIndicators = canvas.getObjects().filter((obj: any) =>
      obj.isOriginIndicator || obj.isAxisLabel || obj.isCover
    );
    existingIndicators.forEach(obj => canvas.remove(obj));

    // 1) Create pattern canvas
    const basePx = Math.round(gridMm * scaleFactor);
    const size = Math.round(basePx * zoomLevel);
    const patternCanvas = document.createElement('canvas');
    patternCanvas.width = Math.round(size);
    patternCanvas.height = Math.round(size);
    const ctx = patternCanvas.getContext('2d')!;
    ctx.strokeStyle = '#9e9e9e';
    ctx.lineWidth = 1;

    // Draw grid lines
    ctx.beginPath();
    // Vertical line
    ctx.moveTo(0, 0);
    ctx.lineTo(0, Math.round(size));
    // Horizontal line
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.round(size), 0);
    ctx.stroke();

    // 2) Set as background pattern
    canvas.backgroundColor = new fabric.Pattern({ source: patternCanvas, repeat: 'repeat' }) as any;
    canvas.requestRenderAll();

    // 3) Working area boundary
    const gridHeightPx = Math.round(gridHeightM * 1000 * scaleFactor * zoomLevel);
    const gridWidthPx = Math.round(gridWidthM * 1000 * scaleFactor * zoomLevel);

    const cover = new fabric.Rect({
      left: 0,
      top: 0,
      width: gridWidthPx,
      height: gridHeightPx,
      fill: 'rgba(255,255,255,0)', // transparent inside
      stroke: '#374151',
      strokeWidth: 2,
      selectable: false,
      evented: false,
    });
    (cover as any).isCover = true;

    // 4) Add origin indicator at bottom-left
    const originSize = 40;
    // const originIndicator = new fabric.Group([
    //   // Red X-axis arrow
    //   new fabric.Path('M 0 0 L 30 0 L 25 -3 M 30 0 L 25 3', {
    //     stroke: '#ef4444',
    //     strokeWidth: 2,
    //     fill: 'transparent',
    //   }),
    //   // Green Y-axis arrow
    //   new fabric.Path('M 0 0 L 0 -30 L -3 -25 M 0 -30 L 3 -25', {
    //     stroke: '#10b981',
    //     strokeWidth: 2,
    //     fill: 'transparent',
    //   }),
    //   // Origin point
    //   new fabric.Circle({
    //     left: -3,
    //     top: -3,
    //     radius: 3,
    //     fill: '#1f2937',
    //     stroke: '#1f2937',
    //   }),
    // ], {
    //   left: 10,
    //   top: gridHeightPx - originSize - 10, // Position at bottom-left
    //   selectable: false,
    //   evented: false,
    // });
    // (originIndicator as any).isOriginIndicator = true;

    // 5) Add axis labels
    // const xLabel = new fabric.Text('X', {
    //   left: 45,
    //   top: gridHeightPx - 25,
    //   fontSize: 14,
    //   fill: '#ef4444',
    //   fontFamily: 'Atkinson Hyperlegible, sans-serif',
    //   selectable: false,
    //   evented: false,
    // });
    // (xLabel as any).isAxisLabel = true;

    // const yLabel = new fabric.Text('Y', {
    //   left: 8,
    //   top: gridHeightPx - originSize - 35,
    //   fontSize: 14,
    //   fill: '#10b981',
    //   fontFamily: 'Atkinson Hyperlegible, sans-serif',
    //   selectable: false,
    //   evented: false,
    // });
    // (yLabel as any).isAxisLabel = true;

    // 6) Add origin coordinates label
    const originLabel = new fabric.Text('(0, 0)', {
      left: 8,
      top: gridHeightPx - 20,
      fontSize: 12,
      fill: '#6b7280',
      fontFamily: 'Atkinson Hyperlegible, sans-serif',
      selectable: false,
      evented: false,
    });
    (originLabel as any).isAxisLabel = true;

    // Add all elements
    canvas.add(cover);
    // canvas.add(originIndicator);
    // canvas.add(xLabel);
    // canvas.add(yLabel);
    canvas.add(originLabel);

    // Send to appropriate layers
    canvas.sendObjectBackwards(cover);
    // canvas.bringObjectToFront(originIndicator);
    // canvas.bringObjectToFront(xLabel);
    // canvas.bringObjectToFront(yLabel);
    canvas.bringObjectToFront(originLabel);

    canvas.requestRenderAll();
  }, [canvas, scaleFactor, gridMm, zoomLevel, gridHeightM, gridWidthM]);
}
