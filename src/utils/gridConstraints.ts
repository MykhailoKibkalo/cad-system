
export interface Bounds {
  left: number;
  top: number;
  width: number;
  height: number;
}

/**
 * Constrains an object's position to stay within the grid boundaries
 * @param left - Object's left position in pixels
 * @param top - Object's top position in pixels
 * @param width - Object's width in pixels
 * @param height - Object's height in pixels
 * @param gridWidthM - Grid width in meters
 * @param gridHeightM - Grid height in meters
 * @param scaleFactor - Scale factor for converting between pixels and mm
 * @returns Constrained position
 */
export function constrainToGrid(
  left: number,
  top: number,
  width: number,
  height: number,
  gridWidthM: number,
  gridHeightM: number,
  scaleFactor: number
): { left: number; top: number } {
  // Convert grid dimensions from meters to pixels (1m = 1000mm)
  const gridWidthPx = gridWidthM * 1000 * scaleFactor;
  const gridHeightPx = gridHeightM * 1000 * scaleFactor;

  // Constrain position to keep object fully within grid
  const constrainedLeft = Math.max(0, Math.min(gridWidthPx - width, left));
  const constrainedTop = Math.max(0, Math.min(gridHeightPx - height, top));

  return {
    left: Math.round(constrainedLeft),
    top: Math.round(constrainedTop)
  };
}

/**
 * Constrains a rectangle's bounds to stay within the grid boundaries
 * @param bounds - Object bounds in mm
 * @param gridWidthM - Grid width in meters
 * @param gridHeightM - Grid height in meters
 * @returns Constrained bounds in mm
 */
export function constrainBoundsToGrid(
  bounds: Bounds,
  gridWidthM: number,
  gridHeightM: number
): Bounds {
  // Convert grid dimensions from meters to mm
  const gridWidthMm = gridWidthM * 1000;
  const gridHeightMm = gridHeightM * 1000;

  // Calculate constrained position
  const maxLeft = gridWidthMm - bounds.width;
  const maxTop = gridHeightMm - bounds.height;

  const constrainedLeft = Math.max(0, Math.min(maxLeft, bounds.left));
  const constrainedTop = Math.max(0, Math.min(maxTop, bounds.top));

  return {
    left: Math.round(constrainedLeft),
    top: Math.round(constrainedTop),
    width: bounds.width,
    height: bounds.height
  };
}

/**
 * Checks if a position is within grid boundaries
 * @param left - Left position in pixels
 * @param top - Top position in pixels
 * @param width - Width in pixels
 * @param height - Height in pixels
 * @param gridWidthM - Grid width in meters
 * @param gridHeightM - Grid height in meters
 * @param scaleFactor - Scale factor
 * @returns True if position is valid
 */
export function isWithinGrid(
  left: number,
  top: number,
  width: number,
  height: number,
  gridWidthM: number,
  gridHeightM: number,
  scaleFactor: number
): boolean {
  const gridWidthPx = gridWidthM * 1000 * scaleFactor;
  const gridHeightPx = gridHeightM * 1000 * scaleFactor;

  return (
    left >= 0 &&
    top >= 0 &&
    left + width <= gridWidthPx &&
    top + height <= gridHeightPx
  );
}
