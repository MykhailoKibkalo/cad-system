// src/components/Canvas/hooks/usePanZoom.ts
import { useEffect } from 'react';
import type { Canvas } from 'fabric';
import { useCanvasStore } from '../../../state/canvasStore';

export default function usePanZoom(canvas: Canvas | null) {
  const zoomLevel = useCanvasStore(s => s.zoomLevel);
  const setZoom = useCanvasStore(s => s.setZoomLevel);
  const handMode = useCanvasStore(s => s.handMode);

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
    canvas.requestRenderAll();
    {
      const [, , , , tx, ty] = canvas.viewportTransform!;
      useCanvasStore.getState().setPan(tx, ty);
    }
  }, [canvas, zoomLevel]);

  useEffect(() => {
    if (!canvas) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        useCanvasStore.getState().setHandMode(true);
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
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
      const next = Math.min(Math.max(canvas.getZoom() * factor, 0.25), 4);
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
      lastX = e.clientX;
      lastY = e.clientY;
      el.style.cursor = 'grabbing';
    };
    // mousemove → пан
    const onMove = (e: MouseEvent) => {
      if (!dragging) return;
      const vpt = canvas.viewportTransform!;
      vpt[4] += e.clientX - lastX;
      vpt[5] += e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      canvas.requestRenderAll();
      useCanvasStore.getState().setPan(vpt[4], vpt[5]);
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
  }, [canvas, handMode, setZoom]);
}
