// src/components/ui/ZoomControls.tsx
import React from 'react';
import styled from '@emotion/styled';
import { useCad } from '@/context/CadContext';

const ZoomControlsContainer = styled.div`
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  background-color: white;
  border-radius: 20px;
  padding: 5px 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  z-index: 100;
`;

const ZoomSlider = styled.input`
  width: 150px;
  margin: 0 10px;
`;

const ZoomLabel = styled.span`
  font-size: 12px;
  color: #666;
  min-width: 45px;
  text-align: center;
  cursor: pointer;

  &:hover {
    color: #333;
    text-decoration: underline;
  }
`;

const ZoomButton = styled.button`
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 50%;
  cursor: pointer;
  font-size: 16px;
  font-weight: bold;
  outline: none;
  margin: 0 5px;

  &:hover {
    background-color: #e0e0e0;
  }

  &:active {
    background-color: #d0d0d0;
  }
`;

const ZoomControls: React.FC = () => {
  const { canvasSettings, setCanvasSettings, fabricCanvasRef } = useCad();

  const MIN_ZOOM = 0.1;
  const MAX_ZOOM = 5;
  const ZOOM_STEP = 0.1;

  const handleZoomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newZoom = parseFloat(e.target.value);

    if (fabricCanvasRef.current) {
      const canvas = fabricCanvasRef.current;

      // Get the center of the canvas
      const center = {
        x: canvas.getWidth() / 2,
        y: canvas.getHeight() / 2,
      };

      // Zoom to the center point
      canvas.zoomToPoint(center, newZoom);

      // Update canvas settings
      setCanvasSettings({
        zoom: newZoom,
        panX: canvas.viewportTransform ? canvas.viewportTransform[4] : 0,
        panY: canvas.viewportTransform ? canvas.viewportTransform[5] : 0,
      });
    }
  };

  const zoomIn = () => {
    if (fabricCanvasRef.current) {
      const canvas = fabricCanvasRef.current;
      const currentZoom = canvas.getZoom();
      const newZoom = Math.min(currentZoom + ZOOM_STEP, MAX_ZOOM);

      // Get the center of the canvas
      const center = {
        x: canvas.getWidth() / 2,
        y: canvas.getHeight() / 2,
      };

      // Zoom to the center point
      canvas.zoomToPoint(center, newZoom);

      // Update canvas settings
      setCanvasSettings({
        zoom: newZoom,
        panX: canvas.viewportTransform ? canvas.viewportTransform[4] : 0,
        panY: canvas.viewportTransform ? canvas.viewportTransform[5] : 0,
      });
    }
  };

  const zoomOut = () => {
    if (fabricCanvasRef.current) {
      const canvas = fabricCanvasRef.current;
      const currentZoom = canvas.getZoom();
      const newZoom = Math.max(currentZoom - ZOOM_STEP, MIN_ZOOM);

      // Get the center of the canvas
      const center = {
        x: canvas.getWidth() / 2,
        y: canvas.getHeight() / 2,
      };

      // Zoom to the center point
      canvas.zoomToPoint(center, newZoom);

      // Update canvas settings
      setCanvasSettings({
        zoom: newZoom,
        panX: canvas.viewportTransform ? canvas.viewportTransform[4] : 0,
        panY: canvas.viewportTransform ? canvas.viewportTransform[5] : 0,
      });
    }
  };

  const resetZoom = () => {
    if (fabricCanvasRef.current) {
      const canvas = fabricCanvasRef.current;

      // Reset zoom and pan
      canvas.setZoom(1);
      canvas.absolutePan({ x: 0, y: 0 } as fabric.Point);

      // Update canvas settings
      setCanvasSettings({
        zoom: 1,
        panX: 0,
        panY: 0,
      });
    }
  };

  // Format zoom percentage
  const zoomPercentage = Math.round(canvasSettings.zoom * 100);

  return (
    <ZoomControlsContainer>
      <ZoomButton onClick={zoomOut} title="Zoom Out">
        −
      </ZoomButton>
      <ZoomSlider
        type="range"
        min={MIN_ZOOM}
        max={MAX_ZOOM}
        step={ZOOM_STEP}
        value={canvasSettings.zoom}
        onChange={handleZoomChange}
      />
      <ZoomButton onClick={zoomIn} title="Zoom In">
        +
      </ZoomButton>
      <ZoomLabel onClick={resetZoom} title="Reset Zoom (Click to reset)">
        {zoomPercentage}%
      </ZoomLabel>
    </ZoomControlsContainer>
  );
};

export default ZoomControls;
