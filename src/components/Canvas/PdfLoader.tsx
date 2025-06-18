// src/components/Canvas/PdfLoader.tsx
'use client';

import { useEffect } from 'react';
import * as fabric from 'fabric';
import { printPDF, PdfManager } from '@/utils/pdfUtils';
import { useCanvasStore } from '@/state/canvasStore';
import { useFloorStore } from '@/state/floorStore';
import { useCurrentFloorPdfData } from './hooks/useFloorElements';
import { rectBottomToTopYMm, rectTopToBottomYMm } from '@/utils/coordinateTransform';

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
    gridHeightM,
  } = useCanvasStore();

  const pdfData = useCurrentFloorPdfData();
  const setActivePdfData = useFloorStore(s => s.setActivePdfData);
  const getActiveGridState = useFloorStore(s => s.getActiveGridState);
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

        // Get grid dimensions once, outside the loop
        const activeGridState = getActiveGridState();
        const currentGridHeightM = activeGridState?.gridHeightM || gridHeightM;

        for (const cEl of pages) {
          // Position PDF at grid coordinates (0,0) which is bottom-left of grid

          // PDF dimensions in mm
          const pdfWidthMm = (cEl.width * scale) / scaleFactor;
          const pdfHeightMm = (cEl.height * scale) / scaleFactor;

          // Grid coordinates (0,0) = bottom-left corner
          const gridX = 0; // Left edge of grid
          const gridY = 0; // Bottom edge of grid (in bottom-left coordinate system)

          // Convert from bottom-left grid coordinates to top-left canvas coordinates
          const topYMm = rectBottomToTopYMm(gridY, pdfHeightMm, currentGridHeightM);

          // Convert to pixels
          const canvasX = gridX * scaleFactor;
          const canvasY = topYMm * scaleFactor;

          const img = new fabric.Image(cEl, {
            // Basic Fabric.js properties
            originX: 'left',
            originY: 'top',
            left: canvasX, // Grid position converted to canvas
            top: canvasY, // Grid position converted to canvas
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
              console.log(`📄 INITIAL IMPORT - Saved PDF to floor store:`, {
                position: { x: actualPdf.left, y: actualPdf.top },
                dimensions: { width: Math.round(actualPdf.getScaledWidth()), height: Math.round(actualPdf.getScaledHeight()) },
                scaleFactor: scaleFactor,
                gridHeightM: currentGridHeightM
              });
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

  // Update dimensions and reposition PDF when scale factor changes
  useEffect(() => {
    const pdfManager = new PdfManager(canvas);

    if (pdfManager.hasPdfObjects()) {
      const { widthGrid, heightGrid } = pdfManager.getPdfDimensionsInGrid(scaleFactor, gridSizeMm);
      setPdfDimensions(widthGrid, heightGrid);

      // Reactive PDF positioning - mimic how modules handle scale factor changes
      const pdfObjects = canvas.getObjects().filter(obj => (obj as any).isPdfImage);
      if (pdfObjects.length > 0) {
        const pdf = pdfObjects[0];

        // Get current PDF data
        const currentPdfData = useFloorStore.getState().getActiveGridState()?.pdfData;
        if (currentPdfData?.url) {
          // Get the active floor's grid dimensions
          const activeGridState = getActiveGridState();
          const currentGridHeightM = activeGridState?.gridHeightM || gridHeightM;

          // Get the stored scale factor
          const storedScaleFactor = currentPdfData.scaleFactor || 1;

          // Calculate the original PDF dimensions in mm
          const originalPdfWidthMm = currentPdfData.width / storedScaleFactor;
          const originalPdfHeightMm = currentPdfData.height / storedScaleFactor;

          // Convert stored top-left position to grid coordinates (bottom-left system)
          const storedTopYMm = currentPdfData.y / storedScaleFactor;
          const storedLeftXMm = currentPdfData.x / storedScaleFactor;

          // Calculate the bottom-left corner in grid coordinates
          // This is the position we want to maintain
          const gridBottomY = rectTopToBottomYMm(storedTopYMm, originalPdfHeightMm, currentGridHeightM);
          const gridLeftX = storedLeftXMm;

          // Now calculate new canvas position with new scale factor
          // The PDF dimensions will scale with the new factor
          const newPdfWidthMm = originalPdfWidthMm;  // Logical size stays the same
          const newPdfHeightMm = originalPdfHeightMm; // Logical size stays the same

          // Convert grid bottom-left back to canvas top-left with new scale
          const newTopYMm = rectBottomToTopYMm(gridBottomY, newPdfHeightMm, currentGridHeightM);
          const newCanvasX = gridLeftX * scaleFactor;
          const newCanvasY = newTopYMm * scaleFactor;

          // Apply the calculated position (like modules do)
          pdf.set({
            left: newCanvasX,
            top: newCanvasY
          });

          canvas.requestRenderAll();

          // Update the floor store with new pixel position and scale factor
          setActivePdfData({
            ...currentPdfData,
            x: Math.round(newCanvasX),
            y: Math.round(newCanvasY),
            scaleFactor: scaleFactor,
          });

          console.log(`📄 PDF repositioned after scale change:`, {
            oldScale: storedScaleFactor,
            newScale: scaleFactor,
            gridPosition: { x: gridLeftX.toFixed(0), bottomY: gridBottomY.toFixed(0) },
            oldCanvasPos: { x: currentPdfData.x, y: currentPdfData.y },
            newCanvasPos: { x: newCanvasX.toFixed(0), y: newCanvasY.toFixed(0) },
            pdfSize: { width: newPdfWidthMm.toFixed(0), height: newPdfHeightMm.toFixed(0) }
          });
        }
      }
    }
  }, [canvas, scaleFactor, gridSizeMm, setPdfDimensions, gridHeightM, getActiveGridState, setActivePdfData]);

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
