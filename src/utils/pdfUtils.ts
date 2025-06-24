import type {Canvas, Image} from 'fabric';
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



export class PdfManager {
  private canvas: Canvas;

  constructor(canvas: Canvas) {
    this.canvas = canvas;
  }

  getPdfObjects(): Image[] {
    return this.canvas.getObjects().filter(obj => (obj as any).isPdf || (obj as any).isPdfImage) as Image[];
  }

  sendPdfToBack(): void {
    const pdfObjects = this.getPdfObjects();

    for (let pass = 0; pass < 3; pass++) {
      pdfObjects.forEach(pdfObj => {
        this.canvas.sendObjectToBack(pdfObj);
      });
    }

    pdfObjects.forEach(pdfObj => {
      const objects = this.canvas.getObjects();
      const currentIndex = objects.indexOf(pdfObj);
      if (currentIndex > 0) {
        this.canvas.moveObjectTo(pdfObj, 0);
      }
    });
  }


  updatePdfLockState(locked: boolean): void {
    const pdfObjects = this.getPdfObjects();

    pdfObjects.forEach(pdfObj => {
      pdfObj.set({
        selectable: !locked,
        evented: !locked,
        hoverCursor: locked ? 'default' : 'move',
        moveCursor: locked ? 'default' : 'move',
        hasControls: !locked,
        hasBorders: !locked,
        lockMovementX: locked,
        lockMovementY: locked,
        lockScalingX: locked,
        lockScalingY: locked,
        lockRotation: true,
        strokeWidth: locked ? 0 : 1,
        stroke: locked ? 'transparent' : 'rgba(0,0,0,0.2)',
      });

      if (locked) {
        this.canvas.sendObjectToBack(pdfObj);
      }
    });

    this.canvas.requestRenderAll();
  }

  updatePdfOpacity(opacity: number): void {
    const pdfObjects = this.getPdfObjects();
    const clampedOpacity = Math.max(0, Math.min(1, opacity));

    pdfObjects.forEach(pdfObj => {
      pdfObj.set({ opacity: clampedOpacity });
    });
    this.canvas.requestRenderAll();
  }


  removePdfObjects(): void {
    const pdfObjects = this.getPdfObjects();
    pdfObjects.forEach(pdfObj => {
      this.canvas.remove(pdfObj);
    });
    this.canvas.requestRenderAll();
  }


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


  hasPdfObjects(): boolean {
    return this.getPdfObjects().length > 0;
  }


  clearPdfSelection(): void {
    const activeObject = this.canvas.getActiveObject();

    if (activeObject) {
      if ((activeObject as any).isPdf || (activeObject as any).isPdfImage) {
        this.canvas.discardActiveObject();
        this.sendPdfToBack();
        this.canvas.requestRenderAll();
      }

      if ((activeObject as any).type === 'activeSelection') {
        const objects = (activeObject as any)._objects || [];
        const hasPdf = objects.some((obj: any) => obj.isPdf || obj.isPdfImage);

        if (hasPdf) {
          this.canvas.discardActiveObject();
          this.sendPdfToBack();
          this.canvas.requestRenderAll();
        }
      }
    }
  }


  configurePdfObject(pdfObj: Image, locked: boolean = false, opacity: number = 1): void {
    pdfObj.set({
      selectable: !locked,
      evented: !locked,
      hasControls: !locked,
      hasBorders: !locked,
      lockMovementX: locked,
      lockMovementY: locked,
      lockScalingX: locked,
      lockScalingY: locked,
      lockRotation: true,
      opacity: Math.max(0, Math.min(1, opacity)),
      hoverCursor: locked ? 'default' : 'move',
      moveCursor: locked ? 'default' : 'move',
      originX: 'left',
      originY: 'top',
    });

    (pdfObj as any).isPdf = true;
    (pdfObj as any).isPdfImage = true;
  }


  emergencyPdfReset(locked: boolean, opacity: number): void {
    const pdfObjects = this.getPdfObjects();

    this.canvas.discardActiveObject();

    pdfObjects.forEach(pdfObj => {
      this.configurePdfObject(pdfObj, locked, opacity);
    });

    for (let i = 0; i < 5; i++) {
      this.sendPdfToBack();
    }

    this.canvas.requestRenderAll();
  }
}
