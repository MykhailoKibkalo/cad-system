// FILE: src/types/wall.ts
// src/types/wall.ts
export enum WallType {
    EXTERNAL = 'external',
    INTERNAL = 'internal',
}

export enum WallPlacement {
    CENTER = 'center',
    INSIDE = 'inside',
    OUTSIDE = 'outside'
}

export type WallEdge = 'top' | 'right' | 'bottom' | 'left';

export interface WallProperties {
    enabled: boolean;
    type: WallType;
    thickness: number;
    placement: WallPlacement;
    partialStart?: number; // Offset from start (0-1)
    partialEnd?: number; // Offset from end (0-1)
    extendStart: boolean; // Whether to extend the wall at its start to fill corner
    extendEnd: boolean; // Whether to extend the wall at its end to fill corner
}

export interface ModuleWalls {
    top: WallProperties; // Wall 2 (spec p.3, line 9)
    right: WallProperties; // Wall 3 (spec p.3, line 9)
    bottom: WallProperties; // Wall 4 (spec p.3, line 9)
    left: WallProperties; // Wall 1 (spec p.3, line 9)
}

// Default wall thickness values
export const DEFAULT_WALL_THICKNESS = {
    [WallType.EXTERNAL]: 10,
    [WallType.INTERNAL]: 5,
};

// Create default wall properties
export const createDefaultWallProperties = (type: WallType = WallType.EXTERNAL): WallProperties => ({
    enabled: true,
    type,
    thickness: DEFAULT_WALL_THICKNESS[type],
    placement: WallPlacement.OUTSIDE,
    partialStart: 0,
    partialEnd: 0,
    extendStart: false,
    extendEnd: false,
});

// Create default walls for a module
export const createDefaultWalls = (): ModuleWalls => ({
    top: createDefaultWallProperties(),
    bottom: createDefaultWallProperties(),
    right: createDefaultWallProperties(),
    left: createDefaultWallProperties(),
});
