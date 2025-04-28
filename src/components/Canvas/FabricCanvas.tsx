'use client';

import React, { useEffect, useRef, useState } from 'react';
import { fabric } from 'fabric';
import useCadStore from '@/store/cadStore';
import useToolManager from './useToolManager';
import SettingsPanel from '@/components/SettingsPanel';

const FabricCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gridRef = useRef<HTMLCanvasElement>(null);
  const { setCanvas, gridStep } = useCadStore();
  const [selectedObject, setSelectedObject] = useState<fabric.Object | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    if (!canvasRef.current || !gridRef.current) return;

    // Initialize Fabric canvas
    const canvas = new fabric.Canvas(canvasRef.current, {
      preserveObjectStacking: true,
      selection: true,
    });

    // Initialize grid context
    const gridCtx = gridRef.current.getContext('2d')!;

    // Draw grid function
    const drawGrid = () => {
      if (!gridRef.current) return;

      const step = useCadStore.getState().gridStep;
      const width = gridRef.current.width;
      const height = gridRef.current.height;

      gridCtx.clearRect(0, 0, width, height);
      gridCtx.strokeStyle = '#eee';
      gridCtx.lineWidth = 1;

      for (let x = 0; x < width; x += step) {
        gridCtx.beginPath();
        gridCtx.moveTo(x, 0);
        gridCtx.lineTo(x, height);
        gridCtx.stroke();
      }

      for (let y = 0; y < height; y += step) {
        gridCtx.beginPath();
        gridCtx.moveTo(0, y);
        gridCtx.lineTo(width, y);
        gridCtx.stroke();
      }
    };

    // Make canvas responsive to parent size - defined AFTER canvas is initialized
    const fit = () => {
      const parent = canvasRef.current?.parentElement?.parentElement;
      if (!parent || !canvas) return; // Added guard

      const width = parent.clientWidth;
      const height = parent.clientHeight;

      console.log(width);

      // Set both canvases to the same size
      canvas.setDimensions({ width, height });

      if (gridRef.current) {
        gridRef.current.width = width;
        gridRef.current.height = height;
        drawGrid();
      }
    };

    // Initial fit with delay to ensure parent dimensions are set
    setTimeout(fit, 100);

    // Add resize listener
    window.addEventListener('resize', fit);

    // Add double-click handler
    canvas.on('mouse:dblclick', opt => {
      if (opt.target && opt.target.data) {
        if (['module', 'opening', 'balcony', 'bathroom', 'corridor'].includes(opt.target.data.type)) {
          setSelectedObject(opt.target);
          setShowSettings(true);
        }
      }
    });

    // Save canvas to store
    setCanvas(canvas);

    // Draw initial grid
    drawGrid();

    // Cleanup on unmount
    return () => {
      window.removeEventListener('resize', fit);
      canvas.off('mouse:dblclick');
      canvas.dispose();
    };
  }, [setCanvas, gridStep]);

  // Get canvas from store for the tool manager
  const canvas = useCadStore(state => state.canvas);

  // Use the tool manager hook
  useToolManager(canvas);

  // Update grid when gridStep changes
  useEffect(() => {
    if (!gridRef.current) return;

    const gridCtx = gridRef.current.getContext('2d')!;
    const step = gridStep;
    const width = gridRef.current.width;
    const height = gridRef.current.height;

    gridCtx.clearRect(0, 0, width, height);
    gridCtx.strokeStyle = '#eee';
    gridCtx.lineWidth = 1;

    for (let x = 0; x < width; x += step) {
      gridCtx.beginPath();
      gridCtx.moveTo(x, 0);
      gridCtx.lineTo(x, height);
      gridCtx.stroke();
    }

    for (let y = 0; y < height; y += step) {
      gridCtx.beginPath();
      gridCtx.moveTo(0, y);
      gridCtx.lineTo(width, y);
      gridCtx.stroke();
    }
  }, [gridStep]);

  const handleCloseSettings = () => {
    setShowSettings(false);
    setSelectedObject(null);
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <canvas ref={gridRef} style={{ position: 'absolute', inset: 0 }} />
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0 }} />
      {showSettings && selectedObject && <SettingsPanel object={selectedObject} onClose={handleCloseSettings} />}
    </div>
  );
};

export default FabricCanvas;
