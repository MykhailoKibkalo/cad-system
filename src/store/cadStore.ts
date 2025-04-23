"use client";

import { create } from 'zustand';
import { fabric } from 'fabric';

interface CadState {
    canvas: fabric.Canvas | null;
    gridStep: number; // in mm
    backdropId: string | null;
    setCanvas: (canvas: fabric.Canvas) => void;
    setGridStep: (step: number) => void;
    setBackdropId: (id: string | null) => void;
}

const useCadStore = create<CadState>((set) => ({
    canvas: null,
    gridStep: 100, // Default grid step (100mm)
    backdropId: null,
    setCanvas: (canvas) => set({ canvas }),
    setGridStep: (step) => set({ gridStep: step }),
    setBackdropId: (id) => set({ backdropId: id }),
}));

export default useCadStore;
