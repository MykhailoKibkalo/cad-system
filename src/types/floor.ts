// src/types/floor.ts

// Opening Definition
export interface IOpening {
  id: string;                  // unique within the module
  side: 1 | 2 | 3 | 4;         // which wall of the module
  width: number;               // width in millimeters
  height: number;              // height in millimeters
  distanceAlongWall: number;   // millimeters from the wall's reference corner
  yOffset: number;             // vertical offset inside the module (millimeters)
}

// Balcony Definition
export interface IBalcony {
  id: string;                  // unique within the module, e.g. "BC1"
  side: 1 | 2 | 3 | 4;         // which module wall it attaches to
  width: number;               // balcony width in millimeters
  length: number;              // balcony length in millimeters
  distanceAlongWall: number;   // millimeters from module's reference corner
}

// Bathroom Pod Definition
export interface IBathroomPod {
  id: string;                  // unique within the module, e.g. "BP1"
  width: number;               // width in millimeters
  length: number;              // length in millimeters
  xOffset: number;             // horizontal offset inside the module (mm)
  yOffset: number;             // vertical offset inside the module (mm)
}

// Module Definition
export interface IModule {
  moduleId: string;            // e.g. "M1"
  width: number;               // width in millimeters
  length: number;              // length in millimeters
  height: number;              // height in millimeters
  x0: number;                  // X-coordinate (millimeters) of bottom-left corner
  y0: number;                  // Y-coordinate (millimeters) of bottom-left corner
  zOffset: number;             // vertical offset from floor base (millimeters)
  rotation: number;            // rotation in degrees (0–359)
  openings: IOpening[];        // list of all openings in this module
  balconies: IBalcony[];       // list of all balconies attached to this module
  bathroomPods: IBathroomPod[];// list of all bathroom pods inside this module
}

// Floor Definition
export interface IFloor {
  floorNumber: number;         // e.g. 1, 2, 3, …
  pdfUrl: string;              // URL or relative path to this floor's PDF image
  pdfX0: number;               // X position to render PDF (pixels or internal units)
  pdfY0: number;               // Y position to render PDF (pixels or internal units)
  pdfWidth: number;            // display width of the PDF (pixels or internal units)
  pdfHeight: number;           // display height of the PDF (pixels or internal units)
  modules: IModule[];          // array of all modules placed on this floor
}