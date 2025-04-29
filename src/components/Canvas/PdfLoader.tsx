// src/components/Canvas/PdfLoader.tsx
'use client';

import { useEffect } from 'react';
import * as fabric from 'fabric';
import { printPDF } from '@/utils/pdfUtils';

interface PdfLoaderProps {
  canvas: fabric.Canvas;
}

export default function PdfLoader({ canvas }: PdfLoaderProps) {
  useEffect(() => {
    const input = document.getElementById('pdfInput') as HTMLInputElement;
    const handler = async () => {
      if (!input.files?.[0]) return;
      const pages = await printPDF(input.files[0]);
      const scale = 1 / window.devicePixelRatio;
      for (const cEl of pages) {
        const img = new fabric.Image(cEl, {
          originX: 'left',
          originY: 'top',
          selectable: true,
          hasControls: true,
          lockUniScaling: false,
          scaleX: scale,
          scaleY: scale,
        });

        // робимо білий фон прозорим
        const filtersStatic = (fabric.Image as any).filters;
        if (filtersStatic && filtersStatic.RemoveWhite) {
          const removeWhite = new filtersStatic.RemoveWhite({
            threshold: 200,
            distance: 0,
          });
          img.filters = [removeWhite];
          img.applyFilters();
        }

        canvas.add(img); // <— тут canvas вже не undefined
      }
      canvas.requestRenderAll();
    };

    input.addEventListener('change', handler);
    return () => {
      input.removeEventListener('change', handler);
    };
  }, [canvas]);

  return null;
}
