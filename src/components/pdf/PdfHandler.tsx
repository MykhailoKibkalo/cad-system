// src/components/pdf/PdfHandler.tsx
import {fabric} from 'fabric';

/**
 * Loads a PDF from a URL and renders it on the canvas
 */
export const loadPdfToCanvas = async (
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
): Promise<fabric.Image | null> => {
  if (!canvas) return null;

  // Load PDF.js dynamically
  if (typeof window !== 'undefined' && !window.pdfjsLib) {
    // If PDF.js is not loaded, load it
    const pdfjsScript = document.createElement('script');
    pdfjsScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    pdfjsScript.async = true;
    document.head.appendChild(pdfjsScript);

    // Wait for PDF.js to load
    await new Promise<void>(resolve => {
      pdfjsScript.onload = () => resolve();
    });
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
      selectable: options.selectable ?? true, // Make selectable by default for movement
      evented: true,
      opacity: options.opacity || 1,
      // Add border properties when selected for better visibility
      borderColor: '#0080ff',
      borderDashArray: [5, 5],
      cornerColor: '#0080ff',
      cornerSize: 10,
      transparentCorners: false,
      hasControls: true, // Allow resizing with controls
      hasBorders: true,
      lockRotation: true, // Prevent rotation of the PDF backdrop
    });

    // Assign data to identify this as a PDF backdrop
    fabricImage.data = {
      type: 'pdfBackdrop',
      url: pdfUrl,
      scale: scale,
      page: options.page || 1,
    };

    // Remove any existing PDF backdrops
    const existingBackdrops = canvas.getObjects().filter(obj => obj.data?.type === 'pdfBackdrop');
    existingBackdrops.forEach(obj => canvas.remove(obj));

    // Add the PDF as background
    canvas.add(fabricImage);
    canvas.sendToBack(fabricImage);
    canvas.renderAll();

    return fabricImage;
  } catch (error) {
    console.error('Error loading PDF:', error);
    return null;
  }
};

/**
 * Adjusts an existing PDF backdrop on the canvas
 */
export const adjustPdfBackdrop = (
  canvas: fabric.Canvas,
  options: {
    scale?: number;
    opacity?: number;
    x?: number;
    y?: number;
  }
): void => {
  if (!canvas) return;

  // Find existing PDF backdrop
  const backdrop = canvas.getObjects().find(obj => obj.data?.type === 'pdfBackdrop') as fabric.Image;

  if (!backdrop) return;

  // Update properties
  if (options.opacity !== undefined) {
    backdrop.set('opacity', options.opacity);
  }

  if (options.scale !== undefined && backdrop.data.scale !== options.scale) {
    // We need to reload the PDF with new scale
    loadPdfToCanvas(canvas, backdrop.data.url, {
      scale: options.scale,
      opacity: options.opacity !== undefined ? options.opacity : backdrop.opacity,
      x: options.x !== undefined ? options.x : backdrop.left,
      y: options.y !== undefined ? options.y : backdrop.top,
      page: backdrop.data.page,
    });
    return;
  }

  if (options.x !== undefined) {
    backdrop.set('left', options.x);
  }

  if (options.y !== undefined) {
    backdrop.set('top', options.y);
  }

  canvas.renderAll();
};

/**
 * Removes a PDF backdrop from the canvas
 */
export const removePdfBackdrop = (canvas: fabric.Canvas): void => {
  if (!canvas) return;

  const backdrop = canvas.getObjects().find(obj => obj.data?.type === 'pdfBackdrop');
  if (backdrop) {
    canvas.remove(backdrop);
    canvas.renderAll();
  }
};
