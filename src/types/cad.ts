import { fabric } from 'fabric';

// Extend Fabric types
declare module 'fabric' {
  interface Object {
    id?: string;
    data?: any; // For storing metadata
  }

  interface IObjectOptions {
    excludeFromExport?: boolean;
    data?: any;
  }
}

export interface Floor {
  id: string;
  name: string;
  backdrop: fabric.Image | null;
  gridResolution: number; // mm per cell
  showLowerFloor: boolean;
}

export interface CADState {
  floors: Floor[];
  activeFloorIndex: number;
  snappingEnabled: boolean;
  pixelsPerMm: number; // Conversion ratio for rendering
}

export interface CADActions {
  addFloor: (name: string) => void;
  setActiveFloor: (index: number) => void;
  updateGridResolution: (floorId: string, resolution: number) => void;
  toggleLowerFloorBackdrop: (floorId: string) => void;
  setBackdrop: (floorId: string, backdrop: fabric.Image | null) => void;
  toggleSnapping: () => void;
}

export type CADStore = CADState & CADActions;
