// src/state/floorStore.ts
import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { Module, Opening, Corridor, Balcony, BathroomPod, ModuleGroup } from '@/types/geometry';

// PDF data with complete state per floor
export interface PdfData {
  url: string;
  width: number;
  height: number;
  x: number;
  y: number;
  opacity: number;
  isLocked: boolean;
  scaleFactor?: number;
}

// Canvas state per floor  
export interface CanvasState {
  zoomLevel: number;
  panX: number;
  panY: number;
  gridSizeMm: number;
  snapMode: 'off' | 'grid' | 'element';
  elementGapMm: number;
}

export interface GridState {
  gridWidthM: number;
  gridHeightM: number;
  modules: Module[];
  corridors: Corridor[];
  openings: Opening[];
  balconies: Balcony[];
  bathroomPods: BathroomPod[];
  groups: ModuleGroup[];
  
  // PDF state per floor
  pdfData: PdfData | null;
  
  // Canvas state per floor
  canvasState: CanvasState;
}

export interface Floor {
  id: string;
  name: string;
  height: number; // in millimeters
  pdfUrl?: string;
  gridState: GridState;
  elementsTableData: any[];
}

interface FloorState {
  floors: Floor[];
  selectedFloorId: string | null;
  isSidebarOpen: boolean;
  
  // Floor management
  addFloor: (name: string, height: number, pdfUrl?: string) => void;
  updateFloor: (id: string, updates: Partial<Floor>) => void;
  deleteFloor: (id: string) => void;
  selectFloor: (id: string) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  getSelectedFloor: () => Floor | undefined;
  
  // Grid state management
  getActiveGridState: () => GridState | null;
  updateActiveGridState: (updates: Partial<GridState>) => void;
  
  // Object management for active floor
  addModule: (module: Module) => void;
  updateModule: (id: string, updates: Partial<Module>) => void;
  deleteModule: (id: string) => void;
  
  addOpening: (opening: Opening) => void;
  updateOpening: (id: string, updates: Partial<Opening>) => void;
  deleteOpening: (id: string) => void;
  
  addCorridor: (corridor: Corridor) => void;
  updateCorridor: (id: string, updates: Partial<Corridor>) => void;
  deleteCorridor: (id: string) => void;
  
  addBalcony: (balcony: Balcony) => void;
  updateBalcony: (id: string, updates: Partial<Balcony>) => void;
  deleteBalcony: (id: string) => void;
  
  addBathroomPod: (pod: BathroomPod) => void;
  updateBathroomPod: (id: string, updates: Partial<BathroomPod>) => void;
  deleteBathroomPod: (id: string) => void;
  
  // Group management for active floor
  addGroup: (group: ModuleGroup) => void;
  updateGroup: (id: string, updates: Partial<ModuleGroup>) => void;
  deleteGroup: (id: string) => void;
  getGroupContainingModule: (moduleId: string) => ModuleGroup | null;
  
  // PDF management for active floor
  getActivePdfData: () => PdfData | null;
  setActivePdfData: (pdfData: PdfData | null) => void;
  hasActivePdf: () => boolean;
  
  // Canvas state management for active floor
  getActiveCanvasState: () => CanvasState | null;
  updateActiveCanvasState: (updates: Partial<CanvasState>) => void;
}

// Default floor
const createDefaultFloor = (): Floor => ({
  id: uuidv4(),
  name: 'Level 1',
  height: 3100,
  gridState: createGridState(),
  elementsTableData: [],
});

const createGridState = (): GridState => ({
  gridWidthM: 100,
  gridHeightM: 100,
  modules: [],
  corridors: [],
  openings: [],
  balconies: [],
  bathroomPods: [],
  groups: [],
  
  // No PDF imported initially
  pdfData: null,
  
  // Default canvas state
  canvasState: {
    zoomLevel: 1,
    panX: 0,
    panY: 0,
    gridSizeMm: 100,
    snapMode: 'off',
    elementGapMm: 50,
  },
});

export const useFloorStore = create<FloorState>((set, get) => ({
  floors: [createDefaultFloor()],
  selectedFloorId: null,
  isSidebarOpen: false,

  // Floor management
  addFloor: (name, height, pdfUrl) => {
    const newFloor: Floor = {
      id: uuidv4(),
      name,
      height,
      pdfUrl,
      gridState: createGridState(),
      elementsTableData: [],
    };
    
    set(state => ({
      floors: [...state.floors, newFloor],
      selectedFloorId: newFloor.id,
    }));
  },

  updateFloor: (id, updates) => {
    set(state => ({
      floors: state.floors.map(floor =>
        floor.id === id ? { ...floor, ...updates } : floor
      ),
    }));
  },

  deleteFloor: (id) => {
    set(state => {
      const newFloors = state.floors.filter(floor => floor.id !== id);
      let newSelectedId = state.selectedFloorId;
      
      if (state.selectedFloorId === id) {
        newSelectedId = newFloors.length > 0 ? newFloors[0].id : null;
      }
      
      return {
        floors: newFloors,
        selectedFloorId: newSelectedId,
      };
    });
  },

  selectFloor: (id) => {
    set({ selectedFloorId: id });
  },

  toggleSidebar: () => {
    set(state => ({ isSidebarOpen: !state.isSidebarOpen }));
  },

  setSidebarOpen: (open) => {
    set({ isSidebarOpen: open });
  },

  getSelectedFloor: () => {
    const state = get();
    return state.floors.find(floor => floor.id === state.selectedFloorId);
  },

  // Grid state management
  getActiveGridState: () => {
    const state = get();
    const floor = state.floors.find(f => f.id === state.selectedFloorId);
    return floor ? floor.gridState : null;
  },

  updateActiveGridState: (updates) => {
    const state = get();
    if (!state.selectedFloorId) return;
    
    set({
      floors: state.floors.map(floor =>
        floor.id === state.selectedFloorId
          ? { ...floor, gridState: { ...floor.gridState, ...updates } }
          : floor
      ),
    });
  },

  // Object management for active floor
  addModule: (module) => {
    const state = get();
    if (!state.selectedFloorId) return;
    
    set({
      floors: state.floors.map(floor =>
        floor.id === state.selectedFloorId
          ? { 
              ...floor, 
              gridState: { 
                ...floor.gridState, 
                modules: [...floor.gridState.modules, module] 
              } 
            }
          : floor
      ),
    });
  },

  updateModule: (id, updates) => {
    const state = get();
    if (!state.selectedFloorId) return;
    
    set({
      floors: state.floors.map(floor =>
        floor.id === state.selectedFloorId
          ? { 
              ...floor, 
              gridState: { 
                ...floor.gridState, 
                modules: floor.gridState.modules.map(m => 
                  m.id === id ? { ...m, ...updates } : m
                )
              } 
            }
          : floor
      ),
    });
  },

  deleteModule: (id) => {
    const state = get();
    if (!state.selectedFloorId) return;
    
    set({
      floors: state.floors.map(floor =>
        floor.id === state.selectedFloorId
          ? { 
              ...floor, 
              gridState: { 
                ...floor.gridState, 
                modules: floor.gridState.modules.filter(m => m.id !== id),
                openings: floor.gridState.openings.filter(o => o.moduleId !== id),
                balconies: floor.gridState.balconies.filter(b => b.moduleId !== id),
                bathroomPods: floor.gridState.bathroomPods.filter(bp => bp.moduleId !== id),
              } 
            }
          : floor
      ),
    });
  },

  addOpening: (opening) => {
    const state = get();
    if (!state.selectedFloorId) return;
    
    set({
      floors: state.floors.map(floor =>
        floor.id === state.selectedFloorId
          ? { 
              ...floor, 
              gridState: { 
                ...floor.gridState, 
                openings: [...floor.gridState.openings, opening] 
              } 
            }
          : floor
      ),
    });
  },

  updateOpening: (id, updates) => {
    const state = get();
    if (!state.selectedFloorId) return;
    
    set({
      floors: state.floors.map(floor =>
        floor.id === state.selectedFloorId
          ? { 
              ...floor, 
              gridState: { 
                ...floor.gridState, 
                openings: floor.gridState.openings.map(o => 
                  o.id === id ? { ...o, ...updates } : o
                )
              } 
            }
          : floor
      ),
    });
  },

  deleteOpening: (id) => {
    const state = get();
    if (!state.selectedFloorId) return;
    
    set({
      floors: state.floors.map(floor =>
        floor.id === state.selectedFloorId
          ? { 
              ...floor, 
              gridState: { 
                ...floor.gridState, 
                openings: floor.gridState.openings.filter(o => o.id !== id)
              } 
            }
          : floor
      ),
    });
  },

  addCorridor: (corridor) => {
    const state = get();
    if (!state.selectedFloorId) return;
    
    set({
      floors: state.floors.map(floor =>
        floor.id === state.selectedFloorId
          ? { 
              ...floor, 
              gridState: { 
                ...floor.gridState, 
                corridors: [...floor.gridState.corridors, corridor] 
              } 
            }
          : floor
      ),
    });
  },

  updateCorridor: (id, updates) => {
    const state = get();
    if (!state.selectedFloorId) return;
    
    set({
      floors: state.floors.map(floor =>
        floor.id === state.selectedFloorId
          ? { 
              ...floor, 
              gridState: { 
                ...floor.gridState, 
                corridors: floor.gridState.corridors.map(c => 
                  c.id === id ? { ...c, ...updates } : c
                )
              } 
            }
          : floor
      ),
    });
  },

  deleteCorridor: (id) => {
    const state = get();
    if (!state.selectedFloorId) return;
    
    set({
      floors: state.floors.map(floor =>
        floor.id === state.selectedFloorId
          ? { 
              ...floor, 
              gridState: { 
                ...floor.gridState, 
                corridors: floor.gridState.corridors.filter(c => c.id !== id)
              } 
            }
          : floor
      ),
    });
  },

  addBalcony: (balcony) => {
    const state = get();
    if (!state.selectedFloorId) return;
    
    set({
      floors: state.floors.map(floor =>
        floor.id === state.selectedFloorId
          ? { 
              ...floor, 
              gridState: { 
                ...floor.gridState, 
                balconies: [...floor.gridState.balconies, balcony] 
              } 
            }
          : floor
      ),
    });
  },

  updateBalcony: (id, updates) => {
    const state = get();
    if (!state.selectedFloorId) return;
    
    set({
      floors: state.floors.map(floor =>
        floor.id === state.selectedFloorId
          ? { 
              ...floor, 
              gridState: { 
                ...floor.gridState, 
                balconies: floor.gridState.balconies.map(b => 
                  b.id === id ? { ...b, ...updates } : b
                )
              } 
            }
          : floor
      ),
    });
  },

  deleteBalcony: (id) => {
    const state = get();
    if (!state.selectedFloorId) return;
    
    set({
      floors: state.floors.map(floor =>
        floor.id === state.selectedFloorId
          ? { 
              ...floor, 
              gridState: { 
                ...floor.gridState, 
                balconies: floor.gridState.balconies.filter(b => b.id !== id)
              } 
            }
          : floor
      ),
    });
  },

  addBathroomPod: (pod) => {
    const state = get();
    if (!state.selectedFloorId) return;
    
    set({
      floors: state.floors.map(floor =>
        floor.id === state.selectedFloorId
          ? { 
              ...floor, 
              gridState: { 
                ...floor.gridState, 
                bathroomPods: [...floor.gridState.bathroomPods, pod] 
              } 
            }
          : floor
      ),
    });
  },

  updateBathroomPod: (id, updates) => {
    const state = get();
    if (!state.selectedFloorId) return;
    
    set({
      floors: state.floors.map(floor =>
        floor.id === state.selectedFloorId
          ? { 
              ...floor, 
              gridState: { 
                ...floor.gridState, 
                bathroomPods: floor.gridState.bathroomPods.map(bp => 
                  bp.id === id ? { ...bp, ...updates } : bp
                )
              } 
            }
          : floor
      ),
    });
  },

  deleteBathroomPod: (id) => {
    const state = get();
    if (!state.selectedFloorId) return;
    
    set({
      floors: state.floors.map(floor =>
        floor.id === state.selectedFloorId
          ? { 
              ...floor, 
              gridState: { 
                ...floor.gridState, 
                bathroomPods: floor.gridState.bathroomPods.filter(bp => bp.id !== id)
              } 
            }
          : floor
      ),
    });
  },

  // Group management for active floor
  addGroup: (group) => {
    const state = get();
    if (!state.selectedFloorId) return;
    
    set({
      floors: state.floors.map(floor =>
        floor.id === state.selectedFloorId
          ? { 
              ...floor, 
              gridState: { 
                ...floor.gridState, 
                groups: [...floor.gridState.groups, group] 
              } 
            }
          : floor
      ),
    });
  },

  updateGroup: (id, updates) => {
    const state = get();
    if (!state.selectedFloorId) return;
    
    set({
      floors: state.floors.map(floor =>
        floor.id === state.selectedFloorId
          ? { 
              ...floor, 
              gridState: { 
                ...floor.gridState, 
                groups: floor.gridState.groups.map(g => 
                  g.id === id ? { ...g, ...updates } : g
                )
              } 
            }
          : floor
      ),
    });
  },

  deleteGroup: (id) => {
    const state = get();
    if (!state.selectedFloorId) return;
    
    set({
      floors: state.floors.map(floor =>
        floor.id === state.selectedFloorId
          ? { 
              ...floor, 
              gridState: { 
                ...floor.gridState, 
                groups: floor.gridState.groups.filter(g => g.id !== id)
              } 
            }
          : floor
      ),
    });
  },

  getGroupContainingModule: (moduleId) => {
    const state = get();
    const floor = state.floors.find(f => f.id === state.selectedFloorId);
    if (!floor) return null;
    
    return floor.gridState.groups.find(group => 
      group.elements?.modules?.includes(moduleId)
    ) || null;
  },

  // PDF management for active floor
  getActivePdfData: () => {
    const state = get();
    const floor = state.floors.find(f => f.id === state.selectedFloorId);
    return floor ? floor.gridState.pdfData : null;
  },

  setActivePdfData: (pdfData) => {
    const state = get();
    if (!state.selectedFloorId) return;
    
    set({
      floors: state.floors.map(floor =>
        floor.id === state.selectedFloorId
          ? { 
              ...floor, 
              gridState: { 
                ...floor.gridState, 
                pdfData: pdfData 
              } 
            }
          : floor
      ),
    });
  },

  hasActivePdf: () => {
    const state = get();
    const floor = state.floors.find(f => f.id === state.selectedFloorId);
    return !!(floor && floor.gridState.pdfData);
  },

  // Canvas state management for active floor
  getActiveCanvasState: () => {
    const state = get();
    const floor = state.floors.find(f => f.id === state.selectedFloorId);
    return floor ? floor.gridState.canvasState : null;
  },

  updateActiveCanvasState: (updates) => {
    const state = get();
    if (!state.selectedFloorId) return;
    
    set({
      floors: state.floors.map(floor =>
        floor.id === state.selectedFloorId
          ? { 
              ...floor, 
              gridState: { 
                ...floor.gridState, 
                canvasState: { ...floor.gridState.canvasState, ...updates } 
              } 
            }
          : floor
      ),
    });
  },
}));

// Initialize with first floor selected
const state = useFloorStore.getState();
if (state.floors.length > 0 && !state.selectedFloorId) {
  state.selectFloor(state.floors[0].id);
}