// src/components/Canvas/hooks/useCorridorMovement.ts
import { useEffect } from 'react';
import type { Canvas } from 'fabric';
import { useObjectStore } from '@/state/objectStore';
import { useCanvasStore } from '@/state/canvasStore';
import { topToBottomYMm } from '@/utils/coordinateTransform';

export default function useCorridorMovement(canvas: Canvas | null) {
  const updateCorridor = useObjectStore(s => s.updateCorridor);
  const scaleFactor = useCanvasStore(s => s.scaleFactor);
  const gridHeightM = useCanvasStore(s => s.gridHeightM);

  useEffect(() => {
    if (!canvas) return;

    const onModified = (opt: any) => {
      const obj = opt.target;
      const corridorId = (obj as any).isCorridor as string | undefined;
      if (!corridorId) return;

      // Get bounding box after transformations
      const b = obj.getBoundingRect(true);
      
      // Convert pixels to mm
      const x1Mm = Math.round(Math.round(b.left) / scaleFactor);
      const y1TopMm = Math.round(Math.round(b.top) / scaleFactor);
      const x2Mm = Math.round((Math.round(b.left) + Math.round(b.width)) / scaleFactor);
      const y2TopMm = Math.round((Math.round(b.top) + Math.round(b.height)) / scaleFactor);
      
      // Convert Y coordinates from top-left to bottom-left
      const y1BottomMm = topToBottomYMm(y1TopMm, gridHeightM);
      const y2BottomMm = topToBottomYMm(y2TopMm, gridHeightM);

      // Store with bottom-left Y coordinates (smaller Y is bottom)
      updateCorridor(corridorId, {
        x1: x1Mm,
        y1: Math.min(y1BottomMm, y2BottomMm), // bottom edge
        x2: x2Mm,
        y2: Math.max(y1BottomMm, y2BottomMm), // top edge
      });
    };

    canvas.on('object:modified', onModified);
    return () => {
      canvas.off('object:modified', onModified);
    };
  }, [canvas, updateCorridor, scaleFactor, gridHeightM]);
}
