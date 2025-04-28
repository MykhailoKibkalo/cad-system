// FILE: src/types/floor.ts
// src/types/floor.ts
import { Balcony, Module } from '@/types/module';

export interface PdfBackdrop {
  id: string;
  url: string;
  scale: number;
  opacity: number;
  position: {
    x: number;
    y: number;
  };
  locked?: boolean;
  preservePosition?: boolean;
  currentPage?: number;
  totalPages?: number;
  fileName?: string;
}

export interface Corridor {
  id: string;
  name: string; // "Unique identifier for the corridor (e.g., C1, C2 etc.)" (spec p.9, line 2)
  direction: 'horizontal' | 'vertical'; // Based on longer axis (spec p.9, line 3)
  floor: number; // Floor level (spec p.9, line 4)
  position: {
    x1: number; // Bottom-left corner (spec p.9, line 5)
    y1: number; // Bottom-left corner (spec p.9, line 6)
    x2: number; // Top-right corner (spec p.9, line 7)
    y2: number; // Top-right corner (spec p.9, line 8)
  };
}

export interface Roof {
  id: string;
  name: string; // "Unique identifier for the roof (e.g., R1, R2, etc.)" (spec p.9, line 12)
  direction: string; // Orientation of roofs ridge (spec p.9, line 13)
  type: 'Flat' | 'Mono-pitched' | 'Gable'; // Roof type (spec p.9, line 14)
  angle: number; // Angle of the roof (spec p.9, line 15)
  level: number; // Floor level (spec p.9, line 16)
  position: {
    x1: number; // Bottom-left corner (spec p.9, line 17)
    y1: number; // Bottom-left corner (spec p.9, line 18)
    x2: number; // Top-right corner (spec p.9, line 19)
    y2: number; // Top-right corner (spec p.9, line 20)
  };
  parapetHeight: number; // Vertical height of parapet (spec p.9, line 21)
}

export interface Floor {
  id: string;
  name: string;
  modules: Module[];
  balconies: Balcony[];
  corridors: Corridor[]; // Added corridors (spec p.5, line 1-2)
  roofs: Roof[]; // Added roofs (spec p.4, line 10-20)
  backdrop?: PdfBackdrop;
  visible: boolean;
}
