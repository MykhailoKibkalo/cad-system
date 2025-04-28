import { create } from 'zustand';
import { CADStore } from '@/types/cad';
import { v4 as uuidv4 } from 'uuid';

const useCadStore = create<CADStore>((set, get) => ({
  floors: [
    {
      id: uuidv4(),
      name: 'Ground Floor',
      backdrop: null,
      gridResolution: 100, // Default 100mm (10cm) per cell
      showLowerFloor: false,
    },
  ],
  activeFloorIndex: 0,
  snappingEnabled: true,
  pixelsPerMm: 3.78, // ~96 DPI / 25.4 mm/inch = ~3.78 px/mm
  // TODO: Replace with real DPI calculation based on screen properties

  addFloor: (name: string) => {
    set(state => ({
      floors: [
        ...state.floors,
        {
          id: uuidv4(),
          name,
          backdrop: null,
          gridResolution: state.floors[state.activeFloorIndex].gridResolution, // Copy from current floor
          showLowerFloor: true, // Default to showing lower floor for new floors
        },
      ],
    }));
  },

  setActiveFloor: (index: number) => {
    set({ activeFloorIndex: index });
  },

  updateGridResolution: (floorId: string, resolution: number) => {
    set(state => ({
      floors: state.floors.map(floor => (floor.id === floorId ? { ...floor, gridResolution: resolution } : floor)),
    }));
  },

  toggleLowerFloorBackdrop: (floorId: string) => {
    set(state => ({
      floors: state.floors.map(floor =>
        floor.id === floorId ? { ...floor, showLowerFloor: !floor.showLowerFloor } : floor
      ),
    }));
  },

  setBackdrop: (floorId: string, backdrop: any) => {
    set(state => ({
      floors: state.floors.map(floor => (floor.id === floorId ? { ...floor, backdrop } : floor)),
    }));
  },

  toggleSnapping: () => {
    set(state => ({ snappingEnabled: !state.snappingEnabled }));
  },
}));

export default useCadStore;
