import { fabric } from 'fabric';

/**
 * Draws a grid on the canvas based on the specified resolution
 */
export const drawGrid = (
    canvas: fabric.Canvas,
    gridResolution: number,
    pixelsPerMm: number
): void => {
  const gridSize = gridResolution * pixelsPerMm; // Grid cell size in pixels
  const width = canvas.getWidth();
  const height = canvas.getHeight();

  // Calculate grid extent based on canvas size
  const gridExtentX = Math.ceil(width / 2 / gridSize) * 2;
  const gridExtentY = Math.ceil(height / 2 / gridSize) * 2;

  // Draw vertical lines
  for (let i = -gridExtentX; i <= gridExtentX; i++) {
    const x = i * gridSize;
    const line = new fabric.Line([x, -height, x, height], {
      stroke: i === 0 ? '#666666' : '#dddddd',
      strokeWidth: i === 0 ? 1 : 1,
      selectable: false,
      evented: false,
      excludeFromExport: true,
      data: { type: 'gridLine' }
    });
    canvas.add(line);
    line.sendToBack();
  }

  // Draw horizontal lines
  for (let i = -gridExtentY; i <= gridExtentY; i++) {
    const y = i * gridSize;
    const line = new fabric.Line([-width, y, width, y], {
      stroke: i === 0 ? '#666666' : '#dddddd',
      strokeWidth: i === 0 ? 1 : 1,
      selectable: false,
      evented: false,
      excludeFromExport: true,
      data: { type: 'gridLine' }
    });
    canvas.add(line);
    line.sendToBack();
  }
};

/**
 * Clears all grid lines from the canvas
 */
export const clearGrid = (canvas: fabric.Canvas): void => {
  const gridLines = canvas.getObjects().filter((obj) => obj.data?.type === 'gridLine');
  gridLines.forEach((line) => {
    canvas.remove(line);
  });
};

/**
 * Enables snapping to grid (stub for now)
 */
export const enableSnapping = (canvas: fabric.Canvas, gridSize: number): void => {
  // TODO: Implement proper snapping logic
  console.log('Snapping enabled with grid size:', gridSize);
};

/**
 * Disables snapping to grid (stub for now)
 */
export const disableSnapping = (canvas: fabric.Canvas): void => {
  // TODO: Implement snapping disable logic
  console.log('Snapping disabled');
};
