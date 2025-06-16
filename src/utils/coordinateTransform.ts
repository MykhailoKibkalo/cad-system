// src/utils/coordinateTransform.ts

/**
 * Utility functions for transforming coordinates between top-left and bottom-left origin systems
 * 
 * In the top-left system (canvas default):
 * - Origin (0,0) is at top-left
 * - Y increases downward
 * 
 * In the bottom-left system (desired):
 * - Origin (0,0) is at bottom-left
 * - Y increases upward
 */

import { useCanvasStore } from '@/state/canvasStore';

/**
 * Convert Y coordinate from top-left origin to bottom-left origin
 * @param topY - Y coordinate in top-left system (pixels)
 * @param canvasHeight - Total canvas height in pixels
 * @returns Y coordinate in bottom-left system
 */
export function topToBottomY(topY: number, canvasHeight: number): number {
  return Math.round(canvasHeight - topY);
}

/**
 * Convert Y coordinate from bottom-left origin to top-left origin
 * @param bottomY - Y coordinate in bottom-left system (pixels)
 * @param canvasHeight - Total canvas height in pixels
 * @returns Y coordinate in top-left system (for canvas rendering)
 */
export function bottomToTopY(bottomY: number, canvasHeight: number): number {
  return Math.round(canvasHeight - bottomY);
}

/**
 * Convert Y coordinate from top-left origin to bottom-left origin (in mm)
 * @param topYMm - Y coordinate in top-left system (mm)
 * @param gridHeightM - Grid height in meters
 * @returns Y coordinate in bottom-left system (mm)
 */
export function topToBottomYMm(topYMm: number, gridHeightM: number): number {
  const gridHeightMm = gridHeightM * 1000;
  return Math.round(gridHeightMm - topYMm);
}

/**
 * Convert Y coordinate from bottom-left origin to top-left origin (in mm)
 * @param bottomYMm - Y coordinate in bottom-left system (mm)
 * @param gridHeightM - Grid height in meters
 * @returns Y coordinate in top-left system (mm)
 */
export function bottomToTopYMm(bottomYMm: number, gridHeightM: number): number {
  const gridHeightMm = gridHeightM * 1000;
  return Math.round(gridHeightMm - bottomYMm);
}

/**
 * Transform a rectangle's top position from top-left to bottom-left origin
 * @param topY - Top edge Y in top-left system (pixels)
 * @param height - Rectangle height (pixels)
 * @param canvasHeight - Total canvas height (pixels)
 * @returns Bottom edge Y in bottom-left system
 */
export function rectTopToBottomY(topY: number, height: number, canvasHeight: number): number {
  // In top-left: top edge is at topY
  // In bottom-left: bottom edge should be at (canvasHeight - topY - height)
  // So the Y coordinate (bottom edge) in bottom-left is:
  return Math.round(canvasHeight - topY - height);
}

/**
 * Transform a rectangle's bottom position from bottom-left to top-left origin
 * @param bottomY - Bottom edge Y in bottom-left system (pixels)
 * @param height - Rectangle height (pixels)
 * @param canvasHeight - Total canvas height (pixels)
 * @returns Top edge Y in top-left system
 */
export function rectBottomToTopY(bottomY: number, height: number, canvasHeight: number): number {
  // In bottom-left: bottom edge is at bottomY
  // In top-left: top edge should be at (canvasHeight - bottomY - height)
  return Math.round(canvasHeight - bottomY - height);
}

/**
 * Transform a rectangle's top position from top-left to bottom-left origin (in mm)
 * @param topYMm - Top edge Y in top-left system (mm)
 * @param heightMm - Rectangle height (mm)
 * @param gridHeightM - Grid height in meters
 * @returns Bottom edge Y in bottom-left system (mm)
 */
export function rectTopToBottomYMm(topYMm: number, heightMm: number, gridHeightM: number): number {
  const gridHeightMm = gridHeightM * 1000;
  return Math.round(gridHeightMm - topYMm - heightMm);
}

/**
 * Transform a rectangle's bottom position from bottom-left to top-left origin (in mm)
 * @param bottomYMm - Bottom edge Y in bottom-left system (mm)
 * @param heightMm - Rectangle height (mm)
 * @param gridHeightM - Grid height in meters
 * @returns Top edge Y in top-left system (mm)
 */
export function rectBottomToTopYMm(bottomYMm: number, heightMm: number, gridHeightM: number): number {
  const gridHeightMm = gridHeightM * 1000;
  return Math.round(gridHeightMm - bottomYMm - heightMm);
}