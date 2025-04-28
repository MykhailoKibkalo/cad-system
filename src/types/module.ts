// FILE: src/types/module.ts
// src/types/module.ts
import { ModuleWalls } from '@/types/wall';

export enum ModuleCategory {
  A1 = 'A1',
  A2 = 'A2',
  A3 = 'A3',
  B1 = 'B1',
  B2 = 'B2',
  B3 = 'B3',
  B4 = 'B4',
  C1 = 'C1',
  C2 = 'C2',
  C3 = 'C3',
  D1 = 'D1',
  D2 = 'D2',
}

export interface ModuleColors {
  [ModuleCategory.A1]: string;
  [ModuleCategory.A2]: string;
  [ModuleCategory.A3]: string;
  [ModuleCategory.B1]: string;
  [ModuleCategory.B2]: string;
  [ModuleCategory.B3]: string;
  [ModuleCategory.B4]: string;
  [ModuleCategory.C1]: string;
  [ModuleCategory.C2]: string;
  [ModuleCategory.C3]: string;
  [ModuleCategory.D1]: string;
  [ModuleCategory.D2]: string;
}

export interface OpeningDimension {
  width: number;
  height: number;
}

export enum OpeningType {
  DOOR = 'door',
  WINDOW = 'window',
  OPENING = 'opening',
}

export interface Opening {
  id: string;
  type: OpeningType;
  width: number;
  height: number;
  yOffset: number; // y-offset property (spec p.4, line 2)
  distanceAlongWall: number; // Distance along wall (spec p.4, line 7)
  wall: 'top' | 'right' | 'bottom' | 'left'; // Wall side [1, 2, 3, 4] (spec p.4, line 6)
  presetName?: string; // For saved presets (spec p.4, line 3)
}

export interface BathroomPod {
  id: string;
  name: string; // "Required to start with BPx" (spec p.8, line 41)
  width: number; // Width property (spec p.5, line 3)
  length: number; // Length property (spec p.5, line 3)
  xOffset: number; // x_offset property (spec p.5, line 4)
  yOffset: number; // y_offset property (spec p.5, line 4)
  type: string; // Default "F"/Free (spec p.5, line 8)
}

export interface Module {
  id: string;
  name: string; // M1, M2, M3 naming convention (spec p.2, line 31)
  category: ModuleCategory;
  width: number;
  height: number;
  position: {
    x: number;
    y: number;
  };
  rotation: number; // Based on bottom-left corner (spec p.2, line 27)
  floorBeamDirection: 'short' | 'long'; // Default short side (spec p.2, line 25)
  openings: Opening[];
  walls?: ModuleWalls; // Wall configuration
  bathroomPods: BathroomPod[]; // Bathroom pods (spec p.5, line 1-8)
}

export interface Balcony {
  id: string;
  name: string; // "Required to start with BC" (spec p.8, line 25)
  width: number; // Width along wall (spec p.6, line 3)
  length: number; // Protruding from wall (spec p.6, line 4)
  wall: 'top' | 'right' | 'bottom' | 'left'; // Wall side [1, 2, 3, 4] (spec p.6, line 3)
  distanceAlongWall: number; // Distance along wall positioning (spec p.6, line 5)
  moduleId: string; // Cannot belong to multiple modules (spec p.6, line 6)
}
