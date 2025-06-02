// src/store/floorStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { Floor, GridSettings, PDFData } from '@/types/floor';

interface FloorState {
  floors: Floor[];
  currentFloorId: string | null;

  // Actions
  addFloor: (name: string, height: number) => string;
  editFloor: (id: string, updates: Partial<{ name: string; height: number }>) => void;
  copyFloor: (id: string) => string;
  deleteFloor: (id: string) => void;
  setCurrentFloor: (id: string) => void;
  setFloorPDF: (id: string, pdfData: PDFData) => void;
  removeFloorPDF: (id: string) => void;
  updateFloorGridSettings: (id: string, updates: Partial<GridSettings>) => void;
  setFloorPDFLocked: (id: string, locked: boolean) => void;

  // Getters
  getCurrentFloor: () => Floor | null;
  getFloorById: (id: string) => Floor | null;
}

const defaultGridSettings: GridSettings = {
  gridSize: 100,
  showGrid: true,
  snapMode: 'off',
  elementGap: 50,
};

export const useFloorStore = create<FloorState>()(
  persist(
    (set, get) => ({
      floors: [],
      currentFloorId: null,

      addFloor: (name: string, height: number) => {
        const id = uuidv4();
        const newFloor: Floor = {
          id,
          name,
          height: Math.round(height),
          gridSettings: { ...defaultGridSettings },
          pdfLocked: false,
        };

        set(state => ({
          floors: [...state.floors, newFloor],
          currentFloorId: state.currentFloorId || id, // Set as current if it's the first floor
        }));

        return id;
      },

      editFloor: (id: string, updates) => {
        set(state => ({
          floors: state.floors.map(floor =>
            floor.id === id
              ? {
                  ...floor,
                  name: updates.name !== undefined ? updates.name : floor.name,
                  height: updates.height !== undefined ? Math.round(updates.height) : floor.height,
                }
              : floor
          ),
        }));
      },

      copyFloor: (id: string) => {
        const originalFloor = get().getFloorById(id);
        if (!originalFloor) return '';

        const newId = uuidv4();
        const copiedFloor: Floor = {
          ...originalFloor,
          id: newId,
          name: `${originalFloor.name} Copy`,
          // Copy PDF reference but don't duplicate the actual file
          pdf: originalFloor.pdf ? { ...originalFloor.pdf } : undefined,
          gridSettings: { ...originalFloor.gridSettings },
        };

        set(state => ({
          floors: [...state.floors, copiedFloor],
        }));

        return newId;
      },

      deleteFloor: (id: string) => {
        set(state => {
          const remainingFloors = state.floors.filter(floor => floor.id !== id);
          let newCurrentFloorId = state.currentFloorId;

          // If we're deleting the current floor, switch to another one
          if (state.currentFloorId === id) {
            newCurrentFloorId = remainingFloors.length > 0 ? remainingFloors[0].id : null;
          }

          return {
            floors: remainingFloors,
            currentFloorId: newCurrentFloorId,
          };
        });
      },

      setCurrentFloor: (id: string) => {
        const floor = get().getFloorById(id);
        if (floor) {
          set({ currentFloorId: id });
        }
      },

      setFloorPDF: (id: string, pdfData: PDFData) => {
        set(state => ({
          floors: state.floors.map(floor =>
            floor.id === id
              ? {
                  ...floor,
                  pdf: {
                    ...pdfData,
                    widthGrid: Math.round(pdfData.widthGrid),
                    heightGrid: Math.round(pdfData.heightGrid),
                    opacity: Math.max(0, Math.min(1, pdfData.opacity)),
                  },
                }
              : floor
          ),
        }));
      },

      removeFloorPDF: (id: string) => {
        set(state => ({
          floors: state.floors.map(floor =>
            floor.id === id
              ? {
                  ...floor,
                  pdf: undefined,
                }
              : floor
          ),
        }));
      },

      updateFloorGridSettings: (id: string, updates: Partial<GridSettings>) => {
        set(state => ({
          floors: state.floors.map(floor =>
            floor.id === id
              ? {
                  ...floor,
                  gridSettings: {
                    ...floor.gridSettings,
                    ...updates,
                    gridSize:
                      updates.gridSize !== undefined ? Math.round(updates.gridSize) : floor.gridSettings.gridSize,
                    elementGap:
                      updates.elementGap !== undefined ? Math.round(updates.elementGap) : floor.gridSettings.elementGap,
                  },
                }
              : floor
          ),
        }));
      },

      setFloorPDFLocked: (id: string, locked: boolean) => {
        set(state => ({
          floors: state.floors.map(floor =>
            floor.id === id
              ? {
                  ...floor,
                  pdfLocked: locked,
                }
              : floor
          ),
        }));
      },

      // Getters
      getCurrentFloor: () => {
        const state = get();
        return state.currentFloorId ? state.floors.find(f => f.id === state.currentFloorId) || null : null;
      },

      getFloorById: (id: string) => {
        return get().floors.find(f => f.id === id) || null;
      },
    }),
    {
      name: 'floor-store',
      version: 1,
    }
  )
);
