// src/components/Canvas/hooks/useModuleResize.ts
import { useEffect } from 'react';
import type { Canvas } from 'fabric';
import { useObjectStore } from '@/state/objectStore';
import { useCanvasStore } from '@/state/canvasStore';
import { rectTopToBottomYMm } from '@/utils/coordinateTransform';

export default function useModuleResize(canvas: Canvas | null) {
  const updateModule = useObjectStore(s => s.updateModule);
  const scaleFactor = useCanvasStore(s => s.scaleFactor);
  const gridHeightM = useCanvasStore(s => s.gridHeightM);

  useEffect(() => {
    if (!canvas) return;

    const handler = (opt: any) => {
      const obj = opt.target as any;
      
      // Check if it's a direct module object
      const moduleId = obj.isModule as string | undefined;
      if (moduleId) {
        // Handle direct module resize
        // When resizing from top/left, both position and size change
        const bounds = obj.getBoundingRect();
        
        // Calculate new dimensions
        const wPx = Math.round(obj.getScaledWidth());
        const hPx = Math.round(obj.getScaledHeight());
        
        // Calculate new position (important for top/left resize)
        const leftPx = Math.round(bounds.left);
        const topPx = Math.round(bounds.top);
        
        // Convert dimensions to mm
        const widthMm = Math.round(wPx / scaleFactor);
        const heightMm = Math.round(hPx / scaleFactor);
        const leftMm = Math.round(leftPx / scaleFactor);
        const topMm = Math.round(topPx / scaleFactor);
        
        // Convert from canvas top-left to bottom-left coordinate system
        const bottomYMm = rectTopToBottomYMm(topMm, heightMm, gridHeightM);

        updateModule(moduleId, {
          x0: leftMm,
          y0: bottomYMm,
          width: widthMm,
          length: heightMm,
        });
        return;
      }
      
      // Check if it's a group containing modules
      if (obj.type === 'group' && obj.isElementGroup) {
        // For groups, we don't resize individual modules, just update group position
        // Module resizing within groups should be handled separately if needed
        return;
      }
    };

    canvas.on('object:scaling', handler);
    canvas.on('object:resizing', handler);
    canvas.on('object:modified', handler);

    return () => {
      canvas.off('object:scaling', handler);
      canvas.off('object:resizing', handler);
      canvas.off('object:modified', handler);
    };
  }, [canvas, scaleFactor, gridHeightM, updateModule]);
}
