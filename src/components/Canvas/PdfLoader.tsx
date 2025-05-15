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
          scaleX: scale,
          scaleY: scale,
          selectable: true,
          hasControls: true,
          lockUniScaling: false,
        });
        // Позначаємо, що це PDF-зображення
        ;(img as any).isPdfImage = true;
        canvas.add(img);
        canvas.sendObjectToBack(img);
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
