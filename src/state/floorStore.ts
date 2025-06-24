import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { Module, Opening, Corridor, Balcony, BathroomPod, ModuleGroup } from '@/types/geometry';

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
  pdfData: PdfData | null;
  canvasState: CanvasState;
}

export interface Floor {
  id: string;
  name: string;
  height: number;
  pdfUrl?: string;
  gridState: GridState;
  elementsTableData: any[];
  groupId?: string;
  isGroupMaster?: boolean;
  groupCount?: number;
}

interface FloorState {
  floors: Floor[];
  selectedFloorId: string | null;
  isSidebarOpen: boolean;
  addFloor: (name: string, height: number, pdfUrl?: string) => void;
  updateFloor: (id: string, updates: Partial<Floor>) => void;
  deleteFloor: (id: string) => void;
  cloneFloor: (sourceFloorId: string, newName: string) => string | null;
  copyFloorMultiple: (sourceFloorId: string, newName: string, count: number) => string[] | null;
  selectFloor: (id: string) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  getSelectedFloor: () => Floor | undefined;
  getActiveGridState: () => GridState | null;
  updateActiveGridState: (updates: Partial<GridState>) => void;

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

  addGroup: (group: ModuleGroup) => void;
  updateGroup: (id: string, updates: Partial<ModuleGroup>) => void;
  deleteGroup: (id: string) => void;
  getGroupContainingModule: (moduleId: string) => ModuleGroup | null;

  getActivePdfData: () => PdfData | null;
  setActivePdfData: (pdfData: PdfData | null) => void;
  hasActivePdf: () => boolean;

  getActiveCanvasState: () => CanvasState | null;
  updateActiveCanvasState: (updates: Partial<CanvasState>) => void;
}

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
  pdfData: null,
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

  cloneFloor: (sourceFloorId, newName) => {
    const state = get();
    const sourceFloor = state.floors.find(f => f.id === sourceFloorId);

    if (!sourceFloor) {
      console.error('Source floor not found for cloning');
      return null;
    }

    const moduleIdMap = new Map<string, string>();
    const clonedModules = sourceFloor.gridState.modules.map(module => {
      const newId = uuidv4();
      moduleIdMap.set(module.id, newId);
      return {
        ...module,
        id: newId
      };
    });

    const clonedFloor: Floor = {
      id: uuidv4(),
      name: newName,
      height: sourceFloor.height,
      pdfUrl: sourceFloor.pdfUrl,
      gridState: {
        gridWidthM: sourceFloor.gridState.gridWidthM,
        gridHeightM: sourceFloor.gridState.gridHeightM,
        modules: clonedModules,
        corridors: sourceFloor.gridState.corridors.map(corridor => ({
          ...corridor,
          id: uuidv4()
        })),
        openings: sourceFloor.gridState.openings.map(opening => ({
          ...opening,
          id: uuidv4(),
          moduleId: moduleIdMap.get(opening.moduleId) || opening.moduleId
        })),
        balconies: sourceFloor.gridState.balconies.map(balcony => ({
          ...balcony,
          id: uuidv4(),
          moduleId: moduleIdMap.get(balcony.moduleId) || balcony.moduleId
        })),
        bathroomPods: sourceFloor.gridState.bathroomPods.map(pod => ({
          ...pod,
          id: uuidv4(),
          moduleId: moduleIdMap.get(pod.moduleId) || pod.moduleId
        })),
        groups: sourceFloor.gridState.groups.map(group => ({
          ...group,
          id: uuidv4(),
          elements: {
            modules: group.elements.modules.map(moduleId => moduleIdMap.get(moduleId) || moduleId),
            corridors: group.elements.corridors,
            balconies: group.elements.balconies,
            bathroomPods: group.elements.bathroomPods
          }
        })),

        pdfData: sourceFloor.gridState.pdfData ? {
          ...sourceFloor.gridState.pdfData
        } : null,

        canvasState: {
          ...sourceFloor.gridState.canvasState
        }
      },
      elementsTableData: [...sourceFloor.elementsTableData]
    };

    set(state => ({
      floors: [...state.floors, clonedFloor],
      selectedFloorId: clonedFloor.id
    }));

    return clonedFloor.id;
  },

  copyFloorMultiple: (sourceFloorId, newName, count) => {
    const state = get();
    const sourceFloor = state.floors.find(f => f.id === sourceFloorId);

    if (!sourceFloor) {
      console.error('Source floor not found for copying');
      return null;
    }

    if (count < 1 || count > 20) {
      console.error('Invalid copy count. Must be between 1 and 20');
      return null;
    }

    const groupId = uuidv4();
    const newFloorIds: string[] = [];
    const clonedFloors: Floor[] = [];

    for (let i = 0; i < count; i++) {
      const moduleIdMap = new Map<string, string>();
      const clonedModules = sourceFloor.gridState.modules.map(module => {
        const newId = uuidv4();
        moduleIdMap.set(module.id, newId);
        return {
          ...module,
          id: newId
        };
      });

      const clonedFloor: Floor = {
        id: uuidv4(),
        name: count > 1 ? `${newName} ${i + 1}` : newName,
        height: sourceFloor.height,
        pdfUrl: sourceFloor.pdfUrl,
        groupId: count > 1 ? groupId : undefined,
        isGroupMaster: i === 0 && count > 1,
        groupCount: count > 1 ? count : undefined,
        gridState: {
          gridWidthM: sourceFloor.gridState.gridWidthM,
          gridHeightM: sourceFloor.gridState.gridHeightM,

          modules: clonedModules,

          corridors: sourceFloor.gridState.corridors.map(corridor => ({
            ...corridor,
            id: uuidv4()
          })),

          openings: sourceFloor.gridState.openings.map(opening => ({
            ...opening,
            id: uuidv4(),
            moduleId: moduleIdMap.get(opening.moduleId) || opening.moduleId
          })),

          balconies: sourceFloor.gridState.balconies.map(balcony => ({
            ...balcony,
            id: uuidv4(),
            moduleId: moduleIdMap.get(balcony.moduleId) || balcony.moduleId
          })),

          bathroomPods: sourceFloor.gridState.bathroomPods.map(pod => ({
            ...pod,
            id: uuidv4(),
            moduleId: moduleIdMap.get(pod.moduleId) || pod.moduleId
          })),

          groups: sourceFloor.gridState.groups.map(group => ({
            ...group,
            id: uuidv4(),
            elements: {
              modules: group.elements.modules.map(moduleId => moduleIdMap.get(moduleId) || moduleId),
              corridors: group.elements.corridors,
              balconies: group.elements.balconies,
              bathroomPods: group.elements.bathroomPods
            }
          })),

          pdfData: sourceFloor.gridState.pdfData ? {
            ...sourceFloor.gridState.pdfData
          } : null,

          canvasState: {
            ...sourceFloor.gridState.canvasState
          }
        },
        elementsTableData: [...sourceFloor.elementsTableData]
      };

      clonedFloors.push(clonedFloor);
      newFloorIds.push(clonedFloor.id);
    }

    set(state => ({
      floors: [...state.floors, ...clonedFloors],
      selectedFloorId: clonedFloors[0].id
    }));

    return newFloorIds;
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

const state = useFloorStore.getState();
if (state.floors.length > 0 && !state.selectedFloorId) {
  state.selectFloor(state.floors[0].id);
}
