// src/components/Canvas/CanvasArea.tsx
'use client';

import { useEffect, useRef } from 'react';
import styled from '@emotion/styled';
import { useFabricCanvas } from './hooks/useFabricCanvas';
import PdfLoader from './PdfLoader';
import useGrid from './hooks/useGrid';
import useSnapping from './hooks/useSnapping';
import { useCanvasStore } from '@/state/canvasStore';
import useScaleCalibration from "@/components/Canvas/hooks/useScaleCalibration";

const Wrapper = styled.div`
  position: relative;
  flex: 1;
  display: flex;

  canvas#fabricCanvas {
    position: absolute;
    top: 0; left: 0;
    width: 100%; height: 100%;
    background: #ffffff;
  }
`;

export default function CanvasArea() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvas = useFabricCanvas('fabricCanvas');
  const { scaleFactor, gridSizeMm, snapMode } = useCanvasStore();

  // 1) Після створення canvas — підганяємо внутрішній buffer під wrapper
  useEffect(() => {
    if (canvas && wrapperRef.current) {
      const { clientWidth: w, clientHeight: h } = wrapperRef.current;
      canvas.setDimensions({ width: w, height: h });
    }
  }, [canvas]);

  // 2) Перерахунок при ресайзі вікна
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
  useGrid(canvas, scaleFactor, gridSizeMm);
  useSnapping(canvas, snapMode);
  useScaleCalibration(canvas);


  return (
      <Wrapper ref={wrapperRef}>
        <canvas id="fabricCanvas" />
        {canvas && <PdfLoader canvas={canvas} />}
      </Wrapper>
  );
}
