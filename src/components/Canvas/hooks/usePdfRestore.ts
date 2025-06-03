// src/components/Canvas/hooks/usePdfRestore.ts
import { useEffect, useRef } from 'react';
import type { Canvas } from 'fabric';
import * as fabric from 'fabric';
import { useFloorStore } from '@/state/floorStore';
import { useCanvasStore } from '@/state/canvasStore';

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
        if (!gridState?.pdfData) return;

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
            
            canvas.add(img);
            canvas.sendObjectToBack(img);
            canvas.requestRenderAll();
            
            console.log(`📄 Restored PDF for floor: ${selectedFloorId}`);
          }).catch(error => {
            console.warn('Failed to load PDF image:', error);
          });
        }
      }, 150); // Slightly longer delay than module restore
    }

    previousFloorRef.current = selectedFloorId;
  }, [canvas, selectedFloorId, getActiveGridState, scaleFactor]);
}