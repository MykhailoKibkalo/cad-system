export interface IOpening {
  id: string;
  side: 1 | 2 | 3 | 4;
  width: number;
  height: number;
  distanceAlongWall: number;
  yOffset: number;
}

// Balcony Definition
export interface IBalcony {
  id: string;
  side: 1 | 2 | 3 | 4;
  width: number;
  length: number;
  distanceAlongWall: number;
}

// Bathroom Pod Definition
export interface IBathroomPod {
  id: string;
  width: number;
  length: number;
  xOffset: number;
  yOffset: number;
}

// Module Definition
export interface IModule {
  moduleId: string;
  width: number;
  length: number;
  height: number;
  x0: number;
  y0: number;
  zOffset: number;
  rotation: number;
  openings: IOpening[];
  balconies: IBalcony[];
  bathroomPods: IBathroomPod[];
}

// Floor Definition
export interface IFloor {
  floorNumber: number;
  pdfUrl: string;
  pdfX0: number;
  pdfY0: number;
  pdfWidth: number;
  pdfHeight: number;
  modules: IModule[];
}
