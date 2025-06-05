export interface CanvasDimensions {
    width: number;
    height: number;
}

export interface SelectedModule {
  id: string;
  isDragging?: boolean;
  currentWallThickness?: number;
  currentWidth?: number;
  currentHeight?: number;
}

export interface PdfData {
  url: string;
  width: number;
  height: number;
  x: number;
  y: number;
  opacity: number;
  isLocked: boolean;
  scaleFactor: number;
}
