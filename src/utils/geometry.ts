import { fabric } from 'fabric';

export const snap10 = (v: number) => Math.round(v / 10) * 10;

export const placeOpening = (
    wall: 1 | 2 | 3 | 4,
    mod: fabric.Rect,
    rb: fabric.Rect // rubber-band final size
) => {
  switch (wall) {
    case 1: // bottom
      rb.set({ left: rb.left, top: mod.top! + mod.height! - rb.height });
      break;
    case 2: // right
      rb.set({ left: mod.left! + mod.width! - rb.width, top: rb.top });
      break;
    case 3: // top
      rb.set({ left: rb.left, top: mod.top! });
      break;
    case 4: // left
      rb.set({ left: mod.left!, top: rb.top });
      break;
  }
  rb.set({ left: snap10(rb.left!), top: snap10(rb.top!) });
};

export const clampPodInside = (pod: fabric.Rect, mod: fabric.Rect) => {
  pod.set({
    left: Math.min(Math.max(pod.left!, mod.left!), mod.left! + mod.width! - pod.width!),
    top: Math.min(Math.max(pod.top!, mod.top!), mod.top! + mod.height! - pod.height!),
  });
  pod.set({ left: snap10(pod.left!), top: snap10(pod.top!) });
};

/**
 * Checks if two rectangles intersect
 */
export const checkIntersection = (
    rect1: { left: number; top: number; width: number; height: number },
    rect2: { left: number; top: number; width: number; height: number }
): boolean => {
  return (
      rect1.left < rect2.left + rect2.width &&
      rect1.left + rect1.width > rect2.left &&
      rect1.top < rect2.top + rect2.height &&
      rect1.top + rect1.height > rect2.top
  );
};

/**
 * Places a balcony outside a module wall
 */
export const placeBalcony = (
    wall: 1 | 2 | 3 | 4,
    mod: fabric.Rect,
    balcony: fabric.Rect,
    distance: number
) => {
  switch (wall) {
    case 1: // Bottom wall
      balcony.set({
        left: mod.left! + distance,
        top: mod.top! + mod.height!,
        width: balcony.width,
        height: balcony.height,
      });
      break;
    case 2: // Right wall
      balcony.set({
        left: mod.left! + mod.width!,
        top: mod.top! + distance,
        width: balcony.height, // Swap for vertical wall
        height: balcony.width, // Swap for vertical wall
      });
      break;
    case 3: // Top wall
      balcony.set({
        left: mod.left! + distance,
        top: mod.top! - balcony.height,
        width: balcony.width,
        height: balcony.height,
      });
      break;
    case 4: // Left wall
      balcony.set({
        left: mod.left! - balcony.height, // Swap for vertical wall
        top: mod.top! + distance,
        width: balcony.height, // Swap for vertical wall
        height: balcony.width, // Swap for vertical wall
      });
      break;
  }
};
