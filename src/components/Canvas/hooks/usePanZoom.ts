// src/components/Canvas/hooks/usePanZoom.ts
import { useEffect } from 'react';
import type { Canvas } from 'fabric';
import { useCanvasStore } from '@/state/canvasStore';

export default function usePanZoom(canvas: Canvas | null) {
  const zoomLevel = useCanvasStore(s => s.zoomLevel);
  const setZoom = useCanvasStore(s => s.setZoomLevel);
  const handMode = useCanvasStore(s => s.handMode);
  const gridWidthM = useCanvasStore(s => s.gridWidthM);
  const gridHeightM = useCanvasStore(s => s.gridHeightM);
  const scaleFactor = useCanvasStore(s => s.scaleFactor);

  // Helper function to constrain pan within grid bounds
  const constrainPan = (vpt: number[], zoom: number, canvasWidth: number, canvasHeight: number) => {
    // Grid dimensions in pixels (1m = 1000mm)
    const gridWidthPx = gridWidthM * 1000 * scaleFactor;
    const gridHeightPx = gridHeightM * 1000 * scaleFactor;
    
    // Calculate the visible area size
    const visibleWidth = canvasWidth / zoom;
    const visibleHeight = canvasHeight / zoom;
    
    // Calculate pan limits
    let minX = 0;
    let maxX = 0;
    let minY = 0;
    let maxY = 0;
    
    if (gridWidthPx * zoom > canvasWidth) {
      // Grid is larger than viewport - limit panning
      maxX = 0;
      minX = -(gridWidthPx * zoom - canvasWidth);
    } else {
      // Grid fits in viewport - center it
      const centerX = (canvasWidth - gridWidthPx * zoom) / 2;
      minX = maxX = centerX;
    }
    
    if (gridHeightPx * zoom > canvasHeight) {
      // Grid is larger than viewport - limit panning
      maxY = 0;
      minY = -(gridHeightPx * zoom - canvasHeight);
    } else {
      // Grid fits in viewport - center it
      const centerY = (canvasHeight - gridHeightPx * zoom) / 2;
      minY = maxY = centerY;
    }
    
    // Apply constraints
    vpt[4] = Math.max(minX, Math.min(maxX, vpt[4]));
    vpt[5] = Math.max(minY, Math.min(maxY, vpt[5]));
    
    return vpt;
  };

  // 1) Курсор та селектор vs пан
  useEffect(() => {
    if (!canvas) return;
    canvas.selection = !handMode;
    canvas.forEachObject(o => (o.selectable = !handMode));
    // Задаємо клас курсора на контейнері, а не в самому fabric.defaultCursor
    const wrapper = canvas.wrapperEl;
    if (handMode) {
      wrapper.style.cursor = 'grab';
    } else {
      wrapper.style.cursor = 'default';
    }
  }, [canvas, handMode]);

  // 2) Zoom при зміні zoomLevel
  useEffect(() => {
    if (!canvas) return;
    // Центруємо zoom у центр полотна
    const center = canvas.getCenterPoint();
    canvas.zoomToPoint(center, zoomLevel);
    
    // Apply pan constraints
    const vpt = canvas.viewportTransform!;
    const constrained = constrainPan(vpt, zoomLevel, canvas.getWidth(), canvas.getHeight());
    canvas.setViewportTransform(constrained);
    
    canvas.requestRenderAll();
    {
      const [, , , , tx, ty] = canvas.viewportTransform!;
      // Ensure integer pan values
      useCanvasStore.getState().setPan(Math.round(tx), Math.round(ty));
    }
  }, [canvas, zoomLevel, gridWidthM, gridHeightM, scaleFactor]);

  useEffect(() => {
    if (!canvas) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        useCanvasStore.getState().setHandMode(true);
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        useCanvasStore.getState().setHandMode(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [canvas]);

  // 3) wheel + drag-to-pan через DOM
  useEffect(() => {
    if (!canvas) return;
    const el = canvas.upperCanvasEl; // DOM-канвас поверху

    // wheel → zoom
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const factor = e.deltaY > 0 ? 0.9 : 1.1;
      const currentZoom = canvas.getZoom();
      const next = Math.min(Math.max(currentZoom * factor, 0.05), 5);
      
      // Get mouse position relative to canvas
      const rect = canvas.upperCanvasEl.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      // Zoom to mouse position
      canvas.zoomToPoint({ x: mouseX, y: mouseY }, next);
      
      // Apply pan constraints after zoom
      const vpt = canvas.viewportTransform!;
      const constrained = constrainPan(vpt, next, canvas.getWidth(), canvas.getHeight());
      canvas.setViewportTransform(constrained);
      
      canvas.requestRenderAll();
      setZoom(parseFloat(next.toFixed(2)));
    };
    el.addEventListener('wheel', onWheel, { passive: false });

    let dragging = false;
    let lastX = 0;
    let lastY = 0;

    // mousedown → початок пану
    const onDown = (e: MouseEvent) => {
      if (!handMode) return;
      dragging = true;
      lastX = Math.round(e.clientX);
      lastY = Math.round(e.clientY);
      el.style.cursor = 'grabbing';
    };
    // mousemove → пан
    const onMove = (e: MouseEvent) => {
      if (!dragging) return;
      const vpt = canvas.viewportTransform!;
      // Ensure integer pan movements
      vpt[4] += Math.round(e.clientX - lastX);
      vpt[5] += Math.round(e.clientY - lastY);
      
      // Apply pan constraints
      const currentZoom = canvas.getZoom();
      const constrained = constrainPan(vpt, currentZoom, canvas.getWidth(), canvas.getHeight());
      canvas.setViewportTransform(constrained);
      
      lastX = Math.round(e.clientX);
      lastY = Math.round(e.clientY);
      canvas.requestRenderAll();
      // Ensure integer pan values in store
      useCanvasStore.getState().setPan(Math.round(constrained[4]), Math.round(constrained[5]));
    };
    // mouseup → кінець пану
    const onUp = () => {
      if (!handMode) return;
      dragging = false;
      el.style.cursor = 'grab';
    };

    el.addEventListener('mousedown', onDown);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);

    return () => {
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('mousedown', onDown);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [canvas, handMode, setZoom, gridWidthM, gridHeightM, scaleFactor]);
}