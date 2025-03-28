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
  locked?: boolean; // Controls if the PDF can be selected/moved
  preservePosition?: boolean; // Whether to preserve position outside viewport
  currentPage?: number;
  totalPages?: number;
  fileName?: string;
}

export interface Floor {
  id: string;
  name: string;
  modules: Module[];
  balconies: Balcony[];
  backdrop?: PdfBackdrop;
  visible: boolean;
}
