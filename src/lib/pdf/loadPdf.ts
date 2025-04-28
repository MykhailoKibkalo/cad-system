import { getDocument, PDFDocumentProxy } from 'pdfjs-dist';
import { fabric } from 'fabric';
import configurePdfWorker from './pdfWorker';

// Configure the PDF.js worker
configurePdfWorker();

/**
 * Loads a PDF file and renders the first page to a canvas element
 */
export const loadPdfAsImage = async (file: File): Promise<fabric.Image> => {
  return new Promise(async (resolve, reject) => {
    try {
      // Read the file as an ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();

      // Load the PDF document
      const loadingTask = getDocument({ data: arrayBuffer });
      const pdf: PDFDocumentProxy = await loadingTask.promise;

      // Get the first page
      const page = await pdf.getPage(1);

      // Get the viewport at 100% scale
      const viewport = page.getViewport({ scale: 1.0 });

      // Create a canvas for rendering
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');

      if (!context) {
        throw new Error('Failed to get canvas context');
      }

      // Set dimensions
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      // Render the page
      const renderContext = {
        canvasContext: context,
        viewport: viewport,
      };

      await page.render(renderContext).promise;

      // Convert canvas to Fabric image
      fabric.Image.fromURL(canvas.toDataURL('image/png'), img => {
        img.set({
          left: 0,
          top: 0,
          selectable: false,
          lockMovementX: true,
          lockMovementY: true,
          lockRotation: true,
          lockScalingX: true,
          lockScalingY: true,
        });
        resolve(img);
      });
    } catch (error) {
      reject(error);
    }
  });
};
