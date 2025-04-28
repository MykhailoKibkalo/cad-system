// FILE: src/utils/scalingUtils.ts
import { fabric } from 'fabric';

/**
 * Interface for the scaling tool
 */
export interface ScalingLine {
    start: { x: number; y: number };
    end: { x: number; y: number };
    realWorldLength: number; // In mm
}

/**
 * Creates a temporary line for the scaling tool
 */
export const createScalingLine = (
    canvas: fabric.Canvas,
    start: { x: number; y: number },
    end: { x: number; y: number }
): fabric.Line => {
    // Create the line object
    const line = new fabric.Line([start.x, start.y, end.x, end.y], {
        stroke: '#ff0000',
        strokeWidth: 2,
        selectable: true,
        hasControls: true,
        hasBorders: true,
        cornerColor: '#ff0000',
        cornerSize: 8,
        transparentCorners: false,
    });

    // Add data type for identification
    line.data = {
        type: 'scalingLine',
    };

    // Add to canvas
    canvas.add(line);
    canvas.setActiveObject(line);

    return line;
};

/**
 * Calculates the pixel length of a line
 */
export const calculateLineLength = (
    start: { x: number; y: number },
    end: { x: number; y: number }
): number => {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    return Math.sqrt(dx * dx + dy * dy);
};

/**
 * Calculates the scale factor based on real-world length and pixel length
 */
export const calculateScaleFactor = (
    pixelLength: number,
    realWorldLength: number
): number => {
    return realWorldLength / pixelLength;
};

/**
 * Applies scaling to a PDF backdrop based on the scaling line
 */
export const applyScalingToBackdrop = (
    canvas: fabric.Canvas,
    scalingLine: fabric.Line,
    realWorldLength: number,
    updateBackdrop: (scale: number) => void
): void => {
    if (!scalingLine || !scalingLine.x1 || !scalingLine.y1 || !scalingLine.x2 || !scalingLine.y2) {
        return;
    }

    // Calculate the pixel length of the line
    const pixelLength = calculateLineLength(
        { x: scalingLine.x1, y: scalingLine.y1 },
        { x: scalingLine.x2, y: scalingLine.y2 }
    );

    // Calculate the scale factor
    const scaleFactor = calculateScaleFactor(pixelLength, realWorldLength);

    // Update the backdrop with the new scale
    updateBackdrop(scaleFactor);

    // Remove the scaling line
    canvas.remove(scalingLine);
    canvas.renderAll();
};
