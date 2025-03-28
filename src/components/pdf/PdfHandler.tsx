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
    preservePosition?: boolean; // New option to preserve position outside canvas
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
      evented: options.selectable ?? true,
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
      preservePosition: options.preservePosition || false,
    };

    // Remove any existing PDF backdrops
    const existingBackdrops = canvas.getObjects().filter(obj => obj.data?.type === 'pdfBackdrop');
    existingBackdrops.forEach(obj => canvas.remove(obj));

    // Add the PDF as background
    canvas.add(fabricImage);
    canvas.sendToBack(fabricImage);
    canvas.renderAll();

    console.log('PDF loaded successfully', options);
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
    selectable?: boolean;
    preservePosition?: boolean;
  }
): void => {
  if (!canvas) return;

  // Find existing PDF backdrop
  const backdrop = canvas.getObjects().find(obj => obj.data?.type === 'pdfBackdrop') as fabric.Image;

  if (!backdrop) return;

  // Get current preserve position setting
  const preservePosition =
    options.preservePosition !== undefined ? options.preservePosition : backdrop.data?.preservePosition || false;

  // Update properties
  if (options.opacity !== undefined) {
    backdrop.set('opacity', options.opacity);
  }

  if (options.selectable !== undefined) {
    backdrop.set('selectable', options.selectable);
    backdrop.set('evented', options.selectable);
  }

  if (options.scale !== undefined && backdrop.data.scale !== options.scale) {
    // We need to reload the PDF with new scale but preserve position
    const currentPosition = {
      x: options.x !== undefined ? options.x : backdrop.left,
      y: options.y !== undefined ? options.y : backdrop.top,
    };

    loadPdfToCanvas(canvas, backdrop.data.url, {
      scale: options.scale,
      opacity: options.opacity !== undefined ? options.opacity : backdrop.opacity,
      x: currentPosition.x,
      y: currentPosition.y,
      page: backdrop.data.page,
      selectable: options.selectable !== undefined ? options.selectable : backdrop.selectable,
      preservePosition: preservePosition,
    });
    return;
  }

  if (options.x !== undefined) {
    backdrop.set('left', options.x);
  }

  if (options.y !== undefined) {
    backdrop.set('top', options.y);
  }

  // Update the preservePosition property in data
  if (backdrop.data) {
    backdrop.data.preservePosition = preservePosition;
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

/**
 * Toggle the lock state of a PDF backdrop
 */
export const togglePdfBackdropLock = (canvas: fabric.Canvas, locked: boolean): void => {
  if (!canvas) return;

  const backdrop = canvas.getObjects().find(obj => obj.data?.type === 'pdfBackdrop') as fabric.Image;
  if (!backdrop) return;

  // Store the current position before locking
  const currentPosition = {
    x: backdrop.left,
    y: backdrop.top,
  };

  backdrop.set({
    selectable: !locked,
    evented: !locked,
  });

  // If locking, also reset the current selection if it's the PDF
  if (locked && canvas.getActiveObject() === backdrop) {
    canvas.discardActiveObject();
  }

  // Make sure we maintain the exact position when locking
  if (locked) {
    backdrop.set({
      left: currentPosition.x,
      top: currentPosition.y,
    });

    // Make sure the data property reflects we want to preserve position
    if (backdrop.data) {
      backdrop.data.preservePosition = true;
    }
  }

  canvas.renderAll();
};
