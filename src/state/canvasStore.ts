import { create } from 'zustand';



interface CanvasState {
  scaleFactor: number;
  gridSizeMm: number;
  snapMode: 'off' | 'grid' | 'element';
  pdfLocked: boolean;
  setScaleFactor: (f: number) => void;
  setGridSize: (g: number) => void;
  setSnapMode: (m: 'off'|'grid'|'element') => void;
  setPdfLocked: (locked: boolean) => void;
  floorName: string;
  floorHeightMm: number;
  setFloorName: (n: string) => void;
  setFloorHeight: (h: number) => void;
  elementGapMm: number;            // gap між модулями
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
}

export const useCanvasStore = create<CanvasState>(set => ({
  scaleFactor: 1,
  gridSizeMm: 100,
  snapMode: 'off',
  pdfLocked: false,
  setScaleFactor: f => set({ scaleFactor: f }),
  setGridSize: g => set({ gridSizeMm: g }),
  setSnapMode: m => set({ snapMode: m }),
  setPdfLocked: locked => set({ pdfLocked: locked }),
  floorName: 'Level 1',
  floorHeightMm: 3100,
  setFloorName: fn => set({ floorName: fn }),
  setFloorHeight: fh => set({ floorHeightMm: fh }),
  elementGapMm: 50,
  setElementGapMm: g => set({ elementGapMm: g }),
  zoomLevel: 1,
  setZoomLevel: (zoomLevel) => set({ zoomLevel }),
  handMode: false,
  setHandMode: (handMode) => set({ handMode }),
  setCenterCanvas: (centerCanvas) => set({ centerCanvas }),
  panX: 0, panY: 0,
  setPan: (panX, panY) => set({ panX, panY }),

  currentFloor: 1,
  setCurrentFloor: (currentFloor) => set({ currentFloor }),
}));
