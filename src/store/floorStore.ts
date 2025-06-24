import { create } from 'zustand';
import { IFloor, IModule } from '../types/floor';
import { deepCloneFloor } from '../utils/deepCloneFloor';

interface FloorStoreState {
  floors: Record<number, IFloor>;
  getFloor: (floorNumber: number) => IFloor | undefined;
  setFloor: (floorNumber: number, floorData: IFloor) => void;
  cloneFloor: (sourceFloor: number, targetFloor: number) => void;
  updateModule: (floorNumber: number, moduleId: string, partialUpdate: Partial<IModule>) => void;
  updatePDF: (floorNumber: number, newPdfUrl: string) => void;
}

export const useFloorStore = create<FloorStoreState>((set, get) => ({
  floors: {},

  getFloor: (floorNumber) => {
    return get().floors[floorNumber];
  },

  setFloor: (floorNumber, floorData) => {
    set(state => ({
      floors: {
        ...state.floors,
        [floorNumber]: floorData,
      },
    }));
  },

  cloneFloor: (sourceFloor, targetFloor) => {
    const source = get().floors[sourceFloor];
    if (!source) {
      console.warn(`cloneFloor: source floor ${sourceFloor} not found`);
      return;
    }
    const clone = deepCloneFloor(source);
    clone.floorNumber = targetFloor;
    set(state => ({
      floors: {
        ...state.floors,
        [targetFloor]: clone,
      },
    }));
  },

  updateModule: (floorNumber, moduleId, partialUpdate) => {
    const floors = get().floors;
    const floor = floors[floorNumber];
    if (!floor) {
      console.warn(`updateModule: floor ${floorNumber} not found`);
      return;
    }
    const updatedModules = floor.modules.map(mod => {
      if (mod.moduleId !== moduleId) return mod;
      return {
        ...mod,
        ...partialUpdate,
      };
    });
    set(state => ({
      floors: {
        ...state.floors,
        [floorNumber]: {
          ...floor,
          modules: updatedModules,
        },
      },
    }));
  },

  updatePDF: (floorNumber, newPdfUrl) => {
    const floors = get().floors;
    const floor = floors[floorNumber];
    if (!floor) {
      console.warn(`updatePDF: floor ${floorNumber} not found`);
      return;
    }
    set(state => ({
      floors: {
        ...state.floors,
        [floorNumber]: {
          ...floor,
          pdfUrl: newPdfUrl,
        },
      },
    }));
  },
}));
