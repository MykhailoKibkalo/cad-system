// src/components/Canvas/hooks/useFabricCanvas.ts
import { useEffect, useState, useRef } from 'react';
import { Canvas } from 'fabric';

export function useFabricCanvas(id: string): Canvas | null {
  const [canvas, setCanvas] = useState<Canvas | null>(null);
  const initializingRef = useRef(false);

  useEffect(() => {
    // Prevent multiple initializations during React StrictMode
    if (initializingRef.current) return;
    
    // Check if canvas element exists
    const canvasElement = document.getElementById(id) as HTMLCanvasElement;
    if (!canvasElement) {
      console.log('Canvas element not found:', id);
      return;
    }

    // Check if the canvas is already a Fabric canvas
    if ((canvasElement as any).__fabric) {
      console.log('Canvas already initialized, disposing and recreating...');
      try {
        const existingCanvas = (canvasElement as any).__fabric;
        existingCanvas.dispose();
      } catch (e) {
        console.warn('Error disposing existing canvas:', e);
      }
      
      // Clear the __fabric reference
      delete (canvasElement as any).__fabric;
    }

    initializingRef.current = true;
    let fabricCanvas: Canvas | null = null;

    try {
      fabricCanvas = new Canvas(id, { selection: true });
      setCanvas(fabricCanvas);
      console.log('Fabric canvas initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Fabric canvas:', error);
      initializingRef.current = false;
    }

    return () => {
      if (fabricCanvas) {
        console.log('Disposing Fabric canvas from effect cleanup');
        try {
          fabricCanvas.dispose();
        } catch (e) {
          console.warn('Error disposing canvas:', e);
        }
        fabricCanvas = null;
      }
      initializingRef.current = false;
      setCanvas(null);
    };
  }, [id]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (canvas) {
        console.log('Component unmounting, disposing canvas');
        try {
          canvas.dispose();
        } catch (e) {
          console.warn('Error disposing canvas on unmount:', e);
        }
        setCanvas(null);
      }
    };
  }, [canvas]);

  return canvas;
}
