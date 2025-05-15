// src/components/Canvas/hooks/useModuleTool.ts
import { useEffect, useRef } from 'react';
import { Canvas, Rect } from 'fabric';
import { useToolStore } from '@/state/toolStore';
import { useObjectStore } from '@/state/objectStore';
import { useCanvasStore } from '@/state/canvasStore';
import { Module } from '@/types/geometry';

export default function useModuleTool(canvas: Canvas | null) {
    const tool = useToolStore(s => s.tool);
    const setTool = useToolStore(s => s.setTool);
    const addModule = useObjectStore(s => s.addModule);
    const scaleFactor = useCanvasStore(s => s.scaleFactor);
    const snapMode = useCanvasStore(s => s.snapMode);
    const gridSizeMm = useCanvasStore(s => s.gridSizeMm);

    // Змінні для малювання
    const startRef = useRef<{ x: number; y: number } | null>(null);
    const rectRef = useRef<Rect | null>(null);

    useEffect(() => {
        if (!canvas) return;

        const onMouseDown = (opt: any) => {
            if (tool !== 'module') return;
            const pt = canvas.getPointer(opt.e);
            let x = pt.x, y = pt.y;
            // snap-to-grid
            if (snapMode === 'grid') {
                const gridPx = gridSizeMm * scaleFactor;
                x = Math.round(x / gridPx) * gridPx;
                y = Math.round(y / gridPx) * gridPx;
            }
            startRef.current = { x, y };
            const rect = new Rect({
                left: x,
                top: y,
                width: 0,
                height: 0,
                fill: 'rgba(0, 123, 255, 0.3)',
                stroke: '#007bff',
                strokeWidth: 1,
                selectable: false,
                evented: false,
            });
            rectRef.current = rect;
            canvas.add(rect);
        };

        const onMouseMove = (opt: any) => {
            if (tool !== 'module' || !startRef.current || !rectRef.current) return;
            const pt = canvas.getPointer(opt.e);
            let x2 = pt.x, y2 = pt.y;
            if (snapMode === 'grid') {
                const gridPx = gridSizeMm * scaleFactor;
                x2 = Math.round(x2 / gridPx) * gridPx;
                y2 = Math.round(y2 / gridPx) * gridPx;
            }
            const { x: x1, y: y1 } = startRef.current;
            const w = x2 - x1;
            const h = y2 - y1;
            const rect = rectRef.current;
            rect.set({
                width: Math.abs(w),
                height: Math.abs(h),
                left: w < 0 ? x2 : x1,
                top:  h < 0 ? y2 : y1,
            });
            canvas.requestRenderAll();
        };

        const onMouseUp = () => {
            if (tool !== 'module' || !startRef.current || !rectRef.current) return;
            const rect = rectRef.current;
            const pxWidth = rect.width!;
            const pxHeight = rect.height!;

            if (pxWidth > 0 && pxHeight > 0) {
                // 1) робимо прямокутник рухомим
                rect.set({
                    selectable: true,
                    evented: true,
                    hasControls: true,
                    strokeWidth: 2,
                    strokeUniform: true
                });

                // 2) оновлюємо внутрішню геометрію
                rect.setCoords();

                // 3) відразу виділяємо його, щоб були контролери
                canvas.setActiveObject(rect);

                // 4) маркуємо як Module
                const id = Date.now().toString();
                ;(rect as any).isModule = id;

                // Створюємо запис модуля у сторі
                const module: Module = {
                    id,
                    name: `M${id}`,
                    width: pxWidth / scaleFactor,
                    length: pxHeight / scaleFactor,
                    height: 3100,
                    x0: rect.left! / scaleFactor,
                    y0: rect.top! / scaleFactor,
                    zOffset: 0,
                    rotation: 0,
                    stackedFloors: 1,
                    showBorder: true,
                };
                addModule(module);

                // 5) остаточний рендер
                canvas.requestRenderAll();
            } else {
                canvas.remove(rect);
            }

            // Скидаємо стан і повертаємось до select
            startRef.current = null;
            rectRef.current = null;
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
    }, [canvas, tool, scaleFactor, snapMode, gridSizeMm, addModule, setTool]);
}
