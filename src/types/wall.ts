// src/types/wall.ts
export enum WallType {
    EXTERNAL = 'external',
    INTERNAL = 'internal',
}

export enum WallPlacement {
    CENTER = 'center', // Half inside, half outside (default)
    INSIDE = 'inside',  // Fully inside the module
    OUTSIDE = 'outside' // Fully outside the module
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
    top: WallProperties;
    right: WallProperties;
    bottom: WallProperties;
    left: WallProperties;
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
    placement: WallPlacement.OUTSIDE, // Default to centered placement
    partialStart: 0,
    partialEnd: 0,
    extendStart: false, // Don't extend by default
    extendEnd: false,   // Don't extend by default
});

// Create default walls for a module
export const createDefaultWalls = (): ModuleWalls => ({
    top: createDefaultWallProperties(),
    bottom: createDefaultWallProperties(),
    right: createDefaultWallProperties(),
    left: createDefaultWallProperties(),
});
