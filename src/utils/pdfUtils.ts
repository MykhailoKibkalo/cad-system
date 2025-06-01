// src/utils/pdfUtils.ts (Updated PdfManager section only)

// ===== EXISTING PDF RENDERING FUNCTIONS (unchanged) =====
const Base64Prefix = 'data:application/pdf;base64,';

function getPdfHandler(): any {
  return (window as any).pdfjsLib;
}

function readBlob(blob: Blob): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = rej;
    r.readAsDataURL(blob);
  });
}

/**
 * Renders all PDF pages to HTMLCanvasElement[]
 */
export async function printPDF(pdfData: Blob | string): Promise<HTMLCanvasElement[]> {
  const pdfjsLib = getPdfHandler();
  if (!pdfjsLib?.getDocument) {
    throw new Error('PDF.js not loaded; check layout.tsx');
  }

  const data = pdfData instanceof Blob ? await readBlob(pdfData) : pdfData;
  const raw = atob(data.startsWith(Base64Prefix) ? data.slice(Base64Prefix.length) : data);

  const loadingTask = pdfjsLib.getDocument({ data: raw });
  const pdf = await loadingTask.promise;
  const canvases: HTMLCanvasElement[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: window.devicePixelRatio });
    const c = document.createElement('canvas');
    c.width = Math.round(viewport.width);
    c.height = Math.round(viewport.height);
    await page.render({ canvasContext: c.getContext('2d')!, viewport }).promise;
    canvases.push(c);
  }

  return canvases;
}

// ===== IMPROVED PDF MANAGEMENT CLASS =====
import type {Canvas, Image} from 'fabric';

/**
 * Enhanced PdfManager with improved lock and stacking control
 */
export class PdfManager {
  private canvas: Canvas;

  constructor(canvas: Canvas) {
    this.canvas = canvas;
  }

  /**
   * Find all PDF objects on the canvas
   */
  getPdfObjects(): Image[] {
    return this.canvas.getObjects().filter(obj => (obj as any).isPdfImage) as Image[];
  }

  /**
   * IMPROVED: Force all PDF objects to the back with more aggressive stacking
   */
  sendPdfToBack(): void {
    const pdfObjects = this.getPdfObjects();

    // Multiple passes to ensure PDFs are truly at the bottom
    for (let pass = 0; pass < 3; pass++) {
      pdfObjects.forEach(pdfObj => {
        this.canvas.sendObjectToBack(pdfObj);
      });
    }

    // Final verification: move PDFs to absolute bottom
    pdfObjects.forEach(pdfObj => {
      const objects = this.canvas.getObjects();
      const currentIndex = objects.indexOf(pdfObj);
      if (currentIndex > 0) {
        this.canvas.moveTo(pdfObj, 0);
      }
    });
  }

  /**
   * IMPROVED: Enhanced lock state management with more restrictions
   */
  updatePdfLockState(locked: boolean): void {
    const pdfObjects = this.getPdfObjects();

    pdfObjects.forEach(pdfObj => {
      pdfObj.set({
        selectable: !locked,
        evented: !locked,
        hoverCursor: locked ? 'default' : 'move',
        moveCursor: locked ? 'default' : 'move',

        // Additional restrictions when locked
        hasControls: !locked,
        hasBorders: !locked,
        lockMovementX: locked,
        lockMovementY: locked,
        lockScalingX: locked,
        lockScalingY: locked,
        lockRotation: true, // Always lock rotation for PDFs

        // Visual feedback when locked
        strokeWidth: locked ? 0 : 1,
        stroke: locked ? 'transparent' : 'rgba(0,0,0,0.2)',
      });

      // Force PDF to back when locking
      if (locked) {
        this.canvas.sendObjectToBack(pdfObj);
      }
    });

    this.canvas.requestRenderAll();
  }

  /**
   * Update PDF object opacity
   */
  updatePdfOpacity(opacity: number): void {
    const pdfObjects = this.getPdfObjects();
    const clampedOpacity = Math.max(0, Math.min(1, opacity));

    pdfObjects.forEach(pdfObj => {
      pdfObj.set({ opacity: clampedOpacity });
    });
    this.canvas.requestRenderAll();
  }

  /**
   * Remove all PDF objects from canvas
   */
  removePdfObjects(): void {
    const pdfObjects = this.getPdfObjects();
    pdfObjects.forEach(pdfObj => {
      this.canvas.remove(pdfObj);
    });
    this.canvas.requestRenderAll();
  }

  /**
   * Calculate PDF dimensions in grid units
   */
  getPdfDimensionsInGrid(scaleFactor: number, gridSizeMm: number): { widthGrid: number; heightGrid: number } {
    const pdfObjects = this.getPdfObjects();
    if (pdfObjects.length === 0) {
      return { widthGrid: 0, heightGrid: 0 };
    }

    const pdfObj = pdfObjects[0];
    const widthPx = Math.round(pdfObj.getScaledWidth());
    const heightPx = Math.round(pdfObj.getScaledHeight());

    const widthMm = widthPx / scaleFactor;
    const heightMm = heightPx / scaleFactor;

    const widthGrid = Math.round(widthMm / gridSizeMm);
    const heightGrid = Math.round(heightMm / gridSizeMm);

    return { widthGrid, heightGrid };
  }

  /**
   * Check if canvas has any PDF objects
   */
  hasPdfObjects(): boolean {
    return this.getPdfObjects().length > 0;
  }

  /**
   * NEW: Force clear any PDF selections
   */
  clearPdfSelection(): void {
    const activeObject = this.canvas.getActiveObject();

    if (activeObject) {
      // Check if active object is a PDF
      if ((activeObject as any).isPdfImage) {
        this.canvas.discardActiveObject();
        this.sendPdfToBack();
        this.canvas.requestRenderAll();
      }

      // Check if active selection contains PDFs
      if ((activeObject as any).type === 'activeSelection') {
        const objects = (activeObject as any)._objects || [];
        const hasPdf = objects.some((obj: any) => obj.isPdfImage);

        if (hasPdf) {
          this.canvas.discardActiveObject();
          this.sendPdfToBack();
          this.canvas.requestRenderAll();
        }
      }
    }
  }

  /**
   * NEW: Ensure PDF objects are properly configured on creation
   */
  configurePdfObject(pdfObj: Image, locked: boolean = false, opacity: number = 1): void {
    pdfObj.set({
      // Mark as PDF
      ...(pdfObj as any),
      isPdfImage: true,

      // Lock state
      selectable: !locked,
      evented: !locked,
      hasControls: !locked,
      hasBorders: !locked,
      lockMovementX: locked,
      lockMovementY: locked,
      lockScalingX: locked,
      lockScalingY: locked,
      lockRotation: true, // Always lock rotation

      // Visual properties
      opacity: Math.max(0, Math.min(1, opacity)),
      hoverCursor: locked ? 'default' : 'move',
      moveCursor: locked ? 'default' : 'move',

      // Positioning
      originX: 'left',
      originY: 'top',
    });
  }

  /**
   * NEW: Emergency PDF management - force all PDFs to behave correctly
   */
  emergencyPdfReset(locked: boolean, opacity: number): void {
    const pdfObjects = this.getPdfObjects();

    // Clear any selections first
    this.canvas.discardActiveObject();

    // Reconfigure all PDF objects
    pdfObjects.forEach(pdfObj => {
      this.configurePdfObject(pdfObj, locked, opacity);
    });

    // Force to back multiple times
    for (let i = 0; i < 5; i++) {
      this.sendPdfToBack();
    }

    this.canvas.requestRenderAll();
  }
}
