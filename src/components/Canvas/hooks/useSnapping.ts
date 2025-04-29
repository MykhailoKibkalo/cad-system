// src/components/Canvas/hooks/useSnapping.ts
import { useEffect } from 'react';
import { Canvas } from 'fabric';
import { useCanvasStore } from '@/state/canvasStore';

export default function useSnapping(canvasRef: Canvas | null, mode: 'off' | 'grid' | 'element') {
  const { gridSizeMm } = useCanvasStore();

  useEffect(() => {
    const canvas = canvasRef;
    if (!canvas) return;

    const handler = (e: any) => {
      if (mode === 'grid') {
        const gridPx = gridSizeMm * useCanvasStore.getState().scaleFactor;
        e.target.set({
          left: Math.round(e.target.left! / gridPx) * gridPx,
          top: Math.round(e.target.top! / gridPx) * gridPx,
        });
      }
      // mode==='element' можна додати пізніше
    };

    canvas.on('object:moving', handler);
    return () => {
      canvas.off('object:moving', handler);
    };
  }, [canvasRef, mode, gridSizeMm]);
}
