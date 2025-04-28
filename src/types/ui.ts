// FILE: src/types/ui.ts
// src/types/ui.ts
export enum ToolType {
  SELECT = 'select',
  MODULE = 'module',
  OPENING_DOOR = 'opening_door',
  OPENING_WINDOW = 'opening_window',
  OPENING_GENERIC = 'opening_generic',
  BALCONY = 'balcony',
  HAND = 'hand',
  BATHROOM_POD = 'bathroom_pod', // New tool type for bathroom pods (spec p.5, line 1)
  CORRIDOR = 'corridor',         // New tool type for corridors (spec p.5, line 1)
  ROOF = 'roof',                 // New tool type for roofs (spec p.4, line 10)
  SCALE = 'scale',               // New tool type for scaling (spec p.7, line 31)
}

export interface ToolState {
  activeTool: ToolType;
  selectedObjectId: string | null;
  selectedFloorId: string | null;
  customTool?: string;           // For extending tool types
}
