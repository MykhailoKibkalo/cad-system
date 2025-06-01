// src/components/Canvas/hooks/useCorridorMovement.ts
import { useEffect } from 'react';
import type { Canvas } from 'fabric';
import { useObjectStore } from '@/state/objectStore';
import { useCanvasStore } from '@/state/canvasStore';

export default function useCorridorMovement(canvas: Canvas | null) {
  const updateCorridor = useObjectStore(s => s.updateCorridor);
  const scaleFactor = useCanvasStore(s => s.scaleFactor);

  useEffect(() => {
    if (!canvas) return;

    const onModified = (opt: any) => {
      const obj = opt.target;
      const corridorId = (obj as any).isCorridor as string | undefined;
      if (!corridorId) return;

      // bounding box після трансформацій - ensure integers
      const b = obj.getBoundingRect(true);
      // конвертуємо пікселі → мм - ensure integers
      const x1 = Math.round(Math.round(b.left) / scaleFactor);
      const y1 = Math.round(Math.round(b.top) / scaleFactor);
      const x2 = Math.round((Math.round(b.left) + Math.round(b.width)) / scaleFactor);
      const y2 = Math.round((Math.round(b.top) + Math.round(b.height)) / scaleFactor);

      updateCorridor(corridorId, {
        x1: Math.round(x1),
        y1: Math.round(y1),
        x2: Math.round(x2),
        y2: Math.round(y2),
      });
    };

    canvas.on('object:modified', onModified);
    return () => {
      canvas.off('object:modified', onModified);
    };
  }, [canvas, updateCorridor, scaleFactor]);
}
