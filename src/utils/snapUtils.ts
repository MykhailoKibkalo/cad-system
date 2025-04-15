// src/utils/snapUtils.ts
import { fabric } from 'fabric';

/**
 * Interface for snap settings
 */
export interface SnapSettings {
    snapToGrid: boolean;
    snapToElement: boolean;
    gridSize: number;
    snapThreshold: number;
}

/**
 * Snaps a point to the grid
 */
export const snapToGrid = (x: number, y: number, gridSize: number): { x: number; y: number } => {
    return {
        x: Math.round(x / gridSize) * gridSize,
        y: Math.round(y / gridSize) * gridSize,
    };
};

/**
 * Interface for alignment guidelines
 */
export interface AlignmentGuideline {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
}

/**
 * Snaps a point to nearby elements
 */
export const snapToElement = (
    canvas: fabric.Canvas,
    target: fabric.Object | null,
    x: number,
    y: number,
    threshold: number
): { x: number; y: number; guidelines: AlignmentGuideline[] } => {
    // Default return values
    let snappedX = x;
    let snappedY = y;
    const guidelines: AlignmentGuideline[] = [];

    // If no target or canvas, return original position
    if (!target || !canvas) {
        return { x: snappedX, y: snappedY, guidelines };
    }

    // If target is null, we can't get width/height properties for snapping
    // So just return the original position
    if (!target.getScaledWidth || !target.getScaledHeight) {
        return { x: snappedX, y: snappedY, guidelines };
    }

    // Get all other objects on the canvas
    const objects = canvas.getObjects().filter(obj => obj !== target && obj.data?.type !== 'grid' && obj.data?.type !== 'pdfBackdrop');

    // Skip if no other objects
    if (objects.length === 0) {
        return { x: snappedX, y: snappedY, guidelines };
    }

    // Get target bounds
    const targetWidth = target.getScaledWidth ? target.getScaledWidth() : target.width || 0;
    const targetHeight = target.getScaledHeight ? target.getScaledHeight() : target.height || 0;

    // Calculate target edges
    const targetLeft = x;
    const targetRight = x + targetWidth;
    const targetTop = y;
    const targetBottom = y + targetHeight;
    const targetCenterX = x + targetWidth / 2;
    const targetCenterY = y + targetHeight / 2;

    // Track which snaps have occurred to avoid duplicate snapping
    let hasSnappedX = false;
    let hasSnappedY = false;

    // Check each object for potential snapping
    objects.forEach(obj => {
        // Skip if not a module or balcony
        if (!obj.data?.type || !['module', 'balcony'].includes(obj.data.type)) {
            return;
        }

        // Get object bounds
        const objWidth = obj.getScaledWidth ? obj.getScaledWidth() : obj.width || 0;
        const objHeight = obj.getScaledHeight ? obj.getScaledHeight() : obj.height || 0;
        const objLeft = obj.left || 0;
        const objRight = objLeft + objWidth;
        const objTop = obj.top || 0;
        const objBottom = objTop + objHeight;
        const objCenterX = objLeft + objWidth / 2;
        const objCenterY = objTop + objHeight / 2;

        // Horizontal snapping (x-axis)
        if (!hasSnappedX) {
            // Left edge to left edge
            if (Math.abs(targetLeft - objLeft) < threshold) {
                snappedX = objLeft;
                hasSnappedX = true;
                guidelines.push({
                    x1: objLeft,
                    y1: Math.min(targetTop - threshold, objTop - threshold),
                    x2: objLeft,
                    y2: Math.max(targetBottom + threshold, objBottom + threshold),
                });
            }
            // Right edge to right edge
            else if (Math.abs(targetRight - objRight) < threshold) {
                snappedX = objRight - targetWidth;
                hasSnappedX = true;
                guidelines.push({
                    x1: objRight,
                    y1: Math.min(targetTop - threshold, objTop - threshold),
                    x2: objRight,
                    y2: Math.max(targetBottom + threshold, objBottom + threshold),
                });
            }
            // Left edge to right edge
            else if (Math.abs(targetLeft - objRight) < threshold) {
                snappedX = objRight;
                hasSnappedX = true;
                guidelines.push({
                    x1: objRight,
                    y1: Math.min(targetTop - threshold, objTop - threshold),
                    x2: objRight,
                    y2: Math.max(targetBottom + threshold, objBottom + threshold),
                });
            }
            // Right edge to left edge
            else if (Math.abs(targetRight - objLeft) < threshold) {
                snappedX = objLeft - targetWidth;
                hasSnappedX = true;
                guidelines.push({
                    x1: objLeft,
                    y1: Math.min(targetTop - threshold, objTop - threshold),
                    x2: objLeft,
                    y2: Math.max(targetBottom + threshold, objBottom + threshold),
                });
            }
            // Center alignment
            else if (Math.abs(targetCenterX - objCenterX) < threshold) {
                snappedX = objCenterX - targetWidth / 2;
                hasSnappedX = true;
                guidelines.push({
                    x1: objCenterX,
                    y1: Math.min(targetTop - threshold, objTop - threshold),
                    x2: objCenterX,
                    y2: Math.max(targetBottom + threshold, objBottom + threshold),
                });
            }
        }

        // Vertical snapping (y-axis)
        if (!hasSnappedY) {
            // Top edge to top edge
            if (Math.abs(targetTop - objTop) < threshold) {
                snappedY = objTop;
                hasSnappedY = true;
                guidelines.push({
                    x1: Math.min(targetLeft - threshold, objLeft - threshold),
                    y1: objTop,
                    x2: Math.max(targetRight + threshold, objRight + threshold),
                    y2: objTop,
                });
            }
            // Bottom edge to bottom edge
            else if (Math.abs(targetBottom - objBottom) < threshold) {
                snappedY = objBottom - targetHeight;
                hasSnappedY = true;
                guidelines.push({
                    x1: Math.min(targetLeft - threshold, objLeft - threshold),
                    y1: objBottom,
                    x2: Math.max(targetRight + threshold, objRight + threshold),
                    y2: objBottom,
                });
            }
            // Top edge to bottom edge
            else if (Math.abs(targetTop - objBottom) < threshold) {
                snappedY = objBottom;
                hasSnappedY = true;
                guidelines.push({
                    x1: Math.min(targetLeft - threshold, objLeft - threshold),
                    y1: objBottom,
                    x2: Math.max(targetRight + threshold, objRight + threshold),
                    y2: objBottom,
                });
            }
            // Bottom edge to top edge
            else if (Math.abs(targetBottom - objTop) < threshold) {
                snappedY = objTop - targetHeight;
                hasSnappedY = true;
                guidelines.push({
                    x1: Math.min(targetLeft - threshold, objLeft - threshold),
                    y1: objTop,
                    x2: Math.max(targetRight + threshold, objRight + threshold),
                    y2: objTop,
                });
            }
            // Center alignment
            else if (Math.abs(targetCenterY - objCenterY) < threshold) {
                snappedY = objCenterY - targetHeight / 2;
                hasSnappedY = true;
                guidelines.push({
                    x1: Math.min(targetLeft - threshold, objLeft - threshold),
                    y1: objCenterY,
                    x2: Math.max(targetRight + threshold, objRight + threshold),
                    y2: objCenterY,
                });
            }
        }
    });

    return { x: snappedX, y: snappedY, guidelines };
};

/**
 * Combined function that handles both grid and element snapping
 */
export const snapToGridAndElements = (
    canvas: fabric.Canvas,
    target: fabric.Object | null,
    x: number,
    y: number,
    settings: SnapSettings
): { x: number; y: number; guidelines: AlignmentGuideline[] } => {
    let snappedX = x;
    let snappedY = y;
    let guidelines: AlignmentGuideline[] = [];

    // First snap to grid if enabled
    if (settings.snapToGrid) {
        const gridSnapped = snapToGrid(x, y, settings.gridSize);
        snappedX = gridSnapped.x;
        snappedY = gridSnapped.y;
    }

    // Then snap to elements if enabled
    if (settings.snapToElement) {
        const elementSnapped = snapToElement(canvas, target, snappedX, snappedY, settings.snapThreshold);
        snappedX = elementSnapped.x;
        snappedY = elementSnapped.y;
        guidelines = elementSnapped.guidelines;
    }

    return { x: snappedX, y: snappedY, guidelines };
};

/**
 * Renders alignment guidelines on the canvas
 */
export const renderAlignmentGuidelines = (
    canvas: fabric.Canvas,
    guidelines: AlignmentGuideline[],
    color: string = 'rgb(0, 162, 255)'
): fabric.Line[] => {
    // Remove any existing guidelines
    const existingGuidelines = canvas.getObjects().filter(obj => obj.data?.type === 'alignmentGuideline');
    existingGuidelines.forEach(line => canvas.remove(line));

    // Create new guidelines
    const guidelineObjects: fabric.Line[] = [];

    guidelines.forEach(guideline => {
        const line = new fabric.Line([guideline.x1, guideline.y1, guideline.x2, guideline.y2], {
            stroke: color,
            strokeWidth: 1,
            strokeDashArray: [5, 5],
            selectable: false,
            evented: false,
        });

        // Add data to identify as guideline
        line.data = { type: 'alignmentGuideline' };

        canvas.add(line);
        canvas.bringToFront(line);
        guidelineObjects.push(line);
    });

    return guidelineObjects;
};

/**
 * Clears all alignment guidelines from the canvas
 */
export const clearAlignmentGuidelines = (canvas: fabric.Canvas): void => {
    if (!canvas) return;

    const guidelines = canvas.getObjects().filter(obj => obj.data?.type === 'alignmentGuideline');
    guidelines.forEach(line => canvas.remove(line));
    canvas.renderAll();
};
