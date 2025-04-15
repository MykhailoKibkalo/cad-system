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
  position: {
    x: number;
    y: number;
  };
  rotation: number;
  wall: 'top' | 'right' | 'bottom' | 'left';
}

export interface Module {
  id: string;
  name?: string;
  category: ModuleCategory;
  width: number;
  height: number;
  position: {
    x: number;
    y: number;
  };
  rotation: number;
  openings: Opening[];
  walls?: ModuleWalls; // New walls property for edge configuration
}

export interface Balcony {
  id: string;
  width: number;
  height: number;
  position: {
    x: number;
    y: number;
  };
  rotation: number;
  attachedToModuleId?: string;
}

export interface Balcony {
  id: string;
  width: number;
  height: number;
  position: {
    x: number;
    y: number;
  };
  rotation: number;
  attachedToModuleId?: string;
}
