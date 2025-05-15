// src/components/Canvas/hooks/usePdfLoader.ts
import { printPDF } from '@/utils/pdfUtils';

export function usePdfLoader() {
    return {
        loadPdf: printPDF,  // printPDF(pdfBlob) => Promise<HTMLCanvasElement[]>
    };
}
