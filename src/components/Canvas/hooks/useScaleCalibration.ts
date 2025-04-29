import { useEffect, useState } from 'react';
import { Canvas, Line } from 'fabric';
import { useCanvasStore } from '@/state/canvasStore';
import { useToolStore } from '@/state/toolStore';

export default function useScaleCalibration(canvas: Canvas | null) {
    const tool = useToolStore(s => s.tool);
    const setScale = useCanvasStore(s => s.setScaleFactor);
    const [line, setLine] = useState<Line | null>(null);

    useEffect(() => {
        if (!canvas) return;
        let startX = 0, startY = 0;

        const onMouseDown = (opt: any) => {
            if (tool !== 'calibrate') return;
            const { x, y } = canvas.getPointer(opt.e);
            startX = x; startY = y;
            const l = new Line([x, y, x, y], {
                stroke: 'red', strokeWidth: 2, selectable: false, evented: false
            });
            canvas.add(l);
            setLine(l);
        };

        const onMouseMove = (opt: any) => {
            if (tool !== 'calibrate' || !line) return;
            const p = canvas.getPointer(opt.e);
            line.set({ x2: p.x, y2: p.y });
            canvas.requestRenderAll();
        };

        const onMouseUp = () => {
            if (tool !== 'calibrate' || !line) return;
            const dx = line.x2! - line.x1!;
            const dy = line.y2! - line.y1!;
            const pixelLen = Math.hypot(dx, dy);
            const real = prompt('Enter real length in mm for this line:');
            const mm = real ? parseFloat(real) : NaN;
            if (!isNaN(mm) && mm > 0) {
                setScale(pixelLen / mm);
            }
            canvas.remove(line);
            setLine(null);
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
    }, [canvas, tool, line, setScale]);
}
