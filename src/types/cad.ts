import { fabric } from 'fabric';

// Extend Fabric types
declare module 'fabric' {
  interface Object {
    id?: string;
    data?: any; // For storing metadata
    moduleId?: string; // Add moduleId for module objects
  }

  interface IObjectOptions {
    excludeFromExport?: boolean;
    data?: any;
    moduleId?: string;
  }
}

export type FloorBeamDirection = 'X' | 'Y';

export interface Module {
  id: string;
  name: string;
  width: number; // mm
  length: number; // mm
  height: number; // mm
  x0: number; // mm, bottom-left
  y0: number; // mm
  rotation: number; // deg
  floorBeamsDir: FloorBeamDirection;
  fabricId: string; // fabric.Object.id for lookup
}

export interface Floor {
  id: string;
  name: string;
  backdrop: fabric.Image | null;
  gridResolution: number; // mm per cell
  showLowerFloor: boolean;
  modules: Module[]; // Add modules array
  moduleCounter: number; // Counter for auto-naming
}

export interface CADState {
  floors: Floor[];
  activeFloorIndex: number;
  snappingEnabled: boolean;
  snapToElementGap: number; // mm
  pixelsPerMm: number; // Conversion ratio for rendering
  backdropLocked: boolean;
  backdropOpacity: number;
  selectedModuleId: string | null;
  drawMode: boolean;
  moduleNamePrefix: string;
}

export interface CADActions {
  addFloor: (name: string) => void;
  setActiveFloor: (index: number) => void;
  updateGridResolution: (floorId: string, resolution: number) => void;
  toggleLowerFloorBackdrop: (floorId: string) => void;
  setBackdrop: (floorId: string, backdrop: fabric.Image | null) => void;
  toggleSnapping: () => void;
  setBackdropLocked: (locked: boolean) => void;
  setBackdropOpacity: (opacity: number) => void;
  setSnapToElementGap: (gap: number) => void;

  // Module actions
  addModule: (floorId: string, module: Omit<Module, 'id' | 'name'>) => string;
  updateModule: (floorId: string, moduleId: string, updates: Partial<Module>) => void;
  removeModule: (floorId: string, moduleId: string) => void;
  setSelectedModuleId: (moduleId: string | null) => void;
  setDrawMode: (enabled: boolean) => void;
  setModuleNamePrefix: (prefix: string) => void;
}

export type CADStore = CADState & CADActions;
