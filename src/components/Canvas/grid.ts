import { fabric } from 'fabric';

/**
 * Draws a grid on the canvas with lines at specified intervals
 * @param canvas The fabric canvas to draw on
 * @param stepPx The step size in pixels
 */
export function drawGrid(canvas: fabric.Canvas, stepPx: number): void {
    if (!canvas) return;

    // Clear previous grid lines
    const existingGridLines = canvas.getObjects().filter((obj) => obj.data?.grid === true);
    existingGridLines.forEach((line) => canvas.remove(line));

    const canvasWidth = canvas.getWidth();
    const canvasHeight = canvas.getHeight();

    // Create vertical lines
    for (let x = 0; x <= canvasWidth; x += stepPx) {
        const line = new fabric.Line([x, 0, x, canvasHeight], {
            stroke: '#ddd',
            selectable: false,
            evented: false,
            data: { grid: true },
        });
        canvas.add(line);
        line.sendToBack();
    }

    // Create horizontal lines
    for (let y = 0; y <= canvasHeight; y += stepPx) {
        const line = new fabric.Line([0, y, canvasWidth, y], {
            stroke: '#ddd',
            selectable: false,
            evented: false,
            data: { grid: true },
        });
        canvas.add(line);
        line.sendToBack();
    }

    canvas.requestRenderAll();
}
