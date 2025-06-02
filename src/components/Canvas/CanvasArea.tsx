// src/components/Canvas/CanvasArea.tsx
'use client';

import { useEffect, useRef } from 'react';
import styled from '@emotion/styled';
import { useFabricCanvas } from './hooks/useFabricCanvas';
import PdfLoader from './PdfLoader';
import useSnapping from './hooks/useSnapping';
import { useCanvasStore } from '@/state/canvasStore';
import useScaleCalibration from '@/components/Canvas/hooks/useScaleCalibration';
import usePdfLock from '@/components/Canvas/hooks/usePdfLock';
import useModuleTool from '@/components/Canvas/hooks/useModuleTool';
import useModuleMovement from '@/components/Canvas/hooks/useModuleMovement';
import useSelection from '@/components/Canvas/hooks/useSelection';
import PropertyPanel from '@/components/Properties/PropertyPanel';
import useOpeningTool from '@/components/Canvas/hooks/useOpeningTool';
import useRenderOpenings from '@/components/Canvas/hooks/useRenderOpenings';
import useModuleResize from '@/components/Canvas/hooks/useModuleResize';
import usePanZoom from '@/components/Canvas/hooks/usePanZoom';
import useCorridorTool from '@/components/Canvas/hooks/useCorridorTool';
import useRenderCorridors from '@/components/Canvas/hooks/useRenderCorridors';
import useCorridorMovement from './hooks/useCorridorMovement';
import useBathroomPodTool from '@/components/Canvas/hooks/useBathroomPodTool';
import useRenderBathroomPods from '@/components/Canvas/hooks/useRenderBathroomPods';
import useBathroomPodMovement from '@/components/Canvas/hooks/useBathroomPodMovement';
import useIgnoreModulesFindTarget from '@/components/Canvas/hooks/useIgnoreModulesFindTarget';
import useBalconyTool from "@/components/Canvas/hooks/useBalconyTool";
import useRenderBalconies from "@/components/Canvas/hooks/useRenderBalconies";
import useBalconyMovement from "@/components/Canvas/hooks/useBalconyMovement";
import ZoomControl from "@/components/ui/ZoomControl";
import ControlWrap from "@/components/ui/ControlPanel";

const CanvasContainer = styled.div<{ gridSizePx?: number; offsetX?: number; offsetY?: number }>`
  flex: 1;
  position: relative;
  background-color: #ffffff;
`;

const GridOverlay = styled.div<{
  gridSizePx: number;
  offsetX: number;
  offsetY: number;
  gridWidthPx: number;
  gridHeightPx: number;
  panX: number;
  panY: number;
  zoom: number;
}>`
  position: absolute;
  top: ${p => Math.max(0, p.panY)}px;
  left: ${p => Math.max(0, p.panX)}px;
  width: ${p => p.gridWidthPx * p.zoom}px;
  height: ${p => p.gridHeightPx * p.zoom}px;
  pointer-events: none;
  background-image: linear-gradient(to right, #ddd 1px, transparent 1px), linear-gradient(to bottom, #ddd 1px, transparent 1px);
  background-size: ${p => p.gridSizePx}px ${p => p.gridSizePx}px;
  background-position: ${p => p.offsetX}px ${p => p.offsetY}px;
  //border: 1px solid #aeaeae;
  box-sizing: border-box;
  z-index: 1000;
  overflow: hidden;
`;

const Wrapper = styled.div`
  position: relative;
  flex: 1;
  display: flex;

  canvas#fabricCanvas {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }
`;

export default function CanvasArea() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvas = useFabricCanvas('fabricCanvas');
  const { scaleFactor, gridSizeMm, zoomLevel, gridWidthM, gridHeightM } = useCanvasStore();

  const setCenter = useCanvasStore(s => s.setCenterCanvas);

  // Expose canvas globally for useFloorSync hook
  useEffect(() => {
    if (canvas) {
      (window as any).__fabricCanvas = canvas;
      console.log('🎨 Canvas exposed globally for floor sync');
    }
  }, [canvas]);

  // Sync floor data - enhanced version
  // Remove useCanvasClear - it's now handled by the enhanced useFloorSync

  useEffect(() => {
    if (canvas && wrapperRef.current) {
      const { clientWidth: w, clientHeight: h } = wrapperRef.current;
      canvas.setDimensions({ width: w, height: h });
    }
  }, [canvas]);

  useEffect(() => {
    if (canvas) {
      // зберігаємо функцію центрування
      setCenter(() => () => {
        // Reset zoom to 100%
        useCanvasStore.getState().setZoomLevel(1);
        // Reset pan to 0,0 (constraints will be applied by usePanZoom)
        canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
        canvas.requestRenderAll();
      });
    }
  }, [canvas, setCenter]);

  useEffect(() => {
    if (!canvas) return;
    const onResize = () => {
      if (wrapperRef.current) {
        const { clientWidth: w, clientHeight: h } = wrapperRef.current;
        canvas.setDimensions({ width: w, height: h });
        canvas.requestRenderAll();
      }
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [canvas]);

  // 3) Grid та Snapping
  // useGrid(canvas, scaleFactor, gridSizeMm);

  useSelection(canvas);

  useSnapping(canvas);
  useScaleCalibration(canvas);
  usePdfLock(canvas);

  usePanZoom(canvas);

  useModuleTool(canvas);
  useModuleMovement(canvas);
  useModuleResize(canvas);

  useOpeningTool(canvas);
  useRenderOpenings(canvas);

  useCorridorTool(canvas);
  useRenderCorridors(canvas);
  useCorridorMovement(canvas);

  useBathroomPodTool(canvas);
  useRenderBathroomPods(canvas);
  useBathroomPodMovement(canvas);
  useIgnoreModulesFindTarget(canvas);

  useBalconyTool(canvas)
  useRenderBalconies(canvas)
  useBalconyMovement(canvas)

  // Розмір клітини в px
  const baseGridPx = gridSizeMm * scaleFactor;
  const gridSizePx = baseGridPx * zoomLevel;

  // Grid dimensions in pixels (1m = 1000mm)
  const gridWidthPx = gridWidthM * 1000 * scaleFactor;
  const gridHeightPx = gridHeightM * 1000 * scaleFactor;

  // Зсув pattern на основі canvas.viewportTransform
  const vpt = canvas?.viewportTransform ?? [1, 0, 0, 1, 0, 0];
  const offsetX = vpt[4] % gridSizePx;
  const offsetY = vpt[5] % gridSizePx;

  return (
    <Wrapper ref={wrapperRef}>
      <CanvasContainer>
        <canvas id="fabricCanvas" />
        <GridOverlay
          gridSizePx={gridSizePx}
          offsetX={offsetX}
          offsetY={offsetY}
          gridWidthPx={gridWidthPx}
          gridHeightPx={gridHeightPx}
          panX={vpt[4]}
          panY={vpt[5]}
          zoom={zoomLevel}
        />
      </CanvasContainer>
      {/*{canvas && <CanvasContextMenu canvas={canvas} />}*/}
      {canvas && <PdfLoader canvas={canvas} />}
      {canvas && <PropertyPanel canvas={canvas} />}
      <ZoomControl/>
      <ControlWrap/>
    </Wrapper>
  );
}
