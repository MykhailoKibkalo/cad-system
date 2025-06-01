// src/components/Canvas/hooks/useModuleResize.ts
import { useEffect } from 'react';
import type { Canvas } from 'fabric';
import { useObjectStore } from '@/state/objectStore';
import { useCanvasStore } from '@/state/canvasStore';

export default function useModuleResize(canvas: Canvas | null) {
  const updateModule = useObjectStore(s => s.updateModule);
  const scaleFactor = useCanvasStore(s => s.scaleFactor);

  useEffect(() => {
    if (!canvas) return;

    const handler = (opt: any) => {
      const obj = opt.target as any;
      const moduleId = obj.isModule as string | undefined;
      if (!moduleId) return;

      // Ensure integer scaled dimensions
      const wPx = Math.round(obj.getScaledWidth());
      const hPx = Math.round(obj.getScaledHeight());

      updateModule(moduleId, {
        width: Math.round(wPx / scaleFactor),
        length: Math.round(hPx / scaleFactor),
      });
    };

    canvas.on('object:scaling', handler);
    canvas.on('object:resizing', handler);
    canvas.on('object:modified', handler);

    return () => {
      canvas.off('object:scaling', handler);
      canvas.off('object:resizing', handler);
      canvas.off('object:modified', handler);
    };
  }, [canvas, scaleFactor, updateModule]);
}
