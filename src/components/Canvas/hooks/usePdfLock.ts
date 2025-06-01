// src/components/Canvas/hooks/usePdfLock.ts
import { useEffect } from 'react';
import { Canvas } from 'fabric';
import { useCanvasStore } from '@/state/canvasStore';
import { PdfManager } from '@/utils/pdfUtils';

export default function usePdfLock(canvas: Canvas | null) {
  const { pdfLocked, pdfOpacity } = useCanvasStore();

  useEffect(() => {
    if (!canvas) return;

    const pdfManager = new PdfManager(canvas);

    // Update lock state for all PDF objects
    pdfManager.updatePdfLockState(pdfLocked);

    // DON'T disable global canvas selection - only PDF selection
    // canvas.selection = !pdfLocked; // ← REMOVED: This was causing issues
  }, [canvas, pdfLocked]);

  useEffect(() => {
    if (!canvas) return;

    const pdfManager = new PdfManager(canvas);

    // Update opacity for all PDF objects
    pdfManager.updatePdfOpacity(pdfOpacity);
  }, [canvas, pdfOpacity]);

  // ===== NEW: Advanced PDF Selection Prevention =====
  useEffect(() => {
    if (!canvas) return;

    const pdfManager = new PdfManager(canvas);

    // Prevent PDF selection when locked
    const preventPdfSelection = (opt: any) => {
      if (!pdfLocked) return;

      const target = opt.target;

      // If a PDF object is being selected while locked, prevent it
      if (target && (target as any).isPdfImage) {
        // Clear the selection immediately
        canvas.discardActiveObject();
        canvas.requestRenderAll();

        // Ensure PDF stays at bottom
        pdfManager.sendPdfToBack();

        // Prevent the default selection behavior
        if (opt.e) {
          opt.e.preventDefault();
          opt.e.stopPropagation();
        }
      }
    };

    // Intercept selection events
    const onBeforeSelection = (opt: any) => {
      if (!pdfLocked) return;

      const target = opt.target;
      if (target && (target as any).isPdfImage) {
        // Prevent PDF selection by clearing the target
        opt.target = null;
        return false;
      }
    };

    // Handle selection created/updated events
    const onSelectionCreated = (opt: any) => {
      preventPdfSelection(opt);
    };

    const onSelectionUpdated = (opt: any) => {
      preventPdfSelection(opt);
    };

    // More aggressive selection prevention - intercept mouse events
    const onMouseDown = (opt: any) => {
      if (!pdfLocked) return;

      const pointer = canvas.getPointer(opt.e);
      const target = canvas.findTarget(opt.e, false);

      if (target && (target as any).isPdfImage) {
        // Prevent event propagation
        opt.e.preventDefault();
        opt.e.stopPropagation();

        // Ensure PDF stays at bottom
        pdfManager.sendPdfToBack();

        // Clear any potential selection
        canvas.discardActiveObject();
        canvas.requestRenderAll();

        return false;
      }
    };

    // Ensure PDF always stays at bottom during any interaction
    const enforcePdfStacking = () => {
      if (pdfManager.hasPdfObjects()) {
        pdfManager.sendPdfToBack();
      }
    };

    // Add event listeners
    // canvas.on('before:selection:created', onBeforeSelection);
    canvas.on('selection:created', onSelectionCreated);
    canvas.on('selection:updated', onSelectionUpdated);
    canvas.on('mouse:down', onMouseDown);

    // Enforce stacking on any object manipulation
    canvas.on('object:added', enforcePdfStacking);
    canvas.on('object:modified', enforcePdfStacking);
    canvas.on('object:moving', enforcePdfStacking);
    canvas.on('object:scaling', enforcePdfStacking);
    canvas.on('object:rotating', enforcePdfStacking);

    return () => {
      // canvas.off('before:selection:created', onBeforeSelection);
      canvas.off('selection:created', onSelectionCreated);
      canvas.off('selection:updated', onSelectionUpdated);
      canvas.off('mouse:down', onMouseDown);
      canvas.off('object:added', enforcePdfStacking);
      canvas.off('object:modified', enforcePdfStacking);
      canvas.off('object:moving', enforcePdfStacking);
      canvas.off('object:scaling', enforcePdfStacking);
      canvas.off('object:rotating', enforcePdfStacking);
    };
  }, [canvas, pdfLocked]);
}
