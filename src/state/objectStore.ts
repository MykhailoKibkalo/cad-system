// src/state/objectStore.ts
import { create } from 'zustand';
import { Corridor, Module, Opening } from '@/types/geometry';

interface ObjState {
  modules: Module[];
  openings: Opening[];
  corridors: Corridor[];
  addModule: (m: Module) => void;
  addOpening: (o: Opening) => void;
  addCorridor: (c: Corridor) => void;
}

export const useObjectStore = create<ObjState>(set => ({
  modules: [],
  openings: [],
  corridors: [],
  addModule: m => set(state => ({ modules: [...state.modules, m] })),
  addOpening: o => set(state => ({ openings: [...state.openings, o] })),
  addCorridor: c => set(state => ({ corridors: [...state.corridors, c] })),
}));
