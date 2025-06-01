// src/hooks/useFloorElements.ts
import { useMemo } from 'react';
import { useObjectStore } from '@/state/objectStore';
import { useCanvasStore } from '@/state/canvasStore';
import { Balcony, BathroomPod, Corridor, Module, Opening, Roof } from '@/types/geometry';

interface FloorElementsData {
  modules: Module[];
  openings: Opening[];
  balconies: Balcony[];
  bathroomPods: BathroomPod[];
  corridors: Corridor[];
  roofs: Roof[];
}

export function useFloorElements(floor?: number): FloorElementsData {
  const {
    modules: allModules,
    openings: allOpenings,
    balconies: allBalconies,
    bathroomPods: allBathroomPods,
    corridors: allCorridors,
    roofs: allRoofs,
  } = useObjectStore();

  const { currentFloor } = useCanvasStore();
  const targetFloor = floor ?? currentFloor;

  return useMemo(() => {
    // Filter modules for the current floor
    // Since modules can be stacked (stackedFloors), we need to check if the target floor
    // falls within the range of this module's floors
    const modules = allModules.filter(module => {
      const moduleStartFloor = Math.floor(module.zOffset / (module.height || 3100)) + 1;
      const moduleEndFloor = moduleStartFloor + module.stackedFloors - 1;
      return targetFloor >= moduleStartFloor && targetFloor <= moduleEndFloor;
    });

    // Get module IDs for filtering related elements
    const moduleIds = new Set(modules.map(m => m.id));

    // Filter openings that belong to modules on this floor
    const openings = allOpenings.filter(opening => moduleIds.has(opening.moduleId));

    // Filter balconies that belong to modules on this floor
    const balconies = allBalconies.filter(balcony => moduleIds.has(balcony.moduleId));

    // Filter bathroom pods that belong to modules on this floor
    const bathroomPods = allBathroomPods.filter(pod => moduleIds.has(pod.moduleId));

    // Filter corridors for the current floor
    const corridors = allCorridors.filter(corridor => corridor.floor === targetFloor);

    // Filter roofs for the current floor level
    const roofs = allRoofs.filter((roof: any) => roof.level === targetFloor);

    return {
      modules,
      openings,
      balconies,
      bathroomPods,
      corridors,
      roofs: roofs as Roof[], // Type assertion since allRoofs is currently []
    };
  }, [allModules, allOpenings, allBalconies, allBathroomPods, allCorridors, allRoofs, targetFloor]);
}

// Helper function to check if there are any elements on the current floor
export function useHasFloorElements(floor?: number): boolean {
  const elements = useFloorElements(floor);

  return useMemo(() => {
    return (
      elements.modules.length > 0 ||
      elements.openings.length > 0 ||
      elements.balconies.length > 0 ||
      elements.bathroomPods.length > 0 ||
      elements.corridors.length > 0 ||
      elements.roofs.length > 0
    );
  }, [elements]);
}
