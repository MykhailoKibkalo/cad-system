export function rotatePointAroundOrigin(
  pointX: number,
  pointY: number,
  originX: number,
  originY: number,
  angleDeg: number
): { x: number; y: number } {
  const angleRad = (angleDeg * Math.PI) / 180;
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);

  const translatedX = pointX - originX;
  const translatedY = pointY - originY;

  const rotatedX = translatedX * cos - translatedY * sin;
  const rotatedY = translatedX * sin + translatedY * cos;

  return {
    x: rotatedX + originX,
    y: rotatedY + originY
  };
}

export function transformPointByRotation(
  x: number,
  y: number,
  moduleWidth: number,
  moduleLength: number,
  rotation: number
): { x: number; y: number } {
  switch (rotation) {
    case 0:
      return { x, y };
    case 90:
      return { x: y, y: moduleWidth - x };
    case 180:
      return { x: moduleWidth - x, y: moduleLength - y };
    case 270:
      return { x: moduleLength - y, y: x };
    default:
      return { x, y };
  }
}


export function transformWallSide(originalSide: number, rotation: number): number {
  const sideMap: { [key: number]: { [key: number]: number } } = {
    0: { 1: 1, 2: 2, 3: 3, 4: 4 },
    90: { 1: 4, 2: 1, 3: 2, 4: 3 },
    180: { 1: 3, 2: 4, 3: 1, 4: 2 },
    270: { 1: 2, 2: 3, 3: 4, 4: 1 },
  };

  return sideMap[rotation]?.[originalSide] || originalSide;
}


export function getRotatedDimensions(
  width: number,
  length: number,
  rotation: number
): { width: number; length: number } {
  if (rotation === 90 || rotation === 270) {
    return { width: length, length: width };
  }
  return { width, length };
}


export function transformBathroomPodPosition(
  xOffset: number,
  yOffset: number,
  podWidth: number,
  podLength: number,
  moduleWidth: number,
  moduleLength: number,
  rotation: number
): { x_offset: number; y_offset: number; width: number; length: number } {
  const transformed = transformPointByRotation(xOffset, yOffset, moduleWidth, moduleLength, rotation);

  const rotatedPodDims = getRotatedDimensions(podWidth, podLength, rotation);

  switch (rotation) {
    case 0:
      return { x_offset: transformed.x, y_offset: transformed.y, ...rotatedPodDims };
    case 90:
      return {
        x_offset: transformed.x,
        y_offset: transformed.y - rotatedPodDims.length,
        ...rotatedPodDims
      };
    case 180:
      return {
        x_offset: transformed.x - rotatedPodDims.width,
        y_offset: transformed.y - rotatedPodDims.length,
        ...rotatedPodDims
      };
    case 270:
      return {
        x_offset: transformed.x - rotatedPodDims.width,
        y_offset: transformed.y,
        ...rotatedPodDims
      };
    default:
      return { x_offset: xOffset, y_offset: yOffset, width: podWidth, length: podLength };
  }
}


export function transformDistanceAlongWall(
  distanceAlongWall: number,
  originalSide: number,
  moduleWidth: number,
  moduleLength: number,
  rotation: number
): number {
  const originalWallLength = (originalSide === 1 || originalSide === 3) ? moduleWidth : moduleLength;

  switch (rotation) {
    case 0:
      return distanceAlongWall;
    case 90:
    case 270:
      const newSide = transformWallSide(originalSide, rotation);
      const shouldReverse = (rotation === 90 && (originalSide === 1 || originalSide === 3)) ||
                           (rotation === 270 && (originalSide === 2 || originalSide === 4));
      return shouldReverse ? originalWallLength - distanceAlongWall : distanceAlongWall;
    case 180:
      return originalWallLength - distanceAlongWall;
    default:
      return distanceAlongWall;
  }
}
