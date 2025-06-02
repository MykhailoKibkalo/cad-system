// src/hooks/useFloorElements.ts
import { useMemo } from 'react';
import { useObjectStore } from '@/state/objectStore';
import { Balcony, BathroomPod, Corridor, Module, Opening, Roof } from '@/types/geometry';
import { useFloorStore } from '@/state/floorStore';

interface FloorElementsData {
  modules: Module[];
  openings: Opening[];
  balconies: Balcony[];
  bathroomPods: BathroomPod[];
  corridors: Corridor[];
  roofs: Roof[];
}

export function useFloorElements(floorId?: string): FloorElementsData {
  const {
    modules: allModules,
    openings: allOpenings,
    balconies: allBalconies,
    bathroomPods: allBathroomPods,
    corridors: allCorridors,
    roofs: allRoofs,
  } = useObjectStore();

  const { currentFloorId, floors } = useFloorStore();
  const targetFloorId = floorId ?? currentFloorId;

  return useMemo(() => {
    if (!targetFloorId) {
      return {
        modules: [],
        openings: [],
        balconies: [],
        bathroomPods: [],
        corridors: [],
        roofs: [],
      };
    }

    // Get floor index for this floor ID
    const floorIndex = floors.findIndex(f => f.id === targetFloorId);
    const targetFloorNumber = floorIndex + 1; // Floor numbers start at 1

    if (floorIndex === -1) {
      return {
        modules: [],
        openings: [],
        balconies: [],
        bathroomPods: [],
        corridors: [],
        roofs: [],
      };
    }

    // Filter modules for the current floor
    // Since modules can be stacked (stackedFloors), we need to check if the target floor
    // falls within the range of this module's floors
    const modules = allModules.filter(module => {
      const moduleStartFloor = Math.floor(module.zOffset / (module.height || 3100)) + 1;
      const moduleEndFloor = moduleStartFloor + module.stackedFloors - 1;
      return targetFloorNumber >= moduleStartFloor && targetFloorNumber <= moduleEndFloor;
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
    const corridors = allCorridors.filter(corridor => corridor.floor === targetFloorNumber);

    // Filter roofs for the current floor level
    const roofs = allRoofs.filter((roof: any) => roof.level === targetFloorNumber);

    return {
      modules,
      openings,
      balconies,
      bathroomPods,
      corridors,
      roofs: roofs as Roof[], // Type assertion since allRoofs is currently []
    };
  }, [allModules, allOpenings, allBalconies, allBathroomPods, allCorridors, allRoofs, targetFloorId, floors]);
}

// Helper function to check if there are any elements on the current floor
export function useHasFloorElements(floorId?: string): boolean {
  const elements = useFloorElements(floorId);

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
