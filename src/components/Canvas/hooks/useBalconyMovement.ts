// src/components/Canvas/hooks/useBalconyMovement.ts
import { useEffect } from 'react';
import type { Canvas } from 'fabric';
import { useObjectStore } from '@/state/objectStore';
import { useCanvasStore } from '@/state/canvasStore';
import { useCurrentFloorElements } from './useFloorElements';

export default function useBalconyMovement(canvas: Canvas | null) {
  const { balconies, modules } = useCurrentFloorElements();
  const updateBalcony = useObjectStore(s => s.updateBalcony);
  const scale = useCanvasStore(s => s.scaleFactor);
  const snapMode = useCanvasStore(s => s.snapMode);
  const gridSizeMm = useCanvasStore(s => s.gridSizeMm);
  const elementGapMm = useCanvasStore(s => s.elementGapMm);

  useEffect(() => {
    if (!canvas) return;

    // Helper function for grid snapping - ensures integer results
    const snapToGrid = (value: number): number => {
      if (snapMode !== 'grid') return Math.round(value);
      const gridPx = Math.round(gridSizeMm * scale);
      return Math.round(Math.round(value / gridPx) * gridPx);
    };

    const onMoving = (opt: any) => {
      const obj: any = opt.target;
      const balconyId = obj.isBalcony as string | undefined;
      if (!balconyId) return;

      const bc = balconies.find(b => b.id === balconyId);
      const mod = modules.find(m => m.id === bc?.moduleId);
      if (!bc || !mod) return;

      // Module bounds in pixels - ensure integers
      const mx = Math.round(mod.x0! * scale);
      const my = Math.round(mod.y0! * scale);
      const mw = Math.round(mod.width! * scale);
      const mh = Math.round(mod.length! * scale);

      // Get current object dimensions - ensure integers
      const objWidth = Math.round(obj.width * obj.scaleX);
      const objHeight = Math.round(obj.height * obj.scaleY);

      // Current position - ensure integers
      let left = Math.round(obj.left);
      let top = Math.round(obj.top);

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

      // Apply the constrained position - ensure integers
      obj.set({ left: Math.round(left), top: Math.round(top) });
      obj.setCoords();
    };

    const onScaling = (opt: any) => {
      const obj: any = opt.target;
      const balconyId = obj.isBalcony as string | undefined;
      if (!balconyId) return;

      const bc = balconies.find(b => b.id === balconyId);
      const mod = modules.find(m => m.id === bc?.moduleId);
      if (!bc || !mod) return;

      // Module bounds - ensure integers
      const mx = Math.round(mod.x0! * scale);
      const my = Math.round(mod.y0! * scale);
      const mw = Math.round(mod.width! * scale);
      const mh = Math.round(mod.length! * scale);

      // Current dimensions - ensure integers
      const currentWidth = Math.round(obj.width * obj.scaleX);
      const currentHeight = Math.round(obj.height * obj.scaleY);

      // Preserve position during scaling by adjusting based on wall side
      switch (bc.wallSide) {
        case 1: // top wall
          // Constrain width to not exceed module width
          const maxWidthTop = mw - (Math.round(obj.left) - mx);
          if (currentWidth > maxWidthTop) {
            obj.scaleX = maxWidthTop / obj.width;
          }
          // Keep attached to top wall
          if (Math.round(obj.top) + currentHeight !== my) {
            obj.top = my - currentHeight;
          }
          break;

        case 3: // bottom wall
          // Constrain width
          const maxWidthBottom = mw - (Math.round(obj.left) - mx);
          if (currentWidth > maxWidthBottom) {
            obj.scaleX = maxWidthBottom / obj.width;
          }
          // Keep attached to bottom wall
          obj.top = my + mh;
          break;

        case 2: // right wall
          // Constrain height
          const maxHeightRight = mh - (Math.round(obj.top) - my);
          if (currentHeight > maxHeightRight) {
            obj.scaleY = maxHeightRight / obj.height;
          }
          // Keep attached to right wall
          obj.left = mx + mw;
          break;

        case 4: // left wall
          // Constrain height
          const maxHeightLeft = mh - (Math.round(obj.top) - my);
          if (currentHeight > maxHeightLeft) {
            obj.scaleY = maxHeightLeft / obj.height;
          }
          // Keep attached to left wall
          if (Math.round(obj.left) + currentWidth !== mx) {
            obj.left = mx - currentWidth;
          }
          break;
      }

      // Apply grid snapping to dimensions - ensure integers
      if (snapMode === 'grid') {
        const gridPx = Math.round(gridSizeMm * scale);
        const snappedWidth = Math.round(Math.round(currentWidth / gridPx) * gridPx);
        const snappedHeight = Math.round(Math.round(currentHeight / gridPx) * gridPx);
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

      // Calculate final dimensions - ensure integers
      const finalWidth = Math.round(obj.width * obj.scaleX);
      const finalHeight = Math.round(obj.height * obj.scaleY);

      // Calculate distance along wall based on wall side - ensure integers
      let distanceAlongWall: number, widthMm: number, lengthMm: number;

      switch (bc.wallSide) {
        case 1: // top wall
        case 3: // bottom wall
          distanceAlongWall = Math.round((Math.round(obj.left) - Math.round(mod.x0! * scale)) / scale);
          widthMm = Math.round(finalWidth / scale);
          lengthMm = Math.round(finalHeight / scale);
          break;

        case 2: // right wall
        case 4: // left wall
          distanceAlongWall = Math.round((Math.round(obj.top) - Math.round(mod.y0! * scale)) / scale);
          widthMm = Math.round(finalHeight / scale);
          lengthMm = Math.round(finalWidth / scale);
          break;
      }

      // Update the object to have scale 1:1 with new dimensions - ensure integers
      obj.set({
        width: Math.round(finalWidth),
        height: Math.round(finalHeight),
        scaleX: 1,
        scaleY: 1,
      });
      obj.setCoords();

      // Update store - ensure integers
      updateBalcony(balconyId, {
        distanceAlongWall: Math.max(0, Math.round(distanceAlongWall)),
        width: Math.max(10, Math.round(widthMm)),
        length: Math.max(10, Math.round(lengthMm)),
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
