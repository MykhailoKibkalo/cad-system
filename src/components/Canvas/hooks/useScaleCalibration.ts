// src/components/Canvas/hooks/useScaleCalibration.ts
import { useEffect } from 'react';
import { Canvas, Line } from 'fabric';
import { useCanvasStore } from '@/state/canvasStore';
import { useToolStore } from '@/state/toolStore';
import { PdfManager } from '@/utils/pdfUtils';

export default function useScaleCalibration(canvas: Canvas | null) {
  const tool = useToolStore(s => s.tool);
  const setTool = useToolStore(s => s.setTool);
  const { setScaleFactor, setPdfCalibrated, setPdfDimensions, gridSizeMm } = useCanvasStore();

  useEffect(() => {
    if (!canvas) return;

    let currentLine: Line | null = null;
    let startX = 0;
    let startY = 0;

    const onMouseDown = (opt: any) => {
      if (tool !== 'calibrate') return;
      const pointer = canvas.getPointer(opt.e);
      // Ensure integer coordinates
      startX = Math.round(pointer.x);
      startY = Math.round(pointer.y);
      // Create new horizontal line
      currentLine = new Line([startX, startY, startX, startY], {
        stroke: 'red',
        strokeWidth: 2,
        selectable: false,
        evented: false,
      });
      canvas.add(currentLine);
    };

    const onMouseMove = (opt: any) => {
      if (tool !== 'calibrate' || !currentLine) return;
      const pointer = canvas.getPointer(opt.e);
      // Update x2, y2 = starting y - ensure integers
      currentLine.set({
        x2: Math.round(pointer.x),
        y2: Math.round(startY),
      });
      canvas.requestRenderAll();
    };

    const onMouseUp = () => {
      if (tool !== 'calibrate' || !currentLine) return;
      // Calculate length in pixels - ensure integer
      const dx = Math.round(currentLine.x2!) - Math.round(currentLine.x1!);
      const pixelLen = Math.abs(dx);

      // Ask for real length
      const realMmStr = prompt('Enter real length in millimetres for this line:', '1000');
      const realMm = realMmStr ? parseFloat(realMmStr) : NaN;

      if (!isNaN(realMm) && realMm > 0) {
        const newScaleFactor = pixelLen / realMm;
        setScaleFactor(newScaleFactor);

        // Update PDF calibration status and dimensions
        const pdfManager = new PdfManager(canvas);
        if (pdfManager.hasPdfObjects()) {
          setPdfCalibrated(true);

          // Recalculate PDF dimensions with new scale
          const { widthGrid, heightGrid } = pdfManager.getPdfDimensionsInGrid(newScaleFactor, gridSizeMm);
          setPdfDimensions(widthGrid, heightGrid);
        }
      }

      // Remove line and exit calibration mode
      canvas.remove(currentLine);
      currentLine = null;
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
  }, [canvas, tool, setScaleFactor, setTool, setPdfCalibrated, setPdfDimensions, gridSizeMm]);
}
