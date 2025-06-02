// src/components/Canvas/hooks/useFabricCanvas.ts
import { useEffect, useState } from 'react';
import { Canvas } from 'fabric';

export function useFabricCanvas(id: string): Canvas | null {
  const [canvas, setCanvas] = useState<Canvas | null>(null);

  useEffect(() => {
    // Check if canvas element exists
    const canvasElement = document.getElementById(id) as HTMLCanvasElement;
    if (!canvasElement) return;

    // Dispose any existing fabric instance
    if ((canvasElement as any).__fabric) {
      const existingInstance = (canvasElement as any).__fabric;
      if (existingInstance && typeof existingInstance.dispose === 'function') {
        try {
          existingInstance.dispose();
        } catch (error) {
          console.warn('Error disposing existing canvas:', error);
        }
      }
      (canvasElement as any).__fabric = null;
    }

    // Create new canvas instance
    try {
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
    } catch (error) {
      console.error('Error creating canvas:', error);
      setCanvas(null);
    }
  }, [id]);

  return canvas;
}
