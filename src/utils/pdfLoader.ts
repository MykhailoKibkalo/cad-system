"use client";

import { fabric } from 'fabric';

/**
 * Loads a PDF from a file and renders it on the canvas
 * @param file The PDF file to load
 * @param canvas The fabric canvas to add the PDF to
 * @returns Promise resolving to the fabric.Image object
 */
export async function addPdfToCanvas(file: File, canvas: fabric.Canvas): Promise<fabric.Image> {
  // Create a URL for the uploaded file
  const fileUrl = URL.createObjectURL(file);

  try {
    // Create a fabric image from the rendered PDF
    const pdfImage = await loadPdfToCanvas(canvas, fileUrl);

    if (!pdfImage) {
      throw new Error('Failed to render PDF');
    }

    return pdfImage;
  } catch (error) {
    console.error('Error adding PDF to canvas:', error);
    URL.revokeObjectURL(fileUrl);
    throw error;
  }
}

/**
 * Loads a PDF from a URL and renders it on the canvas
 * @param canvas The fabric canvas to add the PDF to
 * @param pdfUrl The URL of the PDF to load
 * @param options Additional options for loading
 * @returns Promise resolving to the fabric.Image object
 */
export async function loadPdfToCanvas(
    canvas: fabric.Canvas,
    pdfUrl: string,
    options: {
      scale?: number;
      opacity?: number;
      x?: number;
      y?: number;
      page?: number;
      selectable?: boolean;
    } = {}
): Promise<fabric.Image | null> {
  if (!canvas) return null;

  // Load PDF.js dynamically
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
      return null;
    }
  }

  try {
    // Get PDF.js library
    const pdfjsLib = window.pdfjsLib;

    // Set worker source
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

    // Load the PDF document
    const loadingTask = pdfjsLib.getDocument(pdfUrl);
    const pdf = await loadingTask.promise;

    // Get the first page (or specified page)
    const page = await pdf.getPage(options.page || 1);

    // Set viewport scale
    const scale = options.scale || 1;
    const viewport = page.getViewport({ scale });

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

    // Create Fabric.js image from the rendered canvas
    const fabricImage = new fabric.Image(pdfCanvas, {
      left: options.x || 0,
      top: options.y || 0,
      selectable: options.selectable ?? false,
      evented: options.selectable ?? false,
      opacity: options.opacity || 1,
    });

    // Assign data to identify this as a PDF backdrop
    fabricImage.data = {
      type: 'backdrop',
      url: pdfUrl,
    };

    // Remove any existing backdrops
    const existingBackdrops = canvas.getObjects().filter(obj => obj.data?.type === 'backdrop');
    existingBackdrops.forEach(obj => canvas.remove(obj));

    // Add the PDF as background
    canvas.add(fabricImage);
    fabricImage.sendToBack();
    canvas.renderAll();

    console.log('PDF loaded successfully');
    return fabricImage;
  } catch (error) {
    console.error('Error loading PDF:', error);
    return null;
  }
}
