// src/components/Canvas/PdfLoader.tsx
'use client';

import { useEffect } from 'react';
import * as fabric from 'fabric';
import { printPDF, PdfManager } from '@/utils/pdfUtils';
import { useCanvasStore } from '@/state/canvasStore';

interface PdfLoaderProps {
  canvas: fabric.Canvas;
}

export default function PdfLoader({ canvas }: PdfLoaderProps) {
  const {
    setPdfImported,
    setPdfDimensions,
    setPdfCalibrated,
    scaleFactor,
    gridSizeMm,
    pdfLocked,
    pdfOpacity,
    resetPdfState,
  } = useCanvasStore();

  useEffect(() => {
    const input = document.getElementById('pdfInput') as HTMLInputElement;
    const pdfManager = new PdfManager(canvas);

    const handler = async () => {
      if (!input.files?.[0]) return;

      try {
        // Remove any existing PDF objects
        pdfManager.removePdfObjects();

        const pages = await printPDF(input.files[0]);
        const scale = 1 / window.devicePixelRatio;

        for (const cEl of pages) {
          const img = new fabric.Image(cEl, {
            // Basic Fabric.js properties
            originX: 'left',
            originY: 'top',
            scaleX: scale,
            scaleY: scale,

            // Will be overridden by configurePdfObject
            selectable: true,
            evented: true,
            hasControls: true,
            lockUniScaling: false,
          });

          // ===== IMPROVED: Use PdfManager to properly configure PDF =====
          pdfManager.configurePdfObject(img, pdfLocked, pdfOpacity);

          canvas.add(img);

          // Force to back immediately after adding
          canvas.sendObjectToBack(img);
        }

        // ===== ADDITIONAL SAFETY: Emergency reset to ensure proper state =====
        pdfManager.emergencyPdfReset(pdfLocked, pdfOpacity);

        canvas.requestRenderAll();

        // Update PDF state
        setPdfImported(true);

        // Calculate dimensions in grid units
        const { widthGrid, heightGrid } = pdfManager.getPdfDimensionsInGrid(scaleFactor, gridSizeMm);
        setPdfDimensions(widthGrid, heightGrid);

        // Initially not calibrated - user needs to calibrate scale
        setPdfCalibrated(false);

        // Clear the input for next use
        input.value = '';

      } catch (error) {
        console.error('Failed to load PDF:', error);
        // Reset state on error
        resetPdfState();
      }
    };

    input.addEventListener('change', handler);
    return () => {
      input.removeEventListener('change', handler);
    };
  }, [canvas, setPdfImported, setPdfDimensions, setPdfCalibrated, scaleFactor, gridSizeMm, pdfLocked, pdfOpacity, resetPdfState]);

  // Handle PDF deletion through state
  useEffect(() => {
    const pdfManager = new PdfManager(canvas);

    // If pdfImported becomes false, remove PDF objects
    if (!useCanvasStore.getState().pdfImported) {
      pdfManager.removePdfObjects();
    }
  }, [canvas]);

  // ===== IMPROVED: Enhanced lock state updates =====
  useEffect(() => {
    const pdfManager = new PdfManager(canvas);

    if (pdfManager.hasPdfObjects()) {
      // Clear any PDF selections when locking
      if (pdfLocked) {
        pdfManager.clearPdfSelection();
      }

      // Update lock state
      pdfManager.updatePdfLockState(pdfLocked);

      // Emergency reset to ensure compliance
      pdfManager.emergencyPdfReset(pdfLocked, pdfOpacity);
    }
  }, [canvas, pdfLocked, pdfOpacity]);

  // Update PDF opacity when it changes
  useEffect(() => {
    const pdfManager = new PdfManager(canvas);
    pdfManager.updatePdfOpacity(pdfOpacity);
  }, [canvas, pdfOpacity]);

  // ===== IMPROVED: More aggressive stacking enforcement =====
  useEffect(() => {
    if (!canvas) return;

    const pdfManager = new PdfManager(canvas);

    const enforceStacking = () => {
      if (pdfManager.hasPdfObjects()) {
        // Clear PDF selections if locked
        if (pdfLocked) {
          pdfManager.clearPdfSelection();
        }

        // Force PDF to back
        pdfManager.sendPdfToBack();
      }
    };

    // Listen for ANY object modifications that might affect stacking
    const events = [
      'object:added',
      'object:modified',
      'object:moving',
      'object:scaling',
      'object:rotating',
      'selection:created',
      'selection:updated',
      'mouse:up', // After any mouse interaction
    ];

    events.forEach((eventName ) => {
      canvas.on(eventName, enforceStacking);
    });

    // Also enforce on a timer for extra safety (every 100ms)
    const interval = setInterval(() => {
      if (pdfManager.hasPdfObjects()) {
        pdfManager.sendPdfToBack();
      }
    }, 100);

    return () => {
      events.forEach(eventName => {
        canvas.off(eventName, enforceStacking);
      });
      clearInterval(interval);
    };
  }, [canvas, pdfLocked]);

  // Update dimensions when scale factor changes
  useEffect(() => {
    const pdfManager = new PdfManager(canvas);

    if (pdfManager.hasPdfObjects()) {
      const { widthGrid, heightGrid } = pdfManager.getPdfDimensionsInGrid(scaleFactor, gridSizeMm);
      setPdfDimensions(widthGrid, heightGrid);
    }
  }, [canvas, scaleFactor, gridSizeMm, setPdfDimensions]);

  return null;
}
