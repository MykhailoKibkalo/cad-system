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
