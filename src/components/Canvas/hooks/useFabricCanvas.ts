// src/components/Canvas/hooks/useFabricCanvas.ts (Fixed)
import { useEffect, useState } from 'react';
import { Canvas } from 'fabric';

export function useFabricCanvas(id: string): Canvas | null {
  const [canvas, setCanvas] = useState<Canvas | null>(null);

  useEffect(() => {
    // Check if canvas already exists and dispose it first
    const existingCanvas = document.getElementById(id) as HTMLCanvasElement;
    if (existingCanvas && (existingCanvas as any).__fabric) {
      // If canvas element has fabric instance, dispose it
      const fabricInstance = (existingCanvas as any).__fabric;
      if (fabricInstance && typeof fabricInstance.dispose === 'function') {
        fabricInstance.dispose();
      }
    }

    // Create new canvas instance
    const c = new Canvas(id, { selection: true });
    setCanvas(c);

    // Cleanup function
    return () => {
      if (c) {
        try {
          c.dispose();
        } catch (error) {
          console.warn('Error disposing canvas:', error);
        }
      }
      setCanvas(null);
    };
  }, [id]);

  return canvas;
}
