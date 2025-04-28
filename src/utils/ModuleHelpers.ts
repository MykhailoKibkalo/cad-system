import { fabric } from 'fabric';
import { attachChild } from './attachChild';
import { v4 as uuid } from 'uuid'; // npm i uuid

/**
 * Creates a module with label
 * @param left Left position
 * @param top Top position
 * @param width Width
 * @param height Height
 * @param name Module name
 * @returns Fabric group with rectangle and label
 */
export const createModule = (
    canvas: fabric.Canvas,
    left: number,
    top: number,
    width: number,
    height: number,
    name: string
): fabric.Group => {
  // Create the rectangle for the module
  const rect = new fabric.Rect({
    left: 0,
    top: 0,
    width,
    height,
    fill: '#f5f5ff',
    stroke: '#333',
    strokeWidth: 1,
    originX: 'left',
    originY: 'top',
    strokeUniform: true, // constant border width
  });

  // Create the label text
  const label = new fabric.Text(name, {
    fontSize: width < 60 || height < 60 ? 10 : 14,
    left: width / 2,
    top: height / 2,
    originX: 'center',
    originY: 'center',
    selectable: false,
    evented: false,
  });

  // Create the group
  const group = new fabric.Group([rect, label], {
    left,
    top,
    originX: 'left',
    originY: 'top',
    hasControls: true,
  });

  // Add UUID to the group
  group.id = uuid();

  // Add metadata to the group
  group.data = {
    type: 'module',
    name,
    width,
    length: height,
    x0: left,
    y0: top,
    rotation: 0,
  };

  canvas.add(group);
  return group;
};

/**
 * Creates an opening on a module wall
 */
export const createOpening = (
    canvas: fabric.Canvas,
    parent: fabric.Group,
    wallSide: number,
    width: number,
    height: number,
    distance: number,
    yOffset: number
): fabric.Rect => {
  // Calculate position based on wall side and distance
  let left = 0;
  let top = 0;

  const moduleLeft = parent.left!;
  const moduleTop = parent.top!;
  const moduleWidth = parent.width!;
  const moduleHeight = parent.height!;

  switch (wallSide) {
    case 1: // Bottom wall
      left = moduleLeft + distance;
      top = moduleTop + moduleHeight - height;
      break;
    case 2: // Right wall
      left = moduleLeft + moduleWidth - width;
      top = moduleTop + distance;
      break;
    case 3: // Top wall
      left = moduleLeft + distance;
      top = moduleTop + yOffset;
      break;
    case 4: // Left wall
      left = moduleLeft + yOffset;
      top = moduleTop + distance;
      break;
  }

  // Create the opening rectangle
  const opening = new fabric.Rect({
    left,
    top,
    width,
    height,
    fill: '#cfe',
    stroke: '#333',
    strokeWidth: 1,
    strokeUniform: true,
  });

  // Add metadata
  opening.data = {
    type: 'opening',
    moduleId: parent.data.name,
    wallSide,
    width,
    height,
    distance,
    y_offset: yOffset,
  };

  canvas.add(opening);
  attachChild(parent, opening);
  return opening;
};

/**
 * Creates a balcony attached to a module wall
 */
export const createBalcony = (
    canvas: fabric.Canvas,
    parent: fabric.Group,
    wallSide: number,
    width: number,
    length: number,
    distance: number,
    name: string
): fabric.Rect => {
  // Calculate position based on wall side and distance
  let left = 0;
  let top = 0;

  const moduleLeft = parent.left!;
  const moduleTop = parent.top!;
  const moduleWidth = parent.width!;
  const moduleHeight = parent.height!;

  switch (wallSide) {
    case 1: // Bottom wall
      left = moduleLeft + distance;
      top = moduleTop + moduleHeight;
      break;
    case 2: // Right wall
      left = moduleLeft + moduleWidth;
      top = moduleTop + distance;
      break;
    case 3: // Top wall
      left = moduleLeft + distance;
      top = moduleTop - length;
      break;
    case 4: // Left wall
      left = moduleLeft - length;
      top = moduleTop + distance;
      break;
  }

  // Create the balcony rectangle
  const balcony = new fabric.Rect({
    left,
    top,
    width: wallSide === 2 || wallSide === 4 ? length : width,
    height: wallSide === 1 || wallSide === 3 ? length : width,
    fill: '#def',
    stroke: '#08f',
    strokeWidth: 1,
    strokeUniform: true,
  });

  // Add metadata
  balcony.data = {
    type: 'balcony',
    moduleId: parent.data.name,
    wallSide,
    width,
    length,
    distance,
    name,
  };

  canvas.add(balcony);
  attachChild(parent, balcony);
  return balcony;
};

/**
 * Creates a bathroom pod inside a module
 */
export const createBathroomPod = (
    canvas: fabric.Canvas,
    parent: fabric.Group,
    width: number,
    length: number,
    xOffset: number,
    yOffset: number,
    id: string
): fabric.Rect => {
  // Calculate position
  const left = parent.left! + xOffset;
  const top = parent.top! + yOffset;

  // Create the bathroom pod rectangle
  const bathroomPod = new fabric.Rect({
    left,
    top,
    width,
    height: length,
    fill: '#fff6cc',
    stroke: '#333',
    strokeWidth: 1,
    strokeUniform: true,
  });

  // Add metadata
  bathroomPod.data = {
    type: 'bathroom',
    moduleId: parent.data.name,
    width,
    length,
    x_offset: xOffset,
    y_offset: yOffset,
    id,
  };

  canvas.add(bathroomPod);
  attachChild(parent, bathroomPod);
  return bathroomPod;
};
