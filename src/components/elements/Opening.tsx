import { fabric } from 'fabric';
import { Opening as OpeningType } from '@/types';

interface OpeningProps {
  opening: OpeningType;
  modulePosition: { x: number; y: number };
  moduleSize: { width: number; height: number };
  moduleRotation: number;
  canvas: fabric.Canvas;
}

export const createOpening = (props: OpeningProps): fabric.Rect => {
  const { opening, modulePosition, moduleSize, moduleRotation, canvas } = props;

  // Calculate position based on module position, wall, and distance along wall
  let left = 0;
  let top = 0;
  let width = opening.width;
  let height = opening.height;
  let angle = moduleRotation;

  // For unrotated module (0 degrees)
  if (moduleRotation === 0) {
    switch (opening.wall) {
      case 'top': // Wall 2 (spec p.3, line 9-10)
        left = modulePosition.x + opening.distanceAlongWall;
        top = modulePosition.y;
        break;
      case 'right': // Wall 3 (spec p.3, line 9-10)
        left = modulePosition.x + moduleSize.width - width;
        top = modulePosition.y + opening.distanceAlongWall;
        // Swap width and height for vertical walls
        [width, height] = [height, width];
        break;
      case 'bottom': // Wall 4 (spec p.3, line 9-10)
        left = modulePosition.x + opening.distanceAlongWall;
        top = modulePosition.y + moduleSize.height - height;
        break;
      case 'left': // Wall 1 (spec p.3, line 9-10)
        left = modulePosition.x;
        top = modulePosition.y + opening.distanceAlongWall;
        // Swap width and height for vertical walls
        [width, height] = [height, width];
        break;
    }
  } else {
    // Handle rotated modules - this is more complex
    // Calculate the center of the module
    const moduleCenterX = modulePosition.x + moduleSize.width / 2;
    const moduleCenterY = modulePosition.y + moduleSize.height / 2;

    // Rotation in radians
    const rotationRad = (moduleRotation * Math.PI) / 180;

    // Calculate positions based on wall and distance
    let wallX = 0, wallY = 0;
    let wallLength = 0;
    let openingOffset = 0;

    switch (opening.wall) {
      case 'top': // Wall 2
        wallX = modulePosition.x;
        wallY = modulePosition.y;
        wallLength = moduleSize.width;
        openingOffset = opening.distanceAlongWall;
        break;
      case 'right': // Wall 3
        wallX = modulePosition.x + moduleSize.width;
        wallY = modulePosition.y;
        wallLength = moduleSize.height;
        openingOffset = opening.distanceAlongWall;
        [width, height] = [height, width];
        angle += 90;
        break;
      case 'bottom': // Wall 4
        wallX = modulePosition.x;
        wallY = modulePosition.y + moduleSize.height;
        wallLength = moduleSize.width;
        openingOffset = opening.distanceAlongWall;
        angle += 180;
        break;
      case 'left': // Wall 1
        wallX = modulePosition.x;
        wallY = modulePosition.y;
        wallLength = moduleSize.height;
        openingOffset = opening.distanceAlongWall;
        [width, height] = [height, width];
        angle += 270;
        break;
    }

    // Adjust for rotation
    // This is a simplified approach and may need refinement
    const relativeX = openingOffset + width / 2 - moduleSize.width / 2;
    const relativeY = (opening.wall === 'top' || opening.wall === 'bottom')
                     ? (opening.wall === 'top' ? -height/2 : moduleSize.height - height/2)
                     : (opening.wall === 'left' ? -width/2 : moduleSize.width - width/2);

    const rotatedX = relativeX * Math.cos(rotationRad) - relativeY * Math.sin(rotationRad);
    const rotatedY = relativeX * Math.sin(rotationRad) + relativeY * Math.cos(rotationRad);

    left = moduleCenterX + rotatedX - width / 2;
    top = moduleCenterY + rotatedY - height / 2;
  }

  // Adjust for y-offset
  if (opening.wall === 'top' || opening.wall === 'bottom') {
    top += (opening.wall === 'top' ? 1 : -1) * opening.yOffset;
  } else {
    left += (opening.wall === 'left' ? 1 : -1) * opening.yOffset;
  }

  // Create the opening rectangle with appropriate styling
  const style = opening.type === 'door' ? {
    fill: 'white',
    stroke: '#333',
    strokeWidth: 2,
  } : {
    fill: 'rgba(200, 230, 255, 0.5)', // Light blue for windows
    stroke: '#333',
    strokeWidth: 1,
  };

  const rect = new fabric.Rect({
    left,
    top,
    width,
    height,
    angle,
    ...style,
    selectable: false, // Not directly selectable
    evented: false, // Doesn't receive events
  });

  // Store data with opening
  rect.data = {
    type: 'opening',
    openingType: opening.type,
    id: opening.id,
    wall: opening.wall,
  };

  // Add to canvas
  canvas.add(rect);

  // Openings should be visible, so bring to front
  canvas.bringToFront(rect);

  return rect;
};

export const updateOpening = (
  canvas: fabric.Canvas,
  opening: OpeningType,
  modulePosition: { x: number; y: number },
  moduleSize: { width: number; height: number },
  moduleRotation: number
): void => {
  // Find existing opening objects
  const openingObjects = canvas.getObjects().filter(
    obj => obj.data?.type === 'opening' && obj.data?.id === opening.id
  );

  // Remove existing opening objects
  openingObjects.forEach(obj => canvas.remove(obj));

  // Create new opening with updated properties
  createOpening({
    opening,
    modulePosition,
    moduleSize,
    moduleRotation,
    canvas,
  });

  canvas.renderAll();
};

export const removeOpening = (
  canvas: fabric.Canvas,
  openingId: string
): void => {
  // Find existing opening objects
  const openingObjects = canvas.getObjects().filter(
    obj => obj.data?.type === 'opening' && obj.data?.id === openingId
  );

  // Remove opening objects
  openingObjects.forEach(obj => canvas.remove(obj));

  canvas.renderAll();
};
