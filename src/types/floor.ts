// src/types/floor.ts
export interface PDFData {
  url: string;
  widthGrid: number;
  heightGrid: number;
  calibrated: boolean;
  opacity: number;
}

export interface GridSettings {
  gridSize: number;
  showGrid: boolean;
  snapMode: 'off' | 'grid' | 'element';
  elementGap: number;
}

export interface Floor {
  id: string;
  name: string;
  height: number; // in mm
  pdf?: PDFData;
  gridSettings: GridSettings;
  pdfLocked?: boolean;
}

export interface FloorExport {
  id: string;
  name: string;
  height: number;
  gridSettings: GridSettings;
  calibrated: boolean;
  pdfData?: {
    filename: string;
    base64: string;
    widthGrid: number;
    heightGrid: number;
    opacity: number;
  };
  elements: {
    modules: any[];
    openings: any[];
    balconies: any[];
    bathroomPods: any[];
    corridors: any[];
    roofs: any[];
  };
}

export interface ProjectExport {
  meta: {
    exportedAt: string;
  };
  building?: {
    name: string;
    address?: string;
  };
  floors: FloorExport[];
  globalSettings?: {
    defaultGridSize: number;
  };
}

export interface ImportOptions {
  importFloors: boolean;
  importPDFs: boolean;
  importElements: boolean;
  importSettings: boolean;
}
