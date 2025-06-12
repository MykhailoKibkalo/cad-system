// src/components/Canvas/hooks/useOriginIndicator.ts
import { useEffect } from 'react';
import type { Canvas } from 'fabric';
import * as fabric from 'fabric';
import { useCanvasStore } from '@/state/canvasStore';

export default function useOriginIndicator(canvas: Canvas | null) {
  const { gridHeightM, gridWidthM, scaleFactor, zoomLevel } = useCanvasStore();

  useEffect(() => {
    if (!canvas) return;

    // Remove existing origin indicators
    const existingIndicators = canvas.getObjects().filter((obj: any) => 
      obj.isOriginIndicator || obj.isAxisLabel
    );
    existingIndicators.forEach(obj => canvas.remove(obj));

    // Calculate grid dimensions in pixels
    const gridHeightPx = Math.round(gridHeightM * 1000 * scaleFactor * zoomLevel);
    const gridWidthPx = Math.round(gridWidthM * 1000 * scaleFactor * zoomLevel);
    
    // Get current viewport transform to position indicator correctly
    const vpt = canvas.viewportTransform || [1, 0, 0, 1, 0, 0];
    const canvasHeight = canvas.getHeight();
    
    // Calculate position for bottom-left corner (origin) in canvas coordinates
    // In canvas coordinates, bottom-left means we need to account for the viewport transform
    const originCanvasX = Math.round(-vpt[4]); // Account for pan X
    const originCanvasY = Math.round(canvasHeight + vpt[5] - gridHeightPx); // Account for pan Y and grid height
    
    // Add origin indicator at bottom-left
    const originSize = 40;
    const originIndicator = new fabric.Group([
      // Red X-axis arrow
      new fabric.Path('M 0 0 L 30 0 L 25 -3 M 30 0 L 25 3', {
        stroke: '#ef4444',
        strokeWidth: 2,
        fill: 'transparent',
      }),
      // Green Y-axis arrow pointing up
      new fabric.Path('M 0 0 L 0 -30 L -3 -25 M 0 -30 L 3 -25', {
        stroke: '#10b981',
        strokeWidth: 2,
        fill: 'transparent',
      }),
      // Origin point
      new fabric.Circle({
        left: -3,
        top: -3,
        radius: 3,
        fill: '#1f2937',
        stroke: '#1f2937',
      }),
    ], {
      left: Math.max(10, originCanvasX + 10),
      top: Math.min(canvasHeight - originSize - 10, originCanvasY - originSize - 10),
      selectable: false,
      evented: false,
    });
    (originIndicator as any).isOriginIndicator = true;

    // Add axis labels
    const xLabel = new fabric.Text('X', {
      left: Math.max(45, originCanvasX + 45),
      top: Math.min(canvasHeight - 25, originCanvasY - 25),
      fontSize: 14,
      fill: '#ef4444',
      fontFamily: 'Atkinson Hyperlegible, sans-serif',
      selectable: false,
      evented: false,
    });
    (xLabel as any).isAxisLabel = true;

    const yLabel = new fabric.Text('Y', {
      left: Math.max(8, originCanvasX + 8),
      top: Math.min(canvasHeight - originSize - 35, originCanvasY - originSize - 35),
      fontSize: 14,
      fill: '#10b981',
      fontFamily: 'Atkinson Hyperlegible, sans-serif',
      selectable: false,
      evented: false,
    });
    (yLabel as any).isAxisLabel = true;

    // Add origin coordinates label
    const originLabel = new fabric.Text('(0, 0)', {
      left: Math.max(8, originCanvasX + 8),
      top: Math.min(canvasHeight - 20, originCanvasY - 20),
      fontSize: 12,
      fill: '#6b7280',
      fontFamily: 'Atkinson Hyperlegible, sans-serif',
      selectable: false,
      evented: false,
    });
    (originLabel as any).isAxisLabel = true;

    // Add all elements
    canvas.add(originIndicator);
    canvas.add(xLabel);
    canvas.add(yLabel);
    canvas.add(originLabel);
    
    // Bring to front to ensure visibility
    canvas.bringObjectToFront(originIndicator);
    canvas.bringObjectToFront(xLabel);
    canvas.bringObjectToFront(yLabel);
    canvas.bringObjectToFront(originLabel);

    canvas.requestRenderAll();
  }, [canvas, scaleFactor, zoomLevel, gridHeightM, gridWidthM]);
}