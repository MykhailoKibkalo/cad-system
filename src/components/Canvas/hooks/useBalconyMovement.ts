// src/components/Canvas/hooks/useBalconyMovement.ts
import { useEffect } from 'react';
import type { Canvas } from 'fabric';
import { useObjectStore } from '@/state/objectStore';
import { useCanvasStore } from '@/state/canvasStore';

export default function useBalconyMovement(canvas: Canvas | null) {
  const balconies = useObjectStore(s => s.balconies);
  const modules = useObjectStore(s => s.modules);
  const updateBalcony = useObjectStore(s => s.updateBalcony);
  const scale = useCanvasStore(s => s.scaleFactor);
  const snapMode = useCanvasStore(s => s.snapMode);
  const gridSizeMm = useCanvasStore(s => s.gridSizeMm);
  const elementGapMm = useCanvasStore(s => s.elementGapMm);

  useEffect(() => {
    if (!canvas) return;

    // Helper function for grid snapping
    const snapToGrid = (value: number): number => {
      if (snapMode !== 'grid') return value;
      const gridPx = gridSizeMm * scale;
      return Math.round(value / gridPx) * gridPx;
    };

    const onMoving = (opt: any) => {
      const obj: any = opt.target;
      const balconyId = obj.isBalcony as string | undefined;
      if (!balconyId) return;

      const bc = balconies.find(b => b.id === balconyId);
      const mod = modules.find(m => m.id === bc?.moduleId);
      if (!bc || !mod) return;

      // Module bounds in pixels
      const mx = mod.x0! * scale;
      const my = mod.y0! * scale;
      const mw = mod.width! * scale;
      const mh = mod.length! * scale;

      // Get current object dimensions
      const objWidth = obj.width * obj.scaleX;
      const objHeight = obj.height * obj.scaleY;

      // Current position
      let left = obj.left;
      let top = obj.top;

      // Constrain movement based on wall side
      switch (bc.wallSide) {
        case 1: // top wall - can only move horizontally
          // Apply grid snapping
          left = snapToGrid(left);
          // Constrain to module bounds
          left = Math.max(mx, Math.min(left, mx + mw - objWidth));
          // Fix Y position
          top = my - objHeight;
          break;

        case 3: // bottom wall - can only move horizontally
          left = snapToGrid(left);
          left = Math.max(mx, Math.min(left, mx + mw - objWidth));
          top = my + mh;
          break;

        case 2: // right wall - can only move vertically
          top = snapToGrid(top);
          top = Math.max(my, Math.min(top, my + mh - objHeight));
          left = mx + mw;
          break;

        case 4: // left wall - can only move vertically
          top = snapToGrid(top);
          top = Math.max(my, Math.min(top, my + mh - objHeight));
          left = mx - objWidth;
          break;
      }

      // Apply the constrained position
      obj.set({ left, top });
      obj.setCoords();
    };

    const onScaling = (opt: any) => {
      const obj: any = opt.target;
      const balconyId = obj.isBalcony as string | undefined;
      if (!balconyId) return;

      const bc = balconies.find(b => b.id === balconyId);
      const mod = modules.find(m => m.id === bc?.moduleId);
      if (!bc || !mod) return;

      // Module bounds
      const mx = mod.x0! * scale;
      const my = mod.y0! * scale;
      const mw = mod.width! * scale;
      const mh = mod.length! * scale;

      // Current dimensions
      const currentWidth = obj.width * obj.scaleX;
      const currentHeight = obj.height * obj.scaleY;

      // Preserve position during scaling by adjusting based on wall side
      switch (bc.wallSide) {
        case 1: // top wall
          // Constrain width to not exceed module width
          const maxWidthTop = mw - (obj.left - mx);
          if (currentWidth > maxWidthTop) {
            obj.scaleX = maxWidthTop / obj.width;
          }
          // Keep attached to top wall
          if (obj.top + currentHeight !== my) {
            obj.top = my - currentHeight;
          }
          break;

        case 3: // bottom wall
          // Constrain width
          const maxWidthBottom = mw - (obj.left - mx);
          if (currentWidth > maxWidthBottom) {
            obj.scaleX = maxWidthBottom / obj.width;
          }
          // Keep attached to bottom wall
          obj.top = my + mh;
          break;

        case 2: // right wall
          // Constrain height
          const maxHeightRight = mh - (obj.top - my);
          if (currentHeight > maxHeightRight) {
            obj.scaleY = maxHeightRight / obj.height;
          }
          // Keep attached to right wall
          obj.left = mx + mw;
          break;

        case 4: // left wall
          // Constrain height
          const maxHeightLeft = mh - (obj.top - my);
          if (currentHeight > maxHeightLeft) {
            obj.scaleY = maxHeightLeft / obj.height;
          }
          // Keep attached to left wall
          if (obj.left + currentWidth !== mx) {
            obj.left = mx - currentWidth;
          }
          break;
      }

      // Apply grid snapping to dimensions
      if (snapMode === 'grid') {
        const gridPx = gridSizeMm * scale;
        const snappedWidth = Math.round(currentWidth / gridPx) * gridPx;
        const snappedHeight = Math.round(currentHeight / gridPx) * gridPx;
        obj.scaleX = snappedWidth / obj.width;
        obj.scaleY = snappedHeight / obj.height;
      }

      obj.setCoords();
    };

    const onModified = (opt: any) => {
      const obj: any = opt.target;
      const balconyId = obj.isBalcony as string | undefined;
      if (!balconyId) return;

      const bc = balconies.find(b => b.id === balconyId);
      const mod = modules.find(m => m.id === bc?.moduleId);
      if (!bc || !mod) return;

      // Calculate final dimensions
      const finalWidth = obj.width * obj.scaleX;
      const finalHeight = obj.height * obj.scaleY;

      // Calculate distance along wall based on wall side
      let distanceAlongWall: number, widthMm: number, lengthMm: number;

      switch (bc.wallSide) {
        case 1: // top wall
        case 3: // bottom wall
          distanceAlongWall = (obj.left - mod.x0! * scale) / scale;
          widthMm = finalWidth / scale;
          lengthMm = finalHeight / scale;
          break;

        case 2: // right wall
        case 4: // left wall
          distanceAlongWall = (obj.top - mod.y0! * scale) / scale;
          widthMm = finalHeight / scale;
          lengthMm = finalWidth / scale;
          break;
      }

      // Update the object to have scale 1:1 with new dimensions
      obj.set({
        width: finalWidth,
        height: finalHeight,
        scaleX: 1,
        scaleY: 1,
      });
      obj.setCoords();

      // Update store
      updateBalcony(balconyId, {
        distanceAlongWall: Math.max(0, distanceAlongWall),
        width: Math.max(10, widthMm),
        length: Math.max(10, lengthMm),
      });
    };

    canvas.on('object:moving', onMoving);
    canvas.on('object:scaling', onScaling);
    canvas.on('object:modified', onModified);

    return () => {
      canvas.off('object:moving', onMoving);
      canvas.off('object:scaling', onScaling);
      canvas.off('object:modified', onModified);
    };
  }, [canvas, balconies, modules, scale, snapMode, gridSizeMm, elementGapMm, updateBalcony]);
}
