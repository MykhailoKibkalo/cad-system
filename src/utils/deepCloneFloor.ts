// src/utils/deepCloneFloor.ts

import { IFloor, IModule, IOpening, IBalcony, IBathroomPod } from '../types/floor';

export function deepCloneFloor(original: IFloor): IFloor {
  return {
    floorNumber: original.floorNumber,
    pdfUrl: original.pdfUrl,
    pdfX0: original.pdfX0,
    pdfY0: original.pdfY0,
    pdfWidth: original.pdfWidth,
    pdfHeight: original.pdfHeight,
    modules: original.modules.map((module: IModule) => ({
      moduleId: module.moduleId,
      width: module.width,
      length: module.length,
      height: module.height,
      x0: module.x0,
      y0: module.y0,
      zOffset: module.zOffset,
      rotation: module.rotation,
      // Deep-copy nested arrays
      openings: module.openings.map((o: IOpening) => ({ ...o })),
      balconies: module.balconies.map((b: IBalcony) => ({ ...b })),
      bathroomPods: module.bathroomPods.map((bp: IBathroomPod) => ({ ...bp })),
    })),
  };
}