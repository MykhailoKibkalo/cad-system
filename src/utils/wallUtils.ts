// src/utils/wallUtils.ts
import { WallEdge, WallPlacement } from '@/types/wall';

/**
 * Calculate wall position based on placement type
 */
export const calculateWallPosition = (
    modulePosition: { x: number; y: number },
    moduleSize: { width: number; height: number },
    edge: WallEdge,
    wallThickness: number,
    placement: WallPlacement,
    partialStart: number = 0,
    partialEnd: number = 0,
    extendStart: boolean = false,
    extendEnd: boolean = false,
    adjacentWalls?: {
      top?: any;
      right?: any;
      bottom?: any;
      left?: any;
    }
): { left: number; top: number; width: number; height: number; isInside: boolean } => {
  let left = 0;
  let top = 0;
  let width = 0;
  let height = 0;
  const isInside = placement === WallPlacement.INSIDE;

  // Calculate adjacent wall thicknesses for extensions
  const adjacentThickness = {
    top: adjacentWalls?.top?.enabled ? adjacentWalls.top.thickness : 0,
    right: adjacentWalls?.right?.enabled ? adjacentWalls.right.thickness : 0,
    bottom: adjacentWalls?.bottom?.enabled ? adjacentWalls.bottom.thickness : 0,
    left: adjacentWalls?.left?.enabled ? adjacentWalls.left.thickness : 0,
  };

  // Determine which walls are inside
  const insideWalls = {
    top: adjacentWalls?.top?.enabled && adjacentWalls.top.placement === WallPlacement.INSIDE,
    right: adjacentWalls?.right?.enabled && adjacentWalls.right.placement === WallPlacement.INSIDE,
    bottom: adjacentWalls?.bottom?.enabled && adjacentWalls.bottom.placement === WallPlacement.INSIDE,
    left: adjacentWalls?.left?.enabled && adjacentWalls.left.placement === WallPlacement.INSIDE,
  };

  switch (edge) {
    case 'top':
      // Base width calculation with partial offsets
      width = moduleSize.width * (1 - partialStart - partialEnd);

      // Base position calculation
      if (placement === WallPlacement.CENTER) {
        left = modulePosition.x + (moduleSize.width * partialStart);
        top = modulePosition.y - wallThickness / 2;
      } else if (placement === WallPlacement.INSIDE) {
        left = modulePosition.x + (moduleSize.width * partialStart);
        top = modulePosition.y;

        // Adjust for inside walls overlapping if not extending
        if (insideWalls.left && !extendStart) {
          left += adjacentThickness.left;
          width -= adjacentThickness.left;
        }
        if (insideWalls.right && !extendEnd) {
          width -= adjacentThickness.right;
        }
      } else if (placement === WallPlacement.OUTSIDE) {
        left = modulePosition.x + (moduleSize.width * partialStart);
        top = modulePosition.y - wallThickness;
      }

      // Handle extensions
      if (extendStart && adjacentThickness.left > 0) {
        if (placement === WallPlacement.INSIDE) {
          // For inside walls, adjust just enough to meet the corner
          // without extending outside the module boundary
          width += adjacentWalls?.left?.placement === WallPlacement.INSIDE ?
              0 : Math.min(adjacentThickness.left, wallThickness);
        } else {
          // For center/outside walls, extend fully
          const extension = Math.min(adjacentThickness.left, wallThickness);
          left -= extension;
          width += extension;
        }
      }

      if (extendEnd && adjacentThickness.right > 0) {
        if (placement === WallPlacement.INSIDE) {
          // For inside walls, adjust just enough to meet the corner
          // without extending outside the module boundary
          width += adjacentWalls?.right?.placement === WallPlacement.INSIDE ?
              0 : Math.min(adjacentThickness.right, wallThickness);
        } else {
          // For center/outside walls, extend fully
          const extension = Math.min(adjacentThickness.right, wallThickness);
          width += extension;
        }
      }

      height = wallThickness;
      break;

    case 'right':
      // Base height calculation with partial offsets
      height = moduleSize.height * (1 - partialStart - partialEnd);

      // Base position calculation
      if (placement === WallPlacement.CENTER) {
        left = modulePosition.x + moduleSize.width - wallThickness / 2;
        top = modulePosition.y + (moduleSize.height * partialStart);
      } else if (placement === WallPlacement.INSIDE) {
        left = modulePosition.x + moduleSize.width - wallThickness;
        top = modulePosition.y + (moduleSize.height * partialStart);

        // Adjust for inside walls overlapping if not extending
        if (insideWalls.top && !extendStart) {
          top += adjacentThickness.top;
          height -= adjacentThickness.top;
        }
        if (insideWalls.bottom && !extendEnd) {
          height -= adjacentThickness.bottom;
        }
      } else if (placement === WallPlacement.OUTSIDE) {
        left = modulePosition.x + moduleSize.width;
        top = modulePosition.y + (moduleSize.height * partialStart);
      }

      // Handle extensions
      if (extendStart && adjacentThickness.top > 0) {
        if (placement === WallPlacement.INSIDE) {
          // For inside walls, adjust just enough to meet the corner
          // without extending outside the module boundary
          height += adjacentWalls?.top?.placement === WallPlacement.INSIDE ?
              0 : Math.min(adjacentThickness.top, wallThickness);
        } else {
          // For center/outside walls, extend fully
          const extension = Math.min(adjacentThickness.top, wallThickness);
          top -= extension;
          height += extension;
        }
      }

      if (extendEnd && adjacentThickness.bottom > 0) {
        if (placement === WallPlacement.INSIDE) {
          // For inside walls, adjust just enough to meet the corner
          // without extending outside the module boundary
          height += adjacentWalls?.bottom?.placement === WallPlacement.INSIDE ?
              0 : Math.min(adjacentThickness.bottom, wallThickness);
        } else {
          // For center/outside walls, extend fully
          const extension = Math.min(adjacentThickness.bottom, wallThickness);
          height += extension;
        }
      }

      width = wallThickness;
      break;

    case 'bottom':
      // Base width calculation with partial offsets
      width = moduleSize.width * (1 - partialStart - partialEnd);

      // Base position calculation
      if (placement === WallPlacement.CENTER) {
        left = modulePosition.x + (moduleSize.width * partialStart);
        top = modulePosition.y + moduleSize.height - wallThickness / 2;
      } else if (placement === WallPlacement.INSIDE) {
        left = modulePosition.x + (moduleSize.width * partialStart);
        top = modulePosition.y + moduleSize.height - wallThickness;

        // Adjust for inside walls overlapping if not extending
        if (insideWalls.left && !extendStart) {
          left += adjacentThickness.left;
          width -= adjacentThickness.left;
        }
        if (insideWalls.right && !extendEnd) {
          width -= adjacentThickness.right;
        }
      } else if (placement === WallPlacement.OUTSIDE) {
        left = modulePosition.x + (moduleSize.width * partialStart);
        top = modulePosition.y + moduleSize.height;
      }

      // Handle extensions
      if (extendStart && adjacentThickness.left > 0) {
        if (placement === WallPlacement.INSIDE) {
          // For inside walls, adjust just enough to meet the corner
          // without extending outside the module boundary
          width += adjacentWalls?.left?.placement === WallPlacement.INSIDE ?
              0 : Math.min(adjacentThickness.left, wallThickness);
        } else {
          // For center/outside walls, extend fully
          const extension = Math.min(adjacentThickness.left, wallThickness);
          left -= extension;
          width += extension;
        }
      }

      if (extendEnd && adjacentThickness.right > 0) {
        if (placement === WallPlacement.INSIDE) {
          // For inside walls, adjust just enough to meet the corner
          // without extending outside the module boundary
          width += adjacentWalls?.right?.placement === WallPlacement.INSIDE ?
              0 : Math.min(adjacentThickness.right, wallThickness);
        } else {
          // For center/outside walls, extend fully
          const extension = Math.min(adjacentThickness.right, wallThickness);
          width += extension;
        }
      }

      height = wallThickness;
      break;

    case 'left':
      // Base height calculation with partial offsets
      height = moduleSize.height * (1 - partialStart - partialEnd);

      // Base position calculation
      if (placement === WallPlacement.CENTER) {
        left = modulePosition.x - wallThickness / 2;
        top = modulePosition.y + (moduleSize.height * partialStart);
      } else if (placement === WallPlacement.INSIDE) {
        left = modulePosition.x;
        top = modulePosition.y + (moduleSize.height * partialStart);

        // Adjust for inside walls overlapping if not extending
        if (insideWalls.top && !extendStart) {
          top += adjacentThickness.top;
          height -= adjacentThickness.top;
        }
        if (insideWalls.bottom && !extendEnd) {
          height -= adjacentThickness.bottom;
        }
      } else if (placement === WallPlacement.OUTSIDE) {
        left = modulePosition.x - wallThickness;
        top = modulePosition.y + (moduleSize.height * partialStart);
      }

      // Handle extensions
      if (extendStart && adjacentThickness.top > 0) {
        if (placement === WallPlacement.INSIDE) {
          // For inside walls, adjust just enough to meet the corner
          // without extending outside the module boundary
          height += adjacentWalls?.top?.placement === WallPlacement.INSIDE ?
              0 : Math.min(adjacentThickness.top, wallThickness);
        } else {
          // For center/outside walls, extend fully
          const extension = Math.min(adjacentThickness.top, wallThickness);
          top -= extension;
          height += extension;
        }
      }

      if (extendEnd && adjacentThickness.bottom > 0) {
        if (placement === WallPlacement.INSIDE) {
          // For inside walls, adjust just enough to meet the corner
          // without extending outside the module boundary
          height += adjacentWalls?.bottom?.placement === WallPlacement.INSIDE ?
              0 : Math.min(adjacentThickness.bottom, wallThickness);
        } else {
          // For center/outside walls, extend fully
          const extension = Math.min(adjacentThickness.bottom, wallThickness);
          height += extension;
        }
      }

      width = wallThickness;
      break;
  }

  return { left, top, width, height, isInside };
};
