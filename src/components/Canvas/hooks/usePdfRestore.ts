// src/components/Canvas/hooks/usePdfRestore.ts
import { useEffect, useRef } from 'react';
import type { Canvas } from 'fabric';
import * as fabric from 'fabric';
import { useFloorStore } from '@/state/floorStore';
import { useCanvasStore } from '@/state/canvasStore';
import { PdfManager } from '@/utils/pdfUtils';

/**
 * Hook to restore PDF to canvas when switching floors
 */
export default function usePdfRestore(canvas: Canvas | null) {
  const selectedFloorId = useFloorStore(s => s.selectedFloorId);
  const getActiveGridState = useFloorStore(s => s.getActiveGridState);
  const scaleFactor = useCanvasStore(s => s.scaleFactor);
  const previousFloorRef = useRef<string | null>(null);

  useEffect(() => {
    if (!canvas || !selectedFloorId) return;

    // Only restore PDF when floor actually changes
    if (previousFloorRef.current !== null && previousFloorRef.current !== selectedFloorId) {
      // Small delay to ensure floor sync has cleared the canvas
      setTimeout(() => {
        const gridState = getActiveGridState();
        
        // If no PDF data for this floor, clear canvas store
        if (!gridState?.pdfData) {
          const canvasStore = useCanvasStore.getState();
          canvasStore.resetPdfState();
          return;
        }

        const pdfData = gridState.pdfData;
        
        // Check if PDF needs to be restored
        const existingPdfObjects = canvas.getObjects().filter(o => (o as any).isPdfImage);
        if (existingPdfObjects.length === 0 && pdfData.url) {
          // Load and restore PDF to canvas
          fabric.loadSVGFromURL(pdfData.url, (results, options) => {
            // Handle SVG loading if needed
          });
          
          // If it's an image URL, load as image  
          fabric.Image.fromURL(pdfData.url).then((img: fabric.Image) => {
            if (!img) return;
            
            // Apply stored PDF properties
            img.set({
              originX: 'left',
              originY: 'top',
              left: pdfData.x,
              top: pdfData.y,
              scaleX: pdfData.width > 0 ? pdfData.width / (img.width || 1) : 1,
              scaleY: pdfData.height > 0 ? pdfData.height / (img.height || 1) : 1,
              opacity: pdfData.opacity,
              selectable: !pdfData.isLocked,
              evented: !pdfData.isLocked,
              hasControls: !pdfData.isLocked,
              lockMovementX: pdfData.isLocked,
              lockMovementY: pdfData.isLocked,
            });
            
            // Mark as PDF object
            (img as any).isPdfImage = true;
            
            // Apply PdfManager configuration for consistent behavior
            const pdfManager = new PdfManager(canvas);
            pdfManager.configurePdfObject(img, pdfData.isLocked, pdfData.opacity);
            
            canvas.add(img);
            canvas.sendObjectToBack(img);
            canvas.requestRenderAll();
            
            // IMPORTANT: Sync PDF state back to canvas store
            const canvasStore = useCanvasStore.getState();
            canvasStore.setPdfImported(true);
            canvasStore.setPdfOpacity(pdfData.opacity);
            canvasStore.setPdfLocked(pdfData.isLocked);
            
            // Calculate dimensions in grid units
            const widthMm = Math.round(pdfData.width / scaleFactor);
            const heightMm = Math.round(pdfData.height / scaleFactor);
            const widthGrid = Math.round(widthMm / canvasStore.gridSizeMm);
            const heightGrid = Math.round(heightMm / canvasStore.gridSizeMm);
            canvasStore.setPdfDimensions(widthGrid, heightGrid);
            
            // Set calibrated if we have a scale factor
            if (pdfData.scaleFactor) {
              canvasStore.setPdfCalibrated(true);
            }
            
            console.log(`📄 Restored PDF for floor: ${selectedFloorId} with opacity: ${pdfData.opacity}, locked: ${pdfData.isLocked}`);
          }).catch(error => {
            console.warn('Failed to load PDF image:', error);
          });
        }
      }, 150); // Slightly longer delay than module restore
    }

    previousFloorRef.current = selectedFloorId;
  }, [canvas, selectedFloorId, getActiveGridState, scaleFactor]);
}