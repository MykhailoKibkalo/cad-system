// src/components/Canvas/hooks/useFloorElements.ts
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

    // For simplicity, show all elements on every floor
    // This can be refined later with proper floor-based filtering
    const modules = allModules;
    const moduleIds = new Set(modules.map(m => m.id));

    return {
      modules,
      openings: allOpenings.filter(opening => moduleIds.has(opening.moduleId)),
      balconies: allBalconies.filter(balcony => moduleIds.has(balcony.moduleId)),
      bathroomPods: allBathroomPods.filter(pod => moduleIds.has(pod.moduleId)),
      corridors: allCorridors,
      roofs: allRoofs as Roof[],
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
