export interface GridSettings {
  size: number;
  color: string;
  opacity: number;
  visible: boolean;
  snapToGrid: boolean;
  snapToElement?: boolean; // New property for edge-to-edge snapping
  snapThreshold?: number; // New property for configuring snap distance
}

export interface CanvasSettings {
  width: number;
  height: number;
  zoom: number;
  panX: number;
  panY: number;
}
