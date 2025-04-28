/**
 * Converts millimeters to pixels based on the current scale
 */
export const mmToPx = (mm: number, pixelsPerMm: number): number => {
    return mm * pixelsPerMm;
};

/**
 * Converts pixels to millimeters based on the current scale
 */
export const pxToMm = (px: number, pixelsPerMm: number): number => {
    return px / pixelsPerMm;
};

/**
 * Rounds a value to the nearest multiple of the specified grid size (in mm)
 */
export const snapToGrid = (value: number, gridSize: number = 10): number => {
    return Math.round(value / gridSize) * gridSize;
};
