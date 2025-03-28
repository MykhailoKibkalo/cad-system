// src/types/ui.ts
export enum ToolType {
  SELECT = 'select',
  MODULE = 'module',
  OPENING_DOOR = 'opening_door',
  OPENING_WINDOW = 'opening_window',
  OPENING_GENERIC = 'opening_generic',
  BALCONY = 'balcony',
  HAND = 'hand', // Added hand tool
}

export interface ToolState {
  activeTool: ToolType;
  selectedObjectId: string | null;
  selectedFloorId: string | null;
}
