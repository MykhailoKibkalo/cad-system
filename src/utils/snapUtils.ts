// src/utils/snapUtils.ts
import { fabric } from 'fabric';

/**
 * Interface for alignment lines coordinates
 */
export interface AlignmentLines {
    horizontal?: number;
    vertical?: number;
}

/**
 * Snaps a point to nearby element edges
 * @param canvas The Fabric.js canvas
 * @param targetObject The object being moved
 * @param x The x coordinate
 * @param y The y coordinate
 * @param threshold The snapping threshold in pixels
 * @returns The snapped coordinates and any alignment lines to display
 */
export const snapToElement = (
    canvas: fabric.Canvas,
    targetObject: fabric.Object,
    x: number,
    y: number,
    threshold: number = 10
): { x: number; y: number; alignmentLines: AlignmentLines } => {
    const alignmentLines: AlignmentLines = {};

    // Get all objects in the canvas except the target, grid, and alignment lines
    const objects = canvas.getObjects().filter(obj => {
        return obj !== targetObject &&
            obj.data?.type !== 'grid' &&
            obj.data?.type !== 'alignmentLine' &&
            obj.data?.type !== 'wall'; // Exclude walls from snapping targets
    });

    let snappedX = x;
    let snappedY = y;

    // Get the width and height of the target
    const targetWidth = (targetObject.width || 0) * (targetObject.scaleX || 1);
    const targetHeight = (targetObject.height || 0) * (targetObject.scaleY || 1);

    // Calculate target edges
    const targetLeft = x;
    const targetRight = x + targetWidth;
    const targetTop = y;
    const targetBottom = y + targetHeight;
    const targetCenterX = x + targetWidth / 2;
    const targetCenterY = y + targetHeight / 2;

    // For each object, check if any edges align
    objects.forEach(obj => {
        if (!obj.visible) return;

        // Get object dimensions
        const objWidth = (obj.width || 0) * (obj.scaleX || 1);
        const objHeight = (obj.height || 0) * (obj.scaleY || 1);

        // Calculate object edges
        const objLeft = obj.left || 0;
        const objRight = objLeft + objWidth;
        const objTop = obj.top || 0;
        const objBottom = objTop + objHeight;
        const objCenterX = objLeft + objWidth / 2;
        const objCenterY = objTop + objHeight / 2;

        // --- Horizontal alignment ---

        // Left edge to left edge
        if (Math.abs(targetLeft - objLeft) < threshold) {
            snappedX = objLeft;
            alignmentLines.vertical = objLeft;
        }
        // Right edge to right edge
        else if (Math.abs(targetRight - objRight) < threshold) {
            snappedX = objRight - targetWidth;
            alignmentLines.vertical = objRight;
        }
        // Left edge to right edge (adjacent)
        else if (Math.abs(targetLeft - objRight) < threshold) {
            snappedX = objRight;
            alignmentLines.vertical = objRight;
        }
        // Right edge to left edge (adjacent)
        else if (Math.abs(targetRight - objLeft) < threshold) {
            snappedX = objLeft - targetWidth;
            alignmentLines.vertical = objLeft;
        }
        // Center to center (horizontally)
        else if (Math.abs(targetCenterX - objCenterX) < threshold) {
            snappedX = objCenterX - targetWidth / 2;
            alignmentLines.vertical = objCenterX;
        }

        // --- Vertical alignment ---

        // Top edge to top edge
        if (Math.abs(targetTop - objTop) < threshold) {
            snappedY = objTop;
            alignmentLines.horizontal = objTop;
        }
        // Bottom edge to bottom edge
        else if (Math.abs(targetBottom - objBottom) < threshold) {
            snappedY = objBottom - targetHeight;
            alignmentLines.horizontal = objBottom;
        }
        // Top edge to bottom edge (adjacent)
        else if (Math.abs(targetTop - objBottom) < threshold) {
            snappedY = objBottom;
            alignmentLines.horizontal = objBottom;
        }
        // Bottom edge to top edge (adjacent)
        else if (Math.abs(targetBottom - objTop) < threshold) {
            snappedY = objTop - targetHeight;
            alignmentLines.horizontal = objTop;
        }
        // Center to center (vertically)
        else if (Math.abs(targetCenterY - objCenterY) < threshold) {
            snappedY = objCenterY - targetHeight / 2;
            alignmentLines.horizontal = objCenterY;
        }
    });

    return { x: snappedX, y: snappedY, alignmentLines };
};

/**
 * Creates alignment lines on the canvas based on the provided coordinates
 * @param canvas The Fabric.js canvas
 * @param alignmentLines The alignment lines to draw
 * @returns The created line objects
 */
export const createAlignmentLines = (
    canvas: fabric.Canvas,
    alignmentLines: AlignmentLines
): fabric.Line[] => {
    const lines: fabric.Line[] = [];

    // Remove any existing alignment lines
    canvas.getObjects().filter(obj => obj.data?.type === 'alignmentLine').forEach(line => {
        canvas.remove(line);
    });

    // Create horizontal alignment line
    if (alignmentLines.horizontal !== undefined) {
        const line = new fabric.Line(
            [0, alignmentLines.horizontal, canvas.getWidth() || 1000, alignmentLines.horizontal],
            {
                stroke: '#00A0FF',
                strokeWidth: 1,
                strokeDashArray: [5, 5],
                selectable: false,
                evented: false,
            }
        );

        line.data = { type: 'alignmentLine' };
        canvas.add(line);
        canvas.bringToFront(line);
        lines.push(line);
    }

    // Create vertical alignment line
    if (alignmentLines.vertical !== undefined) {
        const line = new fabric.Line(
            [alignmentLines.vertical, 0, alignmentLines.vertical, canvas.getHeight() || 800],
            {
                stroke: '#00A0FF',
                strokeWidth: 1,
                strokeDashArray: [5, 5],
                selectable: false,
                evented: false,
            }
        );

        line.data = { type: 'alignmentLine' };
        canvas.add(line);
        canvas.bringToFront(line);
        lines.push(line);
    }

    return lines;
};

/**
 * Removes all alignment lines from the canvas
 * @param canvas The Fabric.js canvas
 */
export const removeAlignmentLines = (canvas: fabric.Canvas): void => {
    canvas.getObjects().filter(obj => obj.data?.type === 'alignmentLine').forEach(line => {
        canvas.remove(line);
    });
};
