// src/state/objectStore.ts
// Compatibility layer - delegates all operations to floorStore
import { create } from 'zustand';
import { Balcony, BathroomPod, Corridor, Module, Opening, ModuleGroup } from '@/types/geometry';
import { useFloorStore } from './floorStore';

interface ObjState {
  // Getters that delegate to active floor
  modules: Module[];
  openings: Opening[];
  corridors: Corridor[];
  balconies: Balcony[];
  bathroomPods: BathroomPod[];
  groups: ModuleGroup[];
  roofs: [];
  
  // Object management methods that delegate to floorStore
  addModule: (m: Module) => void;
  updateModule: (id: string, updates: Partial<Module>) => void;
  deleteModule: (id: string) => void;
  
  addOpening: (o: Opening) => void;
  updateOpening: (id: string, props: Partial<Opening>) => void;
  deleteOpening: (id: string) => void;
  
  addCorridor: (c: Corridor) => void;
  updateCorridor: (id: string, props: Partial<Corridor>) => void;
  deleteCorridor: (id: string) => void;
  
  addBalcony: (b: Balcony) => void;
  updateBalcony: (id: string, props: Partial<Balcony>) => void;
  deleteBalcony: (id: string) => void;
  
  addBathroomPod: (bp: BathroomPod) => void;
  updateBathroomPod: (id: string, props: Partial<BathroomPod>) => void;
  deleteBathroomPod: (id: string) => void;
  
  addGroup: (g: ModuleGroup) => void;
  updateGroup: (id: string, props: Partial<ModuleGroup>) => void;
  deleteGroup: (id: string) => void;
  getGroupContainingModule: (moduleId: string) => ModuleGroup | null;
}

export const useObjectStore = create<ObjState>((set, get) => ({
  // Getters that delegate to active floor in floorStore
  get modules() {
    const gridState = useFloorStore.getState().getActiveGridState();
    return gridState?.modules || [];
  },
  
  get openings() {
    const gridState = useFloorStore.getState().getActiveGridState();
    return gridState?.openings || [];
  },
  
  get corridors() {
    const gridState = useFloorStore.getState().getActiveGridState();
    return gridState?.corridors || [];
  },
  
  get balconies() {
    const gridState = useFloorStore.getState().getActiveGridState();
    return gridState?.balconies || [];
  },
  
  get bathroomPods() {
    const gridState = useFloorStore.getState().getActiveGridState();
    return gridState?.bathroomPods || [];
  },
  
  get groups() {
    try {
      const floorState = useFloorStore.getState();
      const selectedFloorId = floorState.selectedFloorId;
      const gridState = floorState.getActiveGridState();
      
      console.log('🔍 ObjectStore.groups getter called:', {
        selectedFloorId,
        gridStateExists: !!gridState,
        groupsCount: gridState?.groups?.length || 0,
        groups: gridState?.groups || []
      });
      
      return gridState?.groups || [];
    } catch (error) {
      console.error('🔍 ObjectStore.groups getter error:', error);
      return [];
    }
  },
  
  roofs: [],
  
  // Module methods - delegate to floorStore
  addModule: (module) => {
    useFloorStore.getState().addModule(module);
    // Trigger re-render of components using objectStore
    set({});
  },
  
  updateModule: (id, updates) => {
    useFloorStore.getState().updateModule(id, updates);
    set({});
  },
  
  deleteModule: (id) => {
    useFloorStore.getState().deleteModule(id);
    set({});
  },
  
  // Opening methods - delegate to floorStore
  addOpening: (opening) => {
    useFloorStore.getState().addOpening(opening);
    set({});
  },
  
  updateOpening: (id, updates) => {
    useFloorStore.getState().updateOpening(id, updates);
    set({});
  },
  
  deleteOpening: (id) => {
    useFloorStore.getState().deleteOpening(id);
    set({});
  },
  
  // Corridor methods - delegate to floorStore
  addCorridor: (corridor) => {
    useFloorStore.getState().addCorridor(corridor);
    set({});
  },
  
  updateCorridor: (id, updates) => {
    useFloorStore.getState().updateCorridor(id, updates);
    set({});
  },
  
  deleteCorridor: (id) => {
    useFloorStore.getState().deleteCorridor(id);
    set({});
  },
  
  // Balcony methods - delegate to floorStore
  addBalcony: (balcony) => {
    useFloorStore.getState().addBalcony(balcony);
    set({});
  },
  
  updateBalcony: (id, updates) => {
    useFloorStore.getState().updateBalcony(id, updates);
    set({});
  },
  
  deleteBalcony: (id) => {
    useFloorStore.getState().deleteBalcony(id);
    set({});
  },
  
  // Bathroom Pod methods - delegate to floorStore
  addBathroomPod: (pod) => {
    useFloorStore.getState().addBathroomPod(pod);
    set({});
  },
  
  updateBathroomPod: (id, updates) => {
    useFloorStore.getState().updateBathroomPod(id, updates);
    set({});
  },
  
  deleteBathroomPod: (id) => {
    useFloorStore.getState().deleteBathroomPod(id);
    set({});
  },
  
  // Group methods - delegate to floorStore
  addGroup: (group) => {
    useFloorStore.getState().addGroup(group);
    set({});
  },
  
  updateGroup: (id, updates) => {
    useFloorStore.getState().updateGroup(id, updates);
    set({});
  },
  
  deleteGroup: (id) => {
    useFloorStore.getState().deleteGroup(id);
    set({});
  },
  
  getGroupContainingModule: (moduleId) => {
    try {
      return useFloorStore.getState().getGroupContainingModule(moduleId);
    } catch (error) {
      return null;
    }
  },
}));
