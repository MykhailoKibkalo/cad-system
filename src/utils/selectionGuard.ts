import { fabric } from 'fabric';

export const disableAllExcept = (canvas: fabric.Canvas, keep: fabric.Group) => {
    canvas.getObjects().forEach(o => {
        const lock = o === keep;
        o.set({ selectable: lock, evented: lock });
    });
};

export const enableAll = (canvas: fabric.Canvas) =>
    canvas.getObjects().forEach(o => {
        if (o.data?.type === 'grid') return;
        const lockedBackdrop = o.data?.type === 'backdrop' && !o.selectable;
        if (lockedBackdrop) return;
        o.set({ selectable: true, evented: true });
    });
