// src/state/selectionStore.ts
import { create } from 'zustand';

interface SelectionState {
  selectedModuleId: string | null;
  selectedOpeningId: string | null;
  selectedCorridorId: string | null;
  setSelectedModuleId: (id: string | null) => void;
  setSelectedOpeningId: (id: string | null) => void;
  setSelectedCorridorId:(id: string | null) => void;
}

export const useSelectionStore = create<SelectionState>(set => ({
  selectedModuleId: null,
  selectedOpeningId: null,
  selectedCorridorId:null,
  setSelectedModuleId: id => set({ selectedModuleId: id, selectedOpeningId: null, selectedCorridorId: null }),
  setSelectedOpeningId: id => set({ selectedOpeningId: id, selectedModuleId: null, selectedCorridorId:null }),
  setSelectedCorridorId:id => set({ selectedCorridorId:id,   selectedModuleId:  null, selectedOpeningId: null }),
}));
