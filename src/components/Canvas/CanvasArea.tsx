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
import useBalconyTool from '@/components/Canvas/hooks/useBalconyTool';
import useRenderBalconies from '@/components/Canvas/hooks/useRenderBalconies';
import useBalconyMovement from '@/components/Canvas/hooks/useBalconyMovement';
import useFloorSync from '@/components/Canvas/hooks/useFloorSync';
import useModuleRestore from '@/components/Canvas/hooks/useModuleRestore';
import useRenderModules from '@/components/Canvas/hooks/useRenderModules';
import usePdfRestore from '@/components/Canvas/hooks/usePdfRestore';
import usePdfPropertySync from '@/components/Canvas/hooks/usePdfPropertySync';
import ZoomControl from '@/components/ui/ZoomControl';
import ControlWrap from '@/components/ui/ControlPanel';
import { useCanvasRefStore } from '@/state/canvasRefStore';
import useGrouping from './hooks/useGrouping';
import useRenderGroups from './hooks/useRenderGroups';
import useGroupMovement from './hooks/useGroupMovement';
import useCanvasCleanup from './hooks/useCanvasCleanup';

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
  background-image:
    linear-gradient(to right, #ddd 1px, transparent 1px), linear-gradient(to bottom, #ddd 1px, transparent 1px);
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

// const CalibrationTooltip = styled.div`
//   position: absolute;
//   top: 20px;
//   left: 50%;
//   transform: translateX(-50%);
//   background: rgba(0, 0, 0, 0.8);
//   color: white;
//   padding: 12px 20px;
//   border-radius: 8px;
//   font-size: 14px;
//   font-weight: 500;
//   display: flex;
//   align-items: center;
//   gap: 8px;
//   z-index: 1001;
//   pointer-events: none;
//   box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
//   animation: fadeIn 0.3s ease-out;
//
//   @keyframes fadeIn {
//     from {
//       opacity: 0;
//       transform: translateX(-50%) translateY(-10px);
//     }
//     to {
//       opacity: 1;
//       transform: translateX(-50%) translateY(0);
//     }
//   }
// `;

export default function CanvasArea() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvas = useFabricCanvas('fabricCanvas');
  const { scaleFactor, gridSizeMm, zoomLevel, gridWidthM, gridHeightM } = useCanvasStore();
  const setCanvasRef = useCanvasRefStore(s => s.setCanvas);

  const setCenter = useCanvasStore(s => s.setCenterCanvas);

  // Expose canvas globally for useFloorSync hook and store in canvas ref store
  useEffect(() => {
    if (canvas) {
      (window as any).__fabricCanvas = canvas;
      setCanvasRef(canvas);
      console.log('🎨 Canvas exposed globally for floor sync');
    }
    return () => {
      setCanvasRef(null);
    };
  }, [canvas, setCanvasRef]);

  // Sync floor data - enhanced version
  // Remove useCanvasClear - it's now handled by the enhanced useFloorSync

  useEffect(() => {
    if (canvas && wrapperRef.current) {
      const { clientWidth: w, clientHeight: h } = wrapperRef.current;
      canvas.setDimensions({ width: w, height: h });

      // Set initial view to show bottom-left corner (0,0 in grid coordinates)
      // This will be automatically adjusted by usePanZoom constraints
      setTimeout(() => {
        const { gridHeightM, scaleFactor } = useCanvasStore.getState();
        const gridHeightPx = gridHeightM * 1000 * scaleFactor;

        // Position to show bottom of grid at bottom of canvas
        const panX = 0;
        const panY = h - gridHeightPx;

        canvas.setViewportTransform([1, 0, 0, 1, panX, panY]);
        canvas.requestRenderAll();
      }, 100); // Small delay to let other hooks initialize
    }
  }, [canvas]);

  useEffect(() => {
    if (canvas) {
      // зберігаємо функцію центрування
      setCenter(() => () => {
        // Reset zoom to 100%
        useCanvasStore.getState().setZoomLevel(1);

        // Calculate position to show bottom-left corner of grid
        const canvasHeight = canvas.getHeight();
        const { gridHeightM, scaleFactor } = useCanvasStore.getState();
        const gridHeightPx = gridHeightM * 1000 * scaleFactor;

        // Position viewport to show bottom-left corner (0,0 in grid coordinates)
        // In canvas coordinates, bottom-left means pan Y should show the bottom of the grid
        const panX = 0; // Start from left edge
        const panY = canvasHeight - gridHeightPx; // Position to show bottom of grid at bottom of canvas

        canvas.setViewportTransform([1, 0, 0, 1, panX, panY]);
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

  // Floor synchronization - must be called early to handle floor switching
  useFloorSync(canvas);

  // Module restoration for floor switching - must be after floor sync
  useModuleRestore(canvas);

  // Reactive module rendering for data changes within the same floor
  useRenderModules(canvas);

  // PDF restoration for floor switching
  usePdfRestore(canvas);

  // PDF property synchronization
  usePdfPropertySync();

  useSelection(canvas);

  useSnapping(canvas);
  const calibrationModal = useScaleCalibration(canvas);
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

  useBalconyTool(canvas);
  useRenderBalconies(canvas);
  useBalconyMovement(canvas);

  // Group management
  useGrouping(canvas);
  useRenderGroups(canvas);
  useGroupMovement(canvas);

  // Canvas cleanup to remove ghost objects
  useCanvasCleanup(canvas);

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
      {canvas && <PdfLoader canvas={canvas} />}
      {canvas && <PropertyPanel canvas={canvas} />}
      <ZoomControl />
      <ControlWrap />
      {calibrationModal}
    </Wrapper>
  );
}
