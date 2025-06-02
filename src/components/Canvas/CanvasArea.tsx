// src/components/Canvas/CanvasArea.tsx (Updated)
'use client';

import { useEffect, useRef } from 'react';
import styled from '@emotion/styled';
import { useFabricCanvas } from './hooks/useFabricCanvas';
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
import ZoomControl from '@/components/ui/ZoomControl';
import ControlWrap from '@/components/ui/ControlPanel';
import { PdfManager, printPDF } from '@/utils/pdfUtils';
import * as fabric from 'fabric';
import {useFloorStore} from "@/state/floorStore";

const CanvasContainer = styled.div<{ gridSizePx?: number; offsetX?: number; offsetY?: number }>`
  flex: 1;
  position: relative;
  background-color: #ffffff;
`;

const GridOverlay = styled.div<{ gridSizePx: number; offsetX: number; offsetY: number }>`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  background-image:
    linear-gradient(to right, #ddd 1px, transparent 1px), linear-gradient(to bottom, #ddd 1px, transparent 1px);
  background-size: ${p => p.gridSizePx}px ${p => p.gridSizePx}px;
  background-position: ${p => p.offsetX}px ${p => p.offsetY}px;
  z-index: 1000;
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
  const { scaleFactor, zoomLevel } = useCanvasStore();
  const { getCurrentFloor, currentFloorId } = useFloorStore();

  const setCenter = useCanvasStore(s => s.setCenterCanvas);
  const currentFloor = getCurrentFloor();

  // Get grid settings from current floor, fallback to defaults
  const gridSizeMm = currentFloor?.gridSettings.gridSize || 100;

  useEffect(() => {
    if (canvas && wrapperRef.current) {
      const { clientWidth: w, clientHeight: h } = wrapperRef.current;
      canvas.setDimensions({ width: w, height: h });
    }
  }, [canvas]);

  useEffect(() => {
    if (canvas) {
      setCenter(() => () => {
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

  // Floor switching behavior
  useEffect(() => {
    if (!canvas || !currentFloorId) return;

    // Clear all existing Fabric.js objects from canvas
    const clearCanvas = () => {
      // Remove all objects from canvas
      const objects = canvas.getObjects();
      objects.forEach(obj => {
        canvas.remove(obj);
      });
      canvas.clear();
      canvas.requestRenderAll();
    };

    clearCanvas();

    // Load PDF for current floor if it exists
    const loadFloorPDF = async () => {
      if (currentFloor?.pdf) {
        try {
          // Fetch the PDF blob from the object URL
          const response = await fetch(currentFloor.pdf.url);
          const blob = await response.blob();
          const canvases = await printPDF(blob);

          if (canvases.length > 0) {
            const scale = 1 / window.devicePixelRatio;

            for (const cEl of canvases) {
              const img = new fabric.Image(cEl, {
                originX: 'left',
                originY: 'top',
                scaleX: scale,
                scaleY: scale,
                selectable: !currentFloor.pdfLocked,
                evented: !currentFloor.pdfLocked,
                hasControls: !currentFloor.pdfLocked,
                lockUniScaling: false,
                opacity: currentFloor.pdf.opacity,
              });

              // Configure as PDF object
              const pdfManager = new PdfManager(canvas);
              pdfManager.configurePdfObject(img, currentFloor.pdfLocked || false, currentFloor.pdf.opacity);

              canvas.add(img);
              canvas.sendObjectToBack(img);
            }

            canvas.requestRenderAll();
          }
        } catch (error) {
          console.error('Failed to load floor PDF:', error);
        }
      }
    };

    loadFloorPDF();

    // Note: Floor elements will be rendered by the render hooks
    // which filter based on the current floor automatically
  }, [canvas, currentFloorId, currentFloor]);

  // Update PDF lock state when it changes
  useEffect(() => {
    if (!canvas || !currentFloor?.pdf) return;

    const pdfManager = new PdfManager(canvas);
    pdfManager.updatePdfLockState(currentFloor.pdfLocked || false);
    pdfManager.updatePdfOpacity(currentFloor.pdf.opacity);
  }, [canvas, currentFloor?.pdfLocked, currentFloor?.pdf?.opacity]);

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

  useBalconyTool(canvas);
  useRenderBalconies(canvas);
  useBalconyMovement(canvas);

  // Grid rendering calculations
  const baseGridPx = gridSizeMm * scaleFactor;
  const gridSizePx = baseGridPx * zoomLevel;

  // Grid offset based on canvas viewport transform
  const vpt = canvas?.viewportTransform ?? [1, 0, 0, 1, 0, 0];
  const offsetX = vpt[4] % gridSizePx;
  const offsetY = vpt[5] % gridSizePx;

  return (
    <Wrapper ref={wrapperRef}>
      <CanvasContainer>
        <canvas id="fabricCanvas" />
        {currentFloor?.gridSettings.showGrid && (
          <GridOverlay gridSizePx={gridSizePx} offsetX={offsetX} offsetY={offsetY} />
        )}
      </CanvasContainer>
      {canvas && <PropertyPanel canvas={canvas} />}
      <ZoomControl />
      <ControlWrap />
    </Wrapper>
  );
}
