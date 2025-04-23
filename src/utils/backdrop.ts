import useCadStore from '@/store/cadStore';
import { fabric } from 'fabric';

export const applyBackdropLock = (canvas: fabric.Canvas) => {
    const { backdropLocked, backdropId } = useCadStore.getState();
    if (!canvas || !backdropId) return;
    canvas.getObjects().forEach(o => {
        if (o.data?.id === backdropId) {
            o.set({ selectable: !backdropLocked, evented: !backdropLocked });
        }
    });
    canvas.requestRenderAll();
};
