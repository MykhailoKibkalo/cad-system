'use client';

import { fabric } from 'fabric';
import useCadStore from '@/store/cadStore';

// Add type definition for PDF.js global
declare global {
  interface Window {
    pdfjsLib: any;
  }
}

/**
 * Loads a PDF file and renders the first page to a fabric.Image
 */
export const loadPdfAsImage = async (file: File): Promise<fabric.Image> => {
  // Create a URL for the uploaded file
  const fileUrl = URL.createObjectURL(file);

  try {
    // Load PDF.js dynamically if not already loaded
    if (typeof window !== 'undefined' && !window.pdfjsLib) {
      try {
        // If PDF.js is not loaded, load it
        const pdfjsScript = document.createElement('script');
        pdfjsScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
        pdfjsScript.async = true;
        document.head.appendChild(pdfjsScript);

        // Wait for PDF.js to load
        await new Promise<void>(resolve => {
          pdfjsScript.onload = () => resolve();
        });

        console.log('PDF.js library loaded successfully');
      } catch (error) {
        console.error('Failed to load PDF.js library:', error);
        throw error;
      }
    }

    // Get PDF.js library
    const pdfjsLib = window.pdfjsLib;

    // Set worker source
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

    // Load the PDF document
    const loadingTask = pdfjsLib.getDocument(fileUrl);
    const pdf = await loadingTask.promise;

    // Get the first page
    const page = await pdf.getPage(1);

    // Set viewport scale (1 is 100%)
    const viewport = page.getViewport({ scale: 1.0 });

    // Create canvas for the PDF page
    const pdfCanvas = document.createElement('canvas');
    const context = pdfCanvas.getContext('2d');

    if (!context) {
      throw new Error('Could not get canvas context');
    }

    pdfCanvas.width = viewport.width;
    pdfCanvas.height = viewport.height;

    // Render PDF page to canvas
    const renderContext = {
      canvasContext: context,
      viewport: viewport,
    };

    await page.render(renderContext).promise;

    // Get lock status and opacity from store
    const { backdropLocked, backdropOpacity } = useCadStore.getState();

    // Create a fabric.Image from the rendered canvas
    return new Promise((resolve, reject) => {
      const fabricImage = new fabric.Image(pdfCanvas, {
        left: 0,
        top: 0,
        selectable: !backdropLocked,
        evented: !backdropLocked,
        lockMovementX: backdropLocked,
        lockMovementY: backdropLocked,
        lockRotation: backdropLocked,
        lockScalingX: backdropLocked,
        lockScalingY: backdropLocked,
        opacity: backdropOpacity / 100,
        data: {
          type: 'backdrop',
          url: fileUrl
        }
      });

      if (fabricImage) {
        resolve(fabricImage);
      } else {
        reject(new Error('Failed to create fabric image from PDF'));
      }
    });
  } catch (error) {
    // Clean up the URL
    URL.revokeObjectURL(fileUrl);
    console.error('Error loading PDF:', error);
    throw error;
  }
};

/**
 * Adds a PDF backdrop to the active floor in the CAD store
 */
export const addPdfBackdrop = async (file: File): Promise<void> => {
  try {
    const image = await loadPdfAsImage(file);
    const { floors, activeFloorIndex, setBackdrop } = useCadStore.getState();
    const activeFloor = floors[activeFloorIndex];

    setBackdrop(activeFloor.id, image);
  } catch (error) {
    console.error('Error adding PDF backdrop:', error);
    throw error;
  }
};
