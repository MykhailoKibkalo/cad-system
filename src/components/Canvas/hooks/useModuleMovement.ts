import { useEffect } from 'react';
import { Canvas } from 'fabric';
import { useObjectStore } from '@/state/objectStore';
import { useCanvasStore } from '@/state/canvasStore';

/**
 * Слухає за перетягуванням обʼєктів-модулів і оновлює їхні координати в сторі.
 */
export default function useModuleMovement(canvas: Canvas | null) {
    const updateModule = useObjectStore(s => s.updateModule);
    const scaleFactor = useCanvasStore(s => s.scaleFactor);

    useEffect(() => {
        if (!canvas) return;

        const onModified = (opt: any) => {
            const obj = opt.target;
            // тільки для наших модулів
            const moduleId = (obj as any).isModule;
            if (!moduleId) return;

            // нові позиції в міліметрах
            const newX0 = (obj.left ?? 0)  / scaleFactor;
            const newY0 = (obj.top  ?? 0)  / scaleFactor;

            updateModule(moduleId, { x0: newX0, y0: newY0 });
        };

        // Моніторимо завершення перетягування
        canvas.on('object:modified', onModified);

        return () => {
            canvas.off('object:modified', onModified);
        };
    }, [canvas, updateModule, scaleFactor]);
}
