// src/components/Canvas/hooks/useFloorElements.ts
// Reactive hooks for floor-specific data access
import { useFloorStore } from '@/state/floorStore';
import { Module, Opening, Corridor, Balcony, BathroomPod } from '@/types/geometry';
import type { PdfData, CanvasState } from '@/state/floorStore';

interface FloorElementsData {
  modules: Module[];
  openings: Opening[];
  balconies: Balcony[];
  bathroomPods: BathroomPod[];
  corridors: Corridor[];
  roofs: []; // Keep for compatibility
}

/**
 * Hook that provides reactive access to all elements for the current floor
 * This ensures components re-render when floor data changes
 */
export function useCurrentFloorElements() {
  const gridState = useFloorStore(s => s.getActiveGridState());
  
  return {
    modules: gridState?.modules || [],
    openings: gridState?.openings || [],
    corridors: gridState?.corridors || [],
    balconies: gridState?.balconies || [],
    bathroomPods: gridState?.bathroomPods || [],
  };
}

/**
 * Legacy hook for compatibility - now uses reactive floor data
 */
export function useFloorElements(floorId?: string): FloorElementsData {
  const selectedFloorId = useFloorStore(s => s.selectedFloorId);
  const floors = useFloorStore(s => s.floors);
  
  // Get target floor data
  const targetFloorId = floorId ?? selectedFloorId;
  const targetFloor = floors.find(f => f.id === targetFloorId);
  const gridState = targetFloor?.gridState;

  return {
    modules: gridState?.modules || [],
    openings: gridState?.openings || [],
    balconies: gridState?.balconies || [],
    bathroomPods: gridState?.bathroomPods || [],
    corridors: gridState?.corridors || [],
    roofs: [], // Keep for compatibility
  };
}

/**
 * Hook that provides reactive access to modules for the current floor
 */
export function useCurrentFloorModules(): Module[] {
  const gridState = useFloorStore(s => s.getActiveGridState());
  return gridState?.modules || [];
}

/**
 * Hook that provides reactive access to openings for the current floor
 */
export function useCurrentFloorOpenings(): Opening[] {
  const gridState = useFloorStore(s => s.getActiveGridState());
  return gridState?.openings || [];
}

/**
 * Hook that provides reactive access to corridors for the current floor
 */
export function useCurrentFloorCorridors(): Corridor[] {
  const gridState = useFloorStore(s => s.getActiveGridState());
  return gridState?.corridors || [];
}

/**
 * Hook that provides reactive access to balconies for the current floor
 */
export function useCurrentFloorBalconies(): Balcony[] {
  const gridState = useFloorStore(s => s.getActiveGridState());
  return gridState?.balconies || [];
}

/**
 * Hook that provides reactive access to bathroom pods for the current floor
 */
export function useCurrentFloorBathroomPods(): BathroomPod[] {
  const gridState = useFloorStore(s => s.getActiveGridState());
  return gridState?.bathroomPods || [];
}

/**
 * Hook that provides reactive access to PDF data for the current floor
 */
export function useCurrentFloorPdfData(): PdfData | null {
  const gridState = useFloorStore(s => s.getActiveGridState());
  return gridState?.pdfData || null;
}

/**
 * Hook that provides reactive access to canvas state for the current floor
 */
export function useCurrentFloorCanvasState(): CanvasState | null {
  const gridState = useFloorStore(s => s.getActiveGridState());
  return gridState?.canvasState || null;
}

/**
 * Hook that provides reactive access to grid settings for the current floor
 */
export function useCurrentFloorGridSettings() {
  const gridState = useFloorStore(s => s.getActiveGridState());
  return {
    gridWidthM: gridState?.gridWidthM || 100,
    gridHeightM: gridState?.gridHeightM || 100,
  };
}

/**
 * Hook that provides the current selected floor info
 */
export function useCurrentFloor() {
  const selectedFloorId = useFloorStore(s => s.selectedFloorId);
  const floors = useFloorStore(s => s.floors);
  return floors.find(f => f.id === selectedFloorId) || null;
}

// Helper function to check if there are any elements on the current floor
export function useHasFloorElements(floorId?: string): boolean {
  const elements = useFloorElements(floorId);

  return (
    elements.modules.length > 0 ||
    elements.openings.length > 0 ||
    elements.balconies.length > 0 ||
    elements.bathroomPods.length > 0 ||
    elements.corridors.length > 0
  );
}
