// src/state/canvasStore.ts
import { create } from 'zustand';

interface CanvasState {
  scaleFactor: number;
  gridSizeMm: number;
  snapMode: 'off' | 'grid' | 'element';
  pdfImported: boolean;
  pdfLocked: boolean;
  pdfWidthGrid: number;
  pdfHeightGrid: number;
  pdfCalibrated: boolean;
  pdfOpacity: number;
  setScaleFactor: (f: number) => void;
  setGridSize: (g: number) => void;
  setSnapMode: (m: 'off' | 'grid' | 'element') => void;
  setPdfImported: (imported: boolean) => void;
  setPdfLocked: (locked: boolean) => void;
  setPdfDimensions: (widthGrid: number, heightGrid: number) => void;
  setPdfCalibrated: (calibrated: boolean) => void;
  setPdfOpacity: (opacity: number) => void;
  resetPdfState: () => void;
  floorName: string;
  floorHeightMm: number;
  setFloorName: (n: string) => void;
  setFloorHeight: (h: number) => void;
  elementGapMm: number;
  setElementGapMm: (g: number) => void;
  zoomLevel: number;
  setZoomLevel: (z: number) => void;
  handMode: boolean;
  setHandMode: (on: boolean) => void;
  centerCanvas?: () => void;
  setCenterCanvas: (fn: () => void) => void;
  panX: number;
  panY: number;
  setPan: (x: number, y: number) => void;
  currentFloor: number;
  setCurrentFloor: (floor: number) => void;
  isInfoOpen: boolean;
  toggleInfo: () => void;
}

export const useCanvasStore = create<CanvasState>(set => ({
  scaleFactor: 1,
  gridSizeMm: 100,
  snapMode: 'off',
  pdfImported: false,
  pdfLocked: false,
  pdfWidthGrid: 0,
  pdfHeightGrid: 0,
  pdfCalibrated: false,
  pdfOpacity: 1,
  setScaleFactor: f => set({ scaleFactor: f }),
  setGridSize: g => set({ gridSizeMm: g }),
  setSnapMode: m => set({ snapMode: m }),
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
  floorName: 'Level 1',
  floorHeightMm: 3100,
  setFloorName: fn => set({ floorName: fn }),
  setFloorHeight: fh => set({ floorHeightMm: fh }),
  elementGapMm: 50,
  setElementGapMm: g => set({ elementGapMm: g }),
  zoomLevel: 1,
  setZoomLevel: zoomLevel => set({ zoomLevel }),
  handMode: false,
  setHandMode: handMode => set({ handMode }),
  setCenterCanvas: centerCanvas => set({ centerCanvas }),
  panX: 0,
  panY: 0,
  setPan: (panX, panY) => set({ panX, panY }),
  currentFloor: 1,
  setCurrentFloor: currentFloor => set({ currentFloor }),
  isInfoOpen: false,
  toggleInfo: () => set(s => ({ isInfoOpen: !s.isInfoOpen })),
}));
