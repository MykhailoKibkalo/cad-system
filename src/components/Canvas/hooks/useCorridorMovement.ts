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

      // bounding box після трансформацій
      const b = obj.getBoundingRect(true);
      // конвертуємо пікселі → мм
      const x1 = b.left / scaleFactor;
      const y1 = b.top / scaleFactor;
      const x2 = (b.left + b.width) / scaleFactor;
      const y2 = (b.top + b.height) / scaleFactor;

      updateCorridor(corridorId, { x1, y1, x2, y2 });
    };

    canvas.on('object:modified', onModified);
    return () => {
      canvas.off('object:modified', onModified);
    };
  }, [canvas, updateCorridor, scaleFactor]);
}
