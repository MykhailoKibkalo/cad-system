// src/components/Canvas/hooks/useModuleResize.ts
import { useEffect } from 'react';
import type { Canvas } from 'fabric';
import { useObjectStore } from '@/state/objectStore';
import { useCanvasStore } from '@/state/canvasStore';
import { rectTopToBottomYMm } from '@/utils/coordinateTransform';
import { useCurrentFloorGridSettings } from './useFloorElements';

export default function useModuleResize(canvas: Canvas | null) {
  const updateModule = useObjectStore(s => s.updateModule);
  const scaleFactor = useCanvasStore(s => s.scaleFactor);
  const { gridHeightM } = useCurrentFloorGridSettings();

  useEffect(() => {
    if (!canvas) return;

    const scalingHandler = (opt: any) => {
      // During scaling, just update the store with current dimensions
      // Don't reset scale factors here - let Fabric.js handle the scaling
      const obj = opt.target as any;
      const moduleId = obj.isModule as string | undefined;
      if (!moduleId) return;
      
      // Get dimensions without stroke (strokeWidth is included in getScaledWidth/Height)
      const strokeWidth = obj.strokeWidth || 0;
      const wPx = Math.round(obj.getScaledWidth() - strokeWidth);
      const hPx = Math.round(obj.getScaledHeight() - strokeWidth);
      
      const bounds = obj.getBoundingRect();
      const leftPx = Math.round(bounds.left);
      const topPx = Math.round(bounds.top);
      
      const widthMm = Math.round(wPx / scaleFactor);
      const heightMm = Math.round(hPx / scaleFactor);
      const leftMm = Math.round(leftPx / scaleFactor);
      const topMm = Math.round(topPx / scaleFactor);
      
      const bottomYMm = rectTopToBottomYMm(topMm, heightMm, gridHeightM);

      updateModule(moduleId, {
        x0: leftMm,
        y0: bottomYMm,
        width: widthMm,
        length: heightMm,
      });
    };

    const modifiedHandler = (opt: any) => {
      // After resize is complete, normalize the dimensions and reset scale
      const obj = opt.target as any;
      const moduleId = obj.isModule as string | undefined;
      if (!moduleId) return;
      
      // Only process if this was a scaling operation
      if (obj.scaleX === 1 && obj.scaleY === 1) return;
      
      // Get dimensions without stroke
      const strokeWidth = obj.strokeWidth || 0;
      const wPx = Math.round(obj.getScaledWidth() - strokeWidth);
      const hPx = Math.round(obj.getScaledHeight() - strokeWidth);
      
      const bounds = obj.getBoundingRect();
      
      // Reset scale to 1 and set actual dimensions
      obj.set({
        width: wPx,
        height: hPx,
        scaleX: 1,
        scaleY: 1
      });
      obj.setCoords();
      
      const leftPx = Math.round(bounds.left);
      const topPx = Math.round(bounds.top);
      
      const widthMm = Math.round(wPx / scaleFactor);
      const heightMm = Math.round(hPx / scaleFactor);
      const leftMm = Math.round(leftPx / scaleFactor);
      const topMm = Math.round(topPx / scaleFactor);
      
      const bottomYMm = rectTopToBottomYMm(topMm, heightMm, gridHeightM);

      console.log(`📏 Resize complete - Module ${moduleId}:`, {
        wPx, hPx, widthMm, heightMm,
        topMm, bottomYMm, scaleFactor
      });

      updateModule(moduleId, {
        x0: leftMm,
        y0: bottomYMm,
        width: widthMm,
        length: heightMm,
      });
    };

    canvas.on('object:scaling', scalingHandler);
    canvas.on('object:modified', modifiedHandler);

    return () => {
      canvas.off('object:scaling', scalingHandler);
      canvas.off('object:modified', modifiedHandler);
    };
  }, [canvas, scaleFactor, gridHeightM, updateModule]);
}
