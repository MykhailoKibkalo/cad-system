// src/state/canvasStore.ts (Updated)
import { create } from 'zustand';

interface CanvasState {
  scaleFactor: number;
  setScaleFactor: (f: number) => void;

  // PDF state is now moved to floor store, keeping minimal legacy support
  pdfImported: boolean;
  pdfLocked: boolean;
  pdfWidthGrid: number;
  pdfHeightGrid: number;
  pdfCalibrated: boolean;
  pdfOpacity: number;
  setPdfImported: (imported: boolean) => void;
  setPdfLocked: (locked: boolean) => void;
  setPdfDimensions: (widthGrid: number, heightGrid: number) => void;
  setPdfCalibrated: (calibrated: boolean) => void;
  setPdfOpacity: (opacity: number) => void;
  resetPdfState: () => void;

  // Floor info - now deprecated, kept for compatibility
  floorName: string;
  floorHeightMm: number;
  setFloorName: (n: string) => void;
  setFloorHeight: (h: number) => void;

  // Grid and snapping - now managed per floor
  gridSizeMm: number;
  snapMode: 'off' | 'grid' | 'element';
  elementGapMm: number;
  setGridSize: (g: number) => void;
  setSnapMode: (m: 'off' | 'grid' | 'element') => void;
  setElementGapMm: (g: number) => void;

  // Canvas controls
  zoomLevel: number;
  setZoomLevel: (z: number) => void;
  handMode: boolean;
  setHandMode: (on: boolean) => void;
  centerCanvas?: () => void;
  setCenterCanvas: (fn: () => void) => void;
  panX: number;
  panY: number;
  setPan: (x: number, y: number) => void;

  // Legacy floor info - now handled by floor store
  currentFloor: number;
  setCurrentFloor: (floor: number) => void;
  isInfoOpen: boolean;
  toggleInfo: () => void;
}

export const useCanvasStore = create<CanvasState>(set => ({
  scaleFactor: 1,
  setScaleFactor: f => set({ scaleFactor: f }),

  // Legacy PDF state - kept for backwards compatibility
  pdfImported: false,
  pdfLocked: false,
  pdfWidthGrid: 0,
  pdfHeightGrid: 0,
  pdfCalibrated: false,
  pdfOpacity: 1,
  setPdfImported: imported => set({ pdfImported: imported }),
  setPdfLocked: locked => set({ pdfLocked: locked }),
  setPdfDimensions: (widthGrid, heightGrid) =>
      set({
        pdfWidthGrid: Math.round(widthGrid),
        pdfHeightGrid: Math.round(heightGrid),
      }),
  setPdfCalibrated: calibrated => set({ pdfCalibrated: calibrated }),
  setPdfOpacity: opacity =>
      set({
        pdfOpacity: Math.max(0, Math.min(1, opacity)),
      }),
  resetPdfState: () =>
      set({
        pdfImported: false,
        pdfLocked: false,
        pdfWidthGrid: 0,
        pdfHeightGrid: 0,
        pdfCalibrated: false,
        pdfOpacity: 1,
      }),

  // Legacy floor properties - now managed by floor store
  floorName: 'Level 1',
  floorHeightMm: 3100,
  setFloorName: fn => set({ floorName: fn }),
  setFloorHeight: fh => set({ floorHeightMm: fh }),

  // Legacy grid settings - now managed per floor
  gridSizeMm: 100,
  snapMode: 'off',
  elementGapMm: 50,
  setGridSize: g => set({ gridSizeMm: g }),
  setSnapMode: m => set({ snapMode: m }),
  setElementGapMm: g => set({ elementGapMm: g }),

  // Canvas controls
  zoomLevel: 1,
  setZoomLevel: zoomLevel => set({ zoomLevel }),
  handMode: false,
  setHandMode: handMode => set({ handMode }),
  setCenterCanvas: centerCanvas => set({ centerCanvas }),
  panX: 0,
  panY: 0,
  setPan: (panX, panY) => set({ panX, panY }),

  // Legacy floor tracking
  currentFloor: 1,
  setCurrentFloor: currentFloor => set({ currentFloor }),
  isInfoOpen: false,
  toggleInfo: () => set(s => ({ isInfoOpen: !s.isInfoOpen })),
}));
