// src/state/selectionStore.ts
import { create } from 'zustand';

interface SelectionState {
  selectedModuleId: string | null;
  selectedOpeningId: string | null;
  selectedCorridorId: string | null;
  setSelectedModuleId: (id: string | null) => void;
  setSelectedOpeningId: (id: string | null) => void;
  setSelectedCorridorId: (id: string | null) => void;
  selectedBathroomPodId: string | null;
  setSelectedBathroomPodId: (id: string | null) => void;
  selectedBalconyId: string | null;
  setSelectedBalconyId(id: string | null): void;
  
  // For grouping functionality
  selectedObjectIds: string[];
  selectedElementTypes: Record<string, 'module' | 'corridor' | 'balcony' | 'bathroomPod'>;
  setSelectedObjectIds: (ids: string[]) => void;
  setSelectedElements: (elements: Array<{id: string, type: 'module' | 'corridor' | 'balcony' | 'bathroomPod'}>) => void;
  clearSelection: () => void;
}

export const useSelectionStore = create<SelectionState>(set => ({
  selectedModuleId: null,
  selectedOpeningId: null,
  selectedCorridorId: null,
  selectedBathroomPodId: null,
  selectedBalconyId: null,
  selectedObjectIds: [],
  selectedElementTypes: {},
  setSelectedModuleId: id =>
    set({
      selectedModuleId: id,
      selectedOpeningId: null,
      selectedCorridorId: null,
      selectedBathroomPodId: null,
      selectedBalconyId: null,
    }),
  setSelectedOpeningId: id =>
    set({
      selectedOpeningId: id,
      selectedModuleId: null,
      selectedCorridorId: null,
      selectedBathroomPodId: null,
      selectedBalconyId: null,
    }),
  setSelectedCorridorId: id =>
    set({
      selectedCorridorId: id,
      selectedModuleId: null,
      selectedOpeningId: null,
      selectedBathroomPodId: null,
      selectedBalconyId: null,
    }),
  setSelectedBathroomPodId: id =>
    set({
      selectedBathroomPodId: id,
      selectedModuleId: null,
      selectedOpeningId: null,
      selectedCorridorId: null,
      selectedBalconyId: null,
    }),
  setSelectedBalconyId: id =>
    set({
      selectedBalconyId: id,
      selectedBathroomPodId: null,
      selectedModuleId: null,
      selectedOpeningId: null,
      selectedCorridorId: null,
    }),
    
  // For grouping functionality
  setSelectedObjectIds: (ids) => set({ selectedObjectIds: ids }),
  setSelectedElements: (elements) => {
    const ids = elements.map(e => e.id);
    const types = elements.reduce((acc, e) => {
      acc[e.id] = e.type;
      return acc;
    }, {} as Record<string, 'module' | 'corridor' | 'balcony' | 'bathroomPod'>);
    set({ selectedObjectIds: ids, selectedElementTypes: types });
  },
  clearSelection: () => set({ 
    selectedObjectIds: [],
    selectedElementTypes: {},
    selectedModuleId: null,
    selectedOpeningId: null,
    selectedCorridorId: null,
    selectedBathroomPodId: null,
    selectedBalconyId: null,
  }),
}));
