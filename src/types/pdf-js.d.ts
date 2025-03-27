// src/types/pdf-js.d.ts
interface PDFDocumentProxy {
  numPages: number;

  getPage(pageNumber: number): Promise<PDFPageProxy>;
}

interface PDFPageProxy {
  getViewport(options: { scale: number }): PDFPageViewport;

  render(options: { canvasContext: CanvasRenderingContext2D; viewport: PDFPageViewport }): PDFRenderTask;
}

interface PDFPageViewport {
  width: number;
  height: number;
}

interface PDFRenderTask {
  promise: Promise<void>;
}

interface PDFDocumentLoadingTask {
  promise: Promise<PDFDocumentProxy>;
}

interface PDFJSStatic {
  GlobalWorkerOptions: {
    workerSrc: string;
  };

  getDocument(source: string): PDFDocumentLoadingTask;
}

interface Window {
  pdfjsLib: PDFJSStatic;
}
