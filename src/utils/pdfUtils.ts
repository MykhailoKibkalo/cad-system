// src/utils/pdfUtils.ts
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
 * Рендерить всі сторінки PDF в HTMLCanvasElement[]
 */
export async function printPDF(pdfData: Blob | string): Promise<HTMLCanvasElement[]> {
  const pdfjsLib = getPdfHandler();
  if (!pdfjsLib?.getDocument) {
    throw new Error('PDF.js не завантажено; перевірте layout.tsx');
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
    c.width = viewport.width;
    c.height = viewport.height;
    await page.render({ canvasContext: c.getContext('2d')!, viewport }).promise;
    canvases.push(c);
  }

  return canvases;
}
