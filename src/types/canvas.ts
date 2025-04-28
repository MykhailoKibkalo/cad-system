// FILE: src/types/canvas.ts
export interface GridSettings {
  size: number;
  color: string;
  opacity: number;
  visible: boolean;
  snapToGrid: boolean;
  snapToElement: boolean; // For snapping elements with gap
  snapThreshold: number; // Default gap 50mm (spec p.2, line 10)
  elementGap: number; // For space between elements when snapping
}

export interface CanvasSettings {
  width: number;
  height: number;
  zoom: number;
  panX: number;
  panY: number;
}

export interface DisplaySettings {
  showDimensions: boolean;
  dimensionUnit: string;
  showFloorBeams: boolean; // For CC 600mm floor beams (spec p.2, line 26)
}
