// src/types/geometry.d.ts
export interface Module {
    id: string;
    name: string;
    width: number;
    length: number;
    height: number;
    x0: number;
    y0: number;
    zOffset: number;
    rotation: number;
    stackedFloors: number;
}

export interface Opening {
    id: string;
    moduleId: string;
    wallSide: 1 | 2 | 3 | 4;
    width: number;
    height: number;
    distance: number;
    yOffset: number;
}

export interface Balcony {
    id: string;
    moduleId: string;
    wallSide: 1 | 2 | 3 | 4;
    width: number;
    length: number;
    distance: number;
}

export interface BathroomPod {
    id: string;
    moduleId: string;
    width: number;
    length: number;
    xOffset: number;
    yOffset: number;
}

export interface Corridor {
    id: string;
    direction: 'horizontal' | 'vertical';
    floor: number;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
}

export interface Roof {
    id: string;
    direction: 'H' | 'V';
    type: 'flat' | 'mono-pitched' | 'gable';
    angle: number;
    level: number;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    parapetHeight?: number;
}
