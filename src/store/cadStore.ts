'use client';

import { create } from 'zustand';
import { fabric } from 'fabric';

interface CadState {
  canvas: fabric.Canvas | null;
  gridStep: number; // in mm
  backdropId: string | null;
  backdropLocked: boolean;
  backdropOpacity: number;
  currentTool: 'select' | 'draw-module' | 'copy' | 'remove' | 'draw-opening' | 'draw-balcony' | 'draw-bathroom';
  moduleCounter: number;
  openingCounter: number;
  balconyCounter: number;
  bathroomCounter: number;
  setCanvas: (canvas: fabric.Canvas) => void;
  setGridStep: (step: number) => void;
  setBackdropId: (id: string | null) => void;
  setBackdropLocked: (locked: boolean) => void;
  setBackdropOpacity: (opacity: number) => void;
  setTool: (tool: CadState['currentTool']) => void;
  incModuleCounter: () => number;
  incOpening: () => string;
  incBalcony: () => string;
  incBathroom: () => string;
  selectedModuleId: string | null;
  setSelectedModule: (id: string | null) => void;
}

const useCadStore = create<CadState>((set, get) => ({
  canvas: null,
  gridStep: 100, // Default grid step (100mm)
  backdropId: null,
  backdropLocked: false,
  backdropOpacity: 1,
  currentTool: 'select', // Default tool
  moduleCounter: 0, // For module naming
  openingCounter: 0,
  balconyCounter: 0,
  bathroomCounter: 0,
  setCanvas: canvas => set({ canvas }),
  setGridStep: step => set({ gridStep: step }),
  setBackdropId: id => set({ backdropId: id }),
  setBackdropLocked: locked => set({ backdropLocked: locked }),
  setBackdropOpacity: opacity => set({ backdropOpacity: opacity }),
  setTool: tool => set({ currentTool: tool }),
  incModuleCounter: () => {
    const newCounter = get().moduleCounter + 1;
    set({ moduleCounter: newCounter });
    return newCounter;
  },
  incOpening: () => {
    const newCounter = get().openingCounter + 1;
    set({ openingCounter: newCounter });
    return `OP${newCounter}`;
  },
  incBalcony: () => {
    const newCounter = get().balconyCounter + 1;
    set({ balconyCounter: newCounter });
    return `BC${newCounter}`;
  },
  incBathroom: () => {
    const newCounter = get().bathroomCounter + 1;
    set({ bathroomCounter: newCounter });
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const letter = letters[(newCounter - 1) % letters.length];
    return `BP${letter}`;
  },
  selectedModuleId: null as string|null,
  setSelectedModule: (id: string|null) => set({ selectedModuleId: id }),
}));

export default useCadStore;
