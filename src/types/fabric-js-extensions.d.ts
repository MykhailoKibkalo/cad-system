// src/types/fabric-js-extensions.d.ts
import { ToolType } from './ui';

declare module 'fabric' {
  interface Canvas {
    // Properties used for panning
    isDragging?: boolean;
    lastPosX?: number;
    lastPosY?: number;
    isMiddleDown?: boolean;
    // Add these properties and methods if needed for other features
    viewportTransform?: number[];

    // Method for getting active objects (exists in Fabric.js but TypeScript doesn't know about it)
    getActiveObjects(): fabric.Object[];

    absolutePan(point: fabric.Point): void;
  }

  interface Object {
    // Custom data property for storing metadata about our objects
    data?: {
      type?: string;
      id?: string;
      floorId?: string;
      category?: string;
      previousTool?: ToolType;
      [key: string]: any;
    };

    // Methods that exist but TypeScript doesn't know about
    getScaledWidth?(): number;

    getScaledHeight?(): number;
  }
}
