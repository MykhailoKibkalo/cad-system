import { useEffect } from 'react';
import { Canvas } from 'fabric';
import { useCanvasStore } from '@/state/canvasStore';

export default function usePdfLock(canvas: Canvas | null) {
  const pdfLocked = useCanvasStore(s => s.pdfLocked);

  useEffect(() => {
    if (!canvas) return;
    canvas.getObjects().forEach(obj => {
      if ((obj as any).isPdfImage) {
        obj.set({
          selectable: !pdfLocked,
          evented: !pdfLocked,
        });
      }
    });
    // Якщо PDF розблоковано, даємо можливість canvas.selection
    canvas.selection = !pdfLocked;
    canvas.requestRenderAll();
  }, [canvas, pdfLocked]);
}
