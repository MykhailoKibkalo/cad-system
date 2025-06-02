// src/hooks/useFloorElements.ts
import { useMemo } from 'react';
import { useObjectStore } from '@/state/objectStore';
import { useCanvasStore } from '@/state/canvasStore';
import { useFloorStore } from '@/state/floorStore';
import { Balcony, BathroomPod, Corridor, Module, Opening, Roof } from '@/types/geometry';

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

  const selectedFloor = useFloorStore(s => s.getSelectedFloor());
  const targetFloorId = floorId ?? selectedFloor?.id;

  return useMemo(() => {
    // For now, show all modules regardless of floor until we implement floor-specific module filtering
    // TODO: Implement proper floor filtering for modules based on the new floor system
    const modules = allModules;

    // Get module IDs for filtering related elements
    const moduleIds = new Set(modules.map(m => m.id));

    // Filter openings that belong to modules on this floor
    const openings = allOpenings.filter(opening => moduleIds.has(opening.moduleId));

    // Filter balconies that belong to modules on this floor
    const balconies = allBalconies.filter(balcony => moduleIds.has(balcony.moduleId));

    // Filter bathroom pods that belong to modules on this floor
    const bathroomPods = allBathroomPods.filter(pod => moduleIds.has(pod.moduleId));

    // Filter corridors for the current floor
    // Handle both old numeric floors and new string floor IDs
    const corridors = allCorridors.filter(corridor => {
      const corridorFloor = typeof corridor.floor === 'string' ? corridor.floor : corridor.floor.toString();
      return targetFloorId && corridorFloor === targetFloorId;
    });

    // Filter roofs for the current floor level (keep as numeric for now)
    const roofs = allRoofs.filter((roof: any) => roof.level === selectedFloor?.height);

    return {
      modules,
      openings,
      balconies,
      bathroomPods,
      corridors,
      roofs: roofs as Roof[], // Type assertion since allRoofs is currently []
    };
  }, [allModules, allOpenings, allBalconies, allBathroomPods, allCorridors, allRoofs, targetFloorId]);
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
