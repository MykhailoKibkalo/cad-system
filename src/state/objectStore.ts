// src/state/objectStore.ts
import { create } from 'zustand';
import { Balcony, BathroomPod, Corridor, Module, Opening } from '@/types/geometry';

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
  balconies: Balcony[];
  bathroomPods: BathroomPod[];
  roofs: [];
  addBathroomPod: (bp: BathroomPod) => void;
  updateBathroomPod: (id: string, props: Partial<BathroomPod>) => void;
  deleteBathroomPod: (id: string) => void;

  addBalcony(b: Balcony): void;

  updateBalcony(id: string, props: Partial<Balcony>): void;

  deleteBalcony(id: string): void;
}

export const useObjectStore = create<ObjState>(set => ({
  modules: [],
  openings: [],
  corridors: [],
  balconies: [],
  bathroomPods: [],
  roofs: [],
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
  addBathroomPod: b => set(state => ({ bathroomPods: [...state.bathroomPods, b] })),
  updateBathroomPod: (id, updates) =>
    set(s => ({
      bathroomPods: s.bathroomPods.map(b => (b.id === id ? { ...b, ...updates } : b)),
    })),
  deleteBathroomPod: id => set(s => ({ bathroomPods: s.bathroomPods.filter(b => b.id !== id) })),

  addBalcony: b => set(state => ({ balconies: [...state.balconies, b] })),
  updateBalcony: (id, updates) =>
    set(s => ({
      balconies: s.balconies.map(b => (b.id === id ? { ...b, ...updates } : b)),
    })),
  deleteBalcony: id => set(s => ({ balconies: s.balconies.filter(b => b.id !== id) })),
}));
