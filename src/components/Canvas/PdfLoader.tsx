// src/components/Canvas/PdfLoader.tsx
'use client';

import { useEffect } from 'react';
import * as fabric from 'fabric';
import { printPDF, PdfManager } from '@/utils/pdfUtils';
import { useCanvasStore } from '@/state/canvasStore';
import { useFloorStore } from '@/state/floorStore';
import { useCurrentFloorPdfData } from './hooks/useFloorElements';

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
    resetPdfState,
  } = useCanvasStore();
  
  const pdfData = useCurrentFloorPdfData();
  const setActivePdfData = useFloorStore(s => s.setActivePdfData);
  const pdfLocked = pdfData?.isLocked || false;
  const pdfOpacity = pdfData?.opacity || 1;

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

        // We'll store the first page's data URL for floor persistence
        let pdfDataUrl: string | null = null;
        let pdfImage: fabric.Image | null = null;

        for (const cEl of pages) {
          const img = new fabric.Image(cEl, {
            // Basic Fabric.js properties
            originX: 'left',
            originY: 'top',
            left: 0, // Explicit position
            top: 0,
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
          
          // Also mark as PDF image for our tracking
          (img as any).isPdfImage = true;

          canvas.add(img);

          // Force to back immediately after adding
          canvas.sendObjectToBack(img);

          // For the first page, convert to data URL for persistence
          if (!pdfImage) {
            pdfImage = img;
            // Convert canvas element to data URL for floor storage
            pdfDataUrl = cEl.toDataURL('image/png');
          }
        }

        // ===== ADDITIONAL SAFETY: Emergency reset to ensure proper state =====
        pdfManager.emergencyPdfReset(pdfLocked, pdfOpacity);

        canvas.requestRenderAll();

        // Update PDF state
        setPdfImported(true);

        // Calculate dimensions in grid units
        const { widthGrid, heightGrid } = pdfManager.getPdfDimensionsInGrid(scaleFactor, gridSizeMm);
        setPdfDimensions(widthGrid, heightGrid);

        // Save PDF data to floor store
        if (pdfDataUrl && pdfImage) {
          // Small delay to ensure the image is fully rendered and positioned
          setTimeout(() => {
            // Get the actual position after it's been added to canvas
            const pdfObjects = canvas.getObjects().filter(o => (o as any).isPdfImage);
            if (pdfObjects.length > 0) {
              const actualPdf = pdfObjects[0];
              setActivePdfData({
                url: pdfDataUrl,
                width: Math.round(actualPdf.getScaledWidth()),
                height: Math.round(actualPdf.getScaledHeight()),
                x: Math.round(actualPdf.left || 0),
                y: Math.round(actualPdf.top || 0),
                opacity: pdfOpacity,
                isLocked: pdfLocked,
                scaleFactor: scaleFactor,
              });
              console.log(`📄 Saved PDF to floor store with position: x=${actualPdf.left}, y=${actualPdf.top}`);
            }
          }, 100);
        }

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
  }, [canvas, setPdfImported, setPdfDimensions, setPdfCalibrated, scaleFactor, gridSizeMm, pdfLocked, pdfOpacity, resetPdfState, setActivePdfData]);

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
      canvas.on(eventName as any, enforceStacking);
    });

    // Also enforce on a timer for extra safety (every 100ms)
    const interval = setInterval(() => {
      if (pdfManager.hasPdfObjects()) {
        pdfManager.sendPdfToBack();
      }
    }, 100);

    return () => {
      events.forEach(eventName => {
        canvas.off(eventName as any, enforceStacking);
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

  // Update floor store when PDF is moved or modified
  useEffect(() => {
    if (!canvas) return;

    const updatePdfInFloorStore = (e: any) => {
      const pdf = e.target;
      if (!(pdf as any).isPdfImage) return;
      
      // Get current PDF data from floor store
      const currentPdfData = useFloorStore.getState().getActiveGridState()?.pdfData;
      if (!currentPdfData?.url) return;
      
      // Update PDF data in floor store with new position/size
      // Preserve all existing properties
      setActivePdfData({
        ...currentPdfData, // Preserve all existing properties
        width: Math.round(pdf.getScaledWidth()),
        height: Math.round(pdf.getScaledHeight()),
        x: Math.round(pdf.left || 0),
        y: Math.round(pdf.top || 0),
        scaleFactor: scaleFactor,
      });
      
      console.log(`📄 Updated PDF position in floor store: x=${pdf.left}, y=${pdf.top}`);
    };

    // Only listen for final modifications, not intermediate states
    canvas.on('object:modified', updatePdfInFloorStore);

    return () => {
      canvas.off('object:modified', updatePdfInFloorStore);
    };
  }, [canvas, scaleFactor, setActivePdfData]);

  return null;
}
