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
}

export interface Floor {
  id: string;
  name: string;
  modules: Module[];
  balconies: Balcony[];
  backdrop?: PdfBackdrop;
  visible: boolean;
}
