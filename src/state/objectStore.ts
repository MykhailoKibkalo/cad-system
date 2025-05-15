// src/state/objectStore.ts
import { create } from 'zustand';
import { Corridor, Module, Opening } from '@/types/geometry';

interface ObjState {
  modules: Module[];
  openings: Opening[];
  corridors: Corridor[];
  addModule: (m: Module) => void;
  addOpening: (o: Opening) => void;
  updateModule: (id: string, updates: Partial<Module>) => void;
  deleteModule: (id: string) => void;
  updateOpening: (id: string, props: Partial<Opening>) => void;
  deleteOpening: (id: string) => void;
  addCorridor: (c: Corridor) => void; // ← добавили
  updateCorridor: (id: string, props: Partial<Corridor>) => void;
  deleteCorridor: (id: string) => void;
}

export const useObjectStore = create<ObjState>(set => ({
  modules: [],
  openings: [],
  corridors: [],
  addModule: m => set(state => ({ modules: [...state.modules, m] })),
  addOpening: o => set(state => ({ openings: [...state.openings, o] })),
  updateModule: (id, updates) =>
    set(s => ({
      modules: s.modules.map(m => (m.id === id ? { ...m, ...updates } : m)),
    })),
  deleteModule: id =>
    set(s => ({
      modules: s.modules.filter(m => m.id !== id),
      // каскадно прибираємо openings, що належали цьому модулю
      openings: s.openings.filter(o => o.moduleId !== id),
    })),
  updateOpening: (id, props) =>
    set(s => ({
      openings: s.openings.map(o => (o.id === id ? { ...o, ...props } : o)),
    })),
  deleteOpening: id => set(s => ({ openings: s.openings.filter(o => o.id !== id) })),
  addCorridor: c => set(s => ({ corridors: [...s.corridors, c] })),
  updateCorridor: (id, props) =>
    set(s => ({
      corridors: s.corridors.map(c => (c.id === id ? { ...c, ...props } : c)),
    })),
  deleteCorridor: id => set(s => ({ corridors: s.corridors.filter(c => c.id !== id) })),
}));
