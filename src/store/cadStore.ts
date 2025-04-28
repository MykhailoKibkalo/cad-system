import { create } from 'zustand';
import { CADStore } from '@/types/cad';
import { v4 as uuidv4 } from 'uuid';
import { fabric } from 'fabric';

const useCadStore = create<CADStore>((set, get) => ({
  floors: [
    {
      id: uuidv4(),
      name: 'Ground Floor',
      backdrop: null,
      gridResolution: 100, // Default 100mm (10cm) per cell
      showLowerFloor: false,
      modules: [],
      moduleCounter: 1,
    },
  ],
  activeFloorIndex: 0,
  snappingEnabled: true,
  snapToElementGap: 50, // Default 50mm gap
  pixelsPerMm: 3.78, // ~96 DPI / 25.4 mm/inch = ~3.78 px/mm
  backdropLocked: true,
  backdropOpacity: 100,
  selectedModuleId: null,
  drawMode: false,
  moduleNamePrefix: 'M',

  addFloor: (name: string) => {
    set((state) => ({
      floors: [
        ...state.floors,
        {
          id: uuidv4(),
          name,
          backdrop: null,
          gridResolution: state.floors[state.activeFloorIndex].gridResolution,
          showLowerFloor: true,
          modules: [],
          moduleCounter: 1,
        },
      ],
    }));
  },

  setActiveFloor: (index: number) => {
    set({ activeFloorIndex: index });
  },

  updateGridResolution: (floorId: string, resolution: number) => {
    set((state) => ({
      floors: state.floors.map((floor) =>
          floor.id === floorId ? { ...floor, gridResolution: resolution } : floor
      ),
    }));
  },

  toggleLowerFloorBackdrop: (floorId: string) => {
    set((state) => ({
      floors: state.floors.map((floor) =>
          floor.id === floorId ? { ...floor, showLowerFloor: !floor.showLowerFloor } : floor
      ),
    }));
  },

  setBackdrop: (floorId: string, backdrop: fabric.Image | null) => {
    console.log('Setting backdrop for floor:', floorId, backdrop);
    set((state) => ({
      floors: state.floors.map((floor) =>
          floor.id === floorId ? { ...floor, backdrop } : floor
      ),
    }));
  },

  toggleSnapping: () => {
    set((state) => ({ snappingEnabled: !state.snappingEnabled }));
  },

  setBackdropLocked: (locked: boolean) => {
    set({ backdropLocked: locked });
  },

  setBackdropOpacity: (opacity: number) => {
    set({ backdropOpacity: opacity });
  },

  setSnapToElementGap: (gap: number) => {
    set({ snapToElementGap: gap });
  },

  // Module actions
  addModule: (floorId: string, module) => {
    const moduleId = uuidv4();

    set((state) => {
      const floorIndex = state.floors.findIndex(f => f.id === floorId);
      if (floorIndex === -1) return state;

      const floor = state.floors[floorIndex];
      const moduleCounter = floor.moduleCounter;

      const updatedFloors = [...state.floors];
      updatedFloors[floorIndex] = {
        ...floor,
        modules: [
          ...floor.modules,
          {
            ...module,
            id: moduleId,
            name: `${state.moduleNamePrefix}${moduleCounter}`,
          }
        ],
        moduleCounter: moduleCounter + 1,
      };

      return {
        floors: updatedFloors,
        selectedModuleId: moduleId, // Auto-select newly created module
      };
    });

    return moduleId;
  },

  updateModule: (floorId: string, moduleId: string, updates) => {
    set((state) => {
      const floorIndex = state.floors.findIndex(f => f.id === floorId);
      if (floorIndex === -1) return state;

      const floor = state.floors[floorIndex];
      const moduleIndex = floor.modules.findIndex(m => m.id === moduleId);
      if (moduleIndex === -1) return state;

      const updatedModules = [...floor.modules];
      updatedModules[moduleIndex] = {
        ...updatedModules[moduleIndex],
        ...updates,
      };

      const updatedFloors = [...state.floors];
      updatedFloors[floorIndex] = {
        ...floor,
        modules: updatedModules,
      };

      return { floors: updatedFloors };
    });
  },

  removeModule: (floorId: string, moduleId: string) => {
    set((state) => {
      const floorIndex = state.floors.findIndex(f => f.id === floorId);
      if (floorIndex === -1) return state;

      const floor = state.floors[floorIndex];

      const updatedFloors = [...state.floors];
      updatedFloors[floorIndex] = {
        ...floor,
        modules: floor.modules.filter(m => m.id !== moduleId),
      };

      return {
        floors: updatedFloors,
        selectedModuleId: state.selectedModuleId === moduleId ? null : state.selectedModuleId,
      };
    });
  },

  setSelectedModuleId: (moduleId) => {
    set({ selectedModuleId: moduleId });
  },

  setDrawMode: (enabled) => {
    set({
      drawMode: enabled,
      selectedModuleId: enabled ? null : get().selectedModuleId, // Deselect when entering draw mode
    });
  },

  setModuleNamePrefix: (prefix) => {
    set({ moduleNamePrefix: prefix });
  }
}));

export default useCadStore;
