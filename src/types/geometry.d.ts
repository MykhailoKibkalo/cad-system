export interface Module {
  id: string;
  name: string;
  width: number;
  length: number;
  height: number;
  x0: number;
  y0: number;
  zOffset: number;
  rotation: number;
  stackedFloors: number;
  showBorder?: boolean;
  isGrouped?: boolean;
  groupId?: string;
}

export interface Opening {
  id: string;
  moduleId: string;
  wallSide: 1 | 2 | 3 | 4;
  distanceAlongWall: number;
  yOffset: number;
  width: number;
  height: number;
}

export interface Balcony {
  id: string;
  moduleId: string;
  name: string;
  width: number;
  length: number;
  distanceAlongWall: number;
  wallSide: 1 | 2 | 3 | 4;
  isGrouped?: boolean;
  groupId?: string;
}

export interface BathroomPod {
  id: string;
  moduleId: string;
  name: string;
  width: number;
  length: number;
  x_offset: number;
  y_offset: number;
  type?: string;
  isGrouped?: boolean;
  groupId?: string;
}

export interface Corridor {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  floor: number;
  isGrouped?: boolean;
  groupId?: string;
}

export interface Roof {
  id: string;
  direction: 'H' | 'V';
  type: 'flat' | 'mono-pitched' | 'gable';
  angle: number;
  level: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  parapetHeight?: number;
}

export interface ElementGroup {
  id: string;
  name: string;
  elements: {
    modules: string[];
    corridors: string[];
    balconies: string[];
    bathroomPods: string[];
  };
  x: number;
  y: number;
  width: number;
  height: number;
  createdAt: number;
}

// Legacy alias for backward compatibility
export type ModuleGroup = ElementGroup;
