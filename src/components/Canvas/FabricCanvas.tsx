// src/components/Canvas/FabricCanvas.tsx
'use client';

import { useEffect, useRef } from 'react';
import { Canvas as FabricCanvasClass } from 'fabric';

export default function FabricCanvas() {
  const canvasRef = useRef<FabricCanvasClass>();

  // Ініціалізація
  useEffect(() => {
    if (!canvasRef.current) {
      canvasRef.current = new FabricCanvasClass('fabricCanvas', {
        selection: true,
      });
    }
  }, []);

  return null;
}
