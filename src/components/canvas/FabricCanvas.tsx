'use client';

import { useEffect, useRef } from 'react';
import { fabric } from 'fabric';
import useCadStore from '@/store/cadStore';
import { clearGrid, drawGrid } from './grid';

interface FabricCanvasProps {
  width: number;
  height: number;
  gridResolution: number;
  pixelsPerMm: number;
  showLowerFloor: boolean;
  floorIndex: number;
}

const FabricCanvas = ({
  width,
  height,
  gridResolution,
  pixelsPerMm,
  showLowerFloor,
  floorIndex,
}: FabricCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);

  // Initialize canvas
  useEffect(() => {
    if (canvasRef.current && !fabricCanvasRef.current) {
      const canvas = new fabric.Canvas(canvasRef.current, {
        width,
        height,
        selection: true,
        backgroundColor: '#ffffff',
      });

      fabricCanvasRef.current = canvas;

      // Center the canvas origin
      canvas.setViewportTransform([1, 0, 0, 1, width / 2, height / 2]);

      // Draw initial grid
      drawGrid(canvas, gridResolution, pixelsPerMm);

      // Cleanup
      return () => {
        canvas.dispose();
        fabricCanvasRef.current = null;
      };
    }
  }, [width, height, gridResolution, pixelsPerMm]);

  // Update the canvas when dimensions change
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (canvas) {
      canvas.setDimensions({ width, height });
      canvas.setViewportTransform([1, 0, 0, 1, width / 2, height / 2]);
      canvas.renderAll();
    }
  }, [width, height]);

  // Update grid when resolution changes
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (canvas) {
      clearGrid(canvas);
      drawGrid(canvas, gridResolution, pixelsPerMm);
      canvas.renderAll();
    }
  }, [gridResolution, pixelsPerMm]);

  // Handle showing lower floor backdrop
  useEffect(() => {
    const { floors } = useCadStore.getState();
    const canvas = fabricCanvasRef.current;

    if (canvas && floorIndex > 0 && showLowerFloor) {
      const lowerFloor = floors[floorIndex - 1];
      if (lowerFloor.backdrop) {
        // Remove any existing lower floor backdrops first
        const existingLowerBackdrops = canvas.getObjects().filter(obj => obj.data?.type === 'lowerFloorBackdrop');
        existingLowerBackdrops.forEach(obj => canvas.remove(obj));

        // Clone the backdrop using the callback pattern
        lowerFloor.backdrop.clone((clonedObj: fabric.Image) => {
          clonedObj.set({
            opacity: 0.3,
            selectable: false,
            evented: false,
          });

          // Add metadata
          clonedObj.data = { type: 'lowerFloorBackdrop' };

          // Add to canvas
          canvas.add(clonedObj);
          canvas.sendToBack(clonedObj);
          canvas.renderAll();
        });
      }
    } else if (canvas) {
      // Remove any existing lower floor backdrops
      const existingLowerBackdrops = canvas.getObjects().filter(obj => obj.data?.type === 'lowerFloorBackdrop');
      existingLowerBackdrops.forEach(obj => canvas.remove(obj));
      canvas.renderAll();
    }
  }, [floorIndex, showLowerFloor]);

  return <canvas ref={canvasRef} />;
};

export default FabricCanvas;
