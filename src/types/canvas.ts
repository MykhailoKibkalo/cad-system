export interface GridSettings {
  size: number;
  color: string;
  opacity: number;
  visible: boolean;
  snapToGrid: boolean;
  snapToElement: boolean; // New property for element snapping
  snapThreshold: number; // Threshold for element snapping in pixels
}

export interface CanvasSettings {
  width: number;
  height: number;
  zoom: number;
  panX: number;
  panY: number;
}
