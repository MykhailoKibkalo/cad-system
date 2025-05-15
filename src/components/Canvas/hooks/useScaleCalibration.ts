// src/components/Canvas/hooks/useScaleCalibration.ts
import { useEffect } from 'react';
import { Canvas, Line } from 'fabric';
import { useCanvasStore } from '../../../state/canvasStore';
import { useToolStore } from '../../../state/toolStore';

export default function useScaleCalibration(canvas: Canvas | null) {
  const tool = useToolStore(s => s.tool);
  const setTool = useToolStore(s => s.setTool);
  const setScale = useCanvasStore(s => s.setScaleFactor);

  useEffect(() => {
    if (!canvas) return;

    let currentLine: Line | null = null;
    let startX = 0;
    let startY = 0;

    const onMouseDown = (opt: any) => {
      if (tool !== 'calibrate') return;
      const pointer = canvas.getPointer(opt.e);
      startX = pointer.x;
      startY = pointer.y;
      // створюємо нову горизонтальну лінію
      currentLine = new Line(
          [startX, startY, startX, startY],
          {
            stroke: 'red',
            strokeWidth: 2,
            selectable: false,
            evented: false,
          }
      );
      canvas.add(currentLine);
    };

    const onMouseMove = (opt: any) => {
      if (tool !== 'calibrate' || !currentLine) return;
      const pointer = canvas.getPointer(opt.e);
      // оновлюємо x2, y2 = стартове y
      currentLine.set({ x2: pointer.x, y2: startY });
      canvas.requestRenderAll();
    };

    const onMouseUp = () => {
      if (tool !== 'calibrate' || !currentLine) return;
      // обчислюємо довжину в пікселях
      const dx = currentLine.x2! - currentLine.x1!;
      const pixelLen = Math.abs(dx);
      // питаємо реальну довжину
      const realMmStr = prompt('Enter real length in millimetres for this line:', '1000');
      const realMm = realMmStr ? parseFloat(realMmStr) : NaN;
      if (!isNaN(realMm) && realMm > 0) {
        setScale(pixelLen / realMm);
      }
      // прибираємо лінію та виходимо з режиму
      canvas.remove(currentLine);
      currentLine = null;
      setTool('select');
    };

    canvas.on('mouse:down', onMouseDown);
    canvas.on('mouse:move', onMouseMove);
    canvas.on('mouse:up',   onMouseUp);

    return () => {
      canvas.off('mouse:down', onMouseDown);
      canvas.off('mouse:move', onMouseMove);
      canvas.off('mouse:up',   onMouseUp);
    };
  }, [canvas, tool, setScale, setTool]);
}
