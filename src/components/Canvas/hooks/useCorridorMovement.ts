// src/components/Canvas/hooks/useCorridorMovement.ts
import { useEffect } from 'react';
import type { Canvas } from 'fabric';
import { useObjectStore } from '@/state/objectStore';
import { useCanvasStore } from '@/state/canvasStore';
import { topToBottomYMm } from '@/utils/coordinateTransform';
import { useCurrentFloorGridSettings } from './useFloorElements';

export default function useCorridorMovement(canvas: Canvas | null) {
  const updateCorridor = useObjectStore(s => s.updateCorridor);
  const scaleFactor = useCanvasStore(s => s.scaleFactor);
  const { gridHeightM } = useCurrentFloorGridSettings();

  useEffect(() => {
    if (!canvas) return;

    const onModified = (opt: any) => {
      const obj = opt.target;
      const corridorId = (obj as any).isCorridor as string | undefined;
      if (!corridorId) return;

      // Handle both scaling and movement
      const strokeWidth = obj.strokeWidth || 0;
      const halfStroke = strokeWidth / 2;
      
      // During scaling, normalize the object to remove scale factors
      if (obj.scaleX !== 1 || obj.scaleY !== 1) {
        const scaledWidth = obj.getScaledWidth() - strokeWidth;
        const scaledHeight = obj.getScaledHeight() - strokeWidth;
        obj.set({
          width: scaledWidth,
          height: scaledHeight,
          scaleX: 1,
          scaleY: 1
        });
        obj.setCoords();
      }
      
      // Get position and dimensions (accounting for stroke)
      const left = obj.left || 0;
      const top = obj.top || 0;
      const width = obj.width || 0;
      const height = obj.height || 0;
      
      // Convert pixels to mm (accounting for stroke)
      const x1Mm = Math.round((left + halfStroke) / scaleFactor);
      const y1TopMm = Math.round((top + halfStroke) / scaleFactor);
      const x2Mm = Math.round((left + width + halfStroke) / scaleFactor);
      const y2TopMm = Math.round((top + height + halfStroke) / scaleFactor);
      
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

    const onScaling = (opt: any) => {
      const obj = opt.target;
      const corridorId = (obj as any).isCorridor as string | undefined;
      if (!corridorId) return;
      
      // During scaling, just update the store with current dimensions
      const strokeWidth = obj.strokeWidth || 0;
      const scaledWidth = obj.getScaledWidth() - strokeWidth;
      const scaledHeight = obj.getScaledHeight() - strokeWidth;
      
      const bounds = obj.getBoundingRect();
      const x1Mm = Math.round(bounds.left / scaleFactor);
      const y1TopMm = Math.round(bounds.top / scaleFactor);
      const x2Mm = Math.round((bounds.left + scaledWidth) / scaleFactor);
      const y2TopMm = Math.round((bounds.top + scaledHeight) / scaleFactor);
      
      const y1BottomMm = topToBottomYMm(y1TopMm, gridHeightM);
      const y2BottomMm = topToBottomYMm(y2TopMm, gridHeightM);

      updateCorridor(corridorId, {
        x1: x1Mm,
        y1: Math.min(y1BottomMm, y2BottomMm),
        x2: x2Mm,
        y2: Math.max(y1BottomMm, y2BottomMm),
      });
    };

    canvas.on('object:scaling', onScaling);
    canvas.on('object:modified', onModified);
    return () => {
      canvas.off('object:scaling', onScaling);
      canvas.off('object:modified', onModified);
    };
  }, [canvas, updateCorridor, scaleFactor, gridHeightM]);
}
