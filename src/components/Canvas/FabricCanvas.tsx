// src/components/Canvas/FabricCanvas.tsx
'use client';

import { useEffect, useRef } from 'react';
import { Canvas as FabricCanvasClass } from 'fabric';
import { useCanvasStore } from '@/state/canvasStore';
import useGrid from './hooks/useGrid';
import useSnapping from './hooks/useSnapping';

export default function FabricCanvas() {
  const canvasRef = useRef<FabricCanvasClass>();
  const { scaleFactor, gridSizeMm, snapMode } = useCanvasStore();

  // Ініціалізація
  useEffect(() => {
    if (!canvasRef.current) {
      canvasRef.current = new FabricCanvasClass('fabricCanvas', {
        selection: true,
      });
    }
  }, []);

  // Grid + Snapping
  useGrid(canvasRef, scaleFactor, gridSizeMm);
  useSnapping(canvasRef, snapMode);

  return null;
}
