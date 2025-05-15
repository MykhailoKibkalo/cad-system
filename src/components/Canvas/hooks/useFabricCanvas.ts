// src/components/Canvas/hooks/useFabricCanvas.ts
import { useEffect, useState } from 'react';
import { Canvas } from 'fabric';

export function useFabricCanvas(id: string): Canvas | null {
  const [canvas, setCanvas] = useState<Canvas | null>(null);

  useEffect(() => {
    if (!canvas) {
      const c = new Canvas(id, { selection: true });
      setCanvas(c);
    }
    return () => {
      canvas?.dispose();
      setCanvas(null);
    };
  }, []);

  return canvas;
}
