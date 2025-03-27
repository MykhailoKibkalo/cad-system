// src/utils/pdfUtils.ts
import { fabric } from 'fabric';

const Base64Prefix = 'data:application/pdf;base64,';

export async function getPdfHandler() {
  // Dynamic import to avoid server-side rendering issues
  if (typeof window !== 'undefined') {
    return await import('pdfjs-dist/build/pdf');
  }
  return null;
}

export function readBlob(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => resolve(reader.result as string));
    reader.addEventListener('error', reject);
    reader.readAsDataURL(blob);
  });
}

export async function printPDF(pdfData: Blob | string, pages?: number[]): Promise<HTMLCanvasElement[]> {
  const pdfjsLib = await getPdfHandler();
  if (!pdfjsLib) return [];

  // Convert Blob to base64 if needed
  if (pdfData instanceof Blob) {
    pdfData = await readBlob(pdfData);
  }

  // Extract the base64 data
  const data = atob(pdfData.startsWith(Base64Prefix) ? pdfData.substring(Base64Prefix.length) : pdfData);

  // Using DocumentInitParameters object to load binary data
  const loadingTask = pdfjsLib.getDocument({ data });

  try {
    const pdf = await loadingTask.promise;
    const numPages = pdf.numPages;

    // Process all pages (or only selected pages if specified)
    const pagePromises = new Array(numPages).fill(0).map(async (__, i) => {
      const pageNumber = i + 1;

      // Skip if page isn't in the requested pages array
      if (pages && !pages.includes(pageNumber)) {
        return null;
      }

      try {
        const page = await pdf.getPage(pageNumber);

        // Create canvas with proper scale for retina displays
        const viewport = page.getViewport({ scale: window.devicePixelRatio || 1 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        if (!context) {
          throw new Error('Could not get canvas context');
        }

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        // Render PDF page into canvas context
        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };

        await page.render(renderContext).promise;
        return canvas;
      } catch (error) {
        console.error(`Error rendering page ${pageNumber}:`, error);
        return null;
      }
    });

    // Wait for all pages to be processed and filter out nulls
    const canvases = await Promise.all(pagePromises);
    return canvases.filter((canvas): canvas is HTMLCanvasElement => canvas !== null);
  } catch (error) {
    console.error('Error loading PDF document:', error);
    return [];
  }
}

export async function pdfToFabricImage(pdfData: Blob | string, pages?: number[]): Promise<fabric.Image[]> {
  try {
    const canvases = await printPDF(pdfData, pages);
    const scale = 1 / (window.devicePixelRatio || 1);

    const images = canvases.map(canvas => {
      return new fabric.Image(canvas, {
        scaleX: scale,
        scaleY: scale,
      });
    });

    return images;
  } catch (error) {
    console.error('Error converting PDF to images:', error);
    return [];
  }
}
