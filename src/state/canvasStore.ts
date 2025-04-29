// src/state/canvasStore.ts
import { create } from 'zustand';

interface CanvasState {
  scaleFactor: number;
  gridSizeMm: number;
  snapMode: 'off' | 'grid' | 'element';
  setScaleFactor: (f: number) => void;
  setGridSize: (g: number) => void;
  setSnapMode: (m: 'off' | 'grid' | 'element') => void;
}

export const useCanvasStore = create<CanvasState>(set => ({
  scaleFactor: 1,
  gridSizeMm: 100,
  // snapMode: 'grid',
  snapMode: 'off',
  setScaleFactor: f => set({ scaleFactor: f }),
  setGridSize: g => set({ gridSizeMm: g }),
  setSnapMode: m => set({ snapMode: m }),
}));
