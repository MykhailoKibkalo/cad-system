// src/state/floorStore.ts
import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

export interface GridState {
  gridWidthM: number;
  gridHeightM: number;
  modules: any[]; // Module objects for this floor
  corridors: any[]; // Corridor objects for this floor
  openings: any[]; // Opening objects for this floor
  balconies: any[]; // Balcony objects for this floor
  bathroomPods: any[]; // BathroomPod objects for this floor
  pdfCalibrated: boolean;
  pdfOpacity: number;
  pdfWidthGrid: number;
  pdfHeightGrid: number;
  pdfObjects: any[]; // Fabric.js PDF object properties (position, scale, etc.)
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
  
  // Actions
  addFloor: (name: string, height: number, pdfUrl?: string) => void;
  updateFloor: (id: string, updates: Partial<Floor>) => void;
  deleteFloor: (id: string) => void;
  selectFloor: (id: string) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  getSelectedFloor: () => Floor | undefined;
  updateFloorGridState: (id: string, gridState: Partial<GridState>) => void;
  updateFloorElements: (id: string, elements: any[]) => void;
  
  // Grid state getters/setters for active floor
  getActiveGridState: () => GridState | null;
  updateActiveGridState: (updates: Partial<GridState>) => void;
  getActivePdfUrl: () => string | undefined;
  setActivePdfUrl: (url: string | undefined) => void;
  hasActivePdf: () => boolean;
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
  pdfCalibrated: false,
  pdfOpacity: 1,
  pdfWidthGrid: 0,
  pdfHeightGrid: 0,
  pdfObjects: [],
});

export const useFloorStore = create<FloorState>((set, get) => ({
  floors: [createDefaultFloor()],
  selectedFloorId: null,
  isSidebarOpen: false,

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
      
      // If we deleted the selected floor, select the first one
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

  updateFloorGridState: (id, gridState) => {
    set(state => ({
      floors: state.floors.map(floor =>
        floor.id === id
          ? { ...floor, gridState: { ...floor.gridState, ...gridState } }
          : floor
      ),
    }));
  },

  updateFloorElements: (id, elements) => {
    set(state => ({
      floors: state.floors.map(floor =>
        floor.id === id
          ? { ...floor, elementsTableData: elements }
          : floor
      ),
    }));
  },

  // Grid state getters/setters for active floor
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

  getActivePdfUrl: () => {
    const state = get();
    const floor = state.floors.find(f => f.id === state.selectedFloorId);
    return floor ? floor.pdfUrl : undefined;
  },

  setActivePdfUrl: (url) => {
    const state = get();
    if (!state.selectedFloorId) return;
    
    set({
      floors: state.floors.map(floor =>
        floor.id === state.selectedFloorId
          ? { ...floor, pdfUrl: url }
          : floor
      ),
    });
  },

  hasActivePdf: () => {
    const state = get();
    const floor = state.floors.find(f => f.id === state.selectedFloorId);
    return !!(floor && floor.pdfUrl);
  },
}));

// Initialize with first floor selected
const state = useFloorStore.getState();
if (state.floors.length > 0 && !state.selectedFloorId) {
  state.selectFloor(state.floors[0].id);
}