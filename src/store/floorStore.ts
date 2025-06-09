// src/store/floorStore.ts

import { create } from 'zustand';
import { IFloor, IModule } from '../types/floor';
import { deepCloneFloor } from '../utils/deepCloneFloor';

interface FloorStoreState {
  floors: Record<number, IFloor>;

  // Retrieve floor data or undefined
  getFloor: (floorNumber: number) => IFloor | undefined;

  // Overwrite or create a floor
  setFloor: (floorNumber: number, floorData: IFloor) => void;

  // Deep-clone an existing floor into a new floorNumber
  cloneFloor: (sourceFloor: number, targetFloor: number) => void;

  // Update a single module on a specific floor by merging partial properties
  updateModule: (floorNumber: number, moduleId: string, partialUpdate: Partial<IModule>) => void;

  // Update only the pdfUrl property of a specified floor
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
        // If openings/balconies/bathroomPods are included in partialUpdate,
        // they must be replaced entirely or merged in the calling code.
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