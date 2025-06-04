// src/state/canvasRefStore.ts
import { create } from 'zustand';
import type { Canvas } from 'fabric';

interface CanvasRefState {
  canvas: Canvas | null;
  setCanvas: (canvas: Canvas | null) => void;
}

export const useCanvasRefStore = create<CanvasRefState>((set) => ({
  canvas: null,
  setCanvas: (canvas) => set({ canvas }),
}));