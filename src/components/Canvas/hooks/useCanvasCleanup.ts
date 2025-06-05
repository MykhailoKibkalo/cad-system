// src/components/Canvas/hooks/useCanvasCleanup.ts
import { useEffect } from 'react';
import type { Canvas } from 'fabric';
import { useFloorStore } from '@/state/floorStore';

/**
 * Periodically cleans up ghost objects from the canvas
 * This helps prevent rendering artifacts from group/ungroup operations
 */
export default function useCanvasCleanup(canvas: Canvas | null) {
  useEffect(() => {
    if (!canvas) return;

    const cleanupGhostObjects = () => {
      const gridState = useFloorStore.getState().getActiveGridState();
      if (!gridState) return;

      // Get all valid IDs
      const validModuleIds = new Set(gridState.modules.map(m => m.id));
      const validCorridorIds = new Set(gridState.corridors.map(c => c.id));
      const validBalconyIds = new Set(gridState.balconies.map(b => b.id));
      const validBathroomPodIds = new Set(gridState.bathroomPods.map(bp => bp.id));
      const validGroupIds = new Set(gridState.groups.map(g => g.id));

      const toRemove: fabric.Object[] = [];
      
      canvas.getObjects().forEach(obj => {
        const objAny = obj as any;
        
        // Skip if object is part of a group
        if (objAny.group) return;
        
        // Check each object type
        if (objAny.isModule && !validModuleIds.has(objAny.isModule)) {
          console.log('🧹 Removing ghost module:', objAny.isModule);
          toRemove.push(obj);
        } else if (objAny.isCorridor && !validCorridorIds.has(objAny.isCorridor)) {
          console.log('🧹 Removing ghost corridor:', objAny.isCorridor);
          toRemove.push(obj);
        } else if (objAny.isBalcony && !validBalconyIds.has(objAny.isBalcony)) {
          console.log('🧹 Removing ghost balcony:', objAny.isBalcony);
          toRemove.push(obj);
        } else if (objAny.isBathroomPod && !validBathroomPodIds.has(objAny.isBathroomPod)) {
          console.log('🧹 Removing ghost bathroom pod:', objAny.isBathroomPod);
          toRemove.push(obj);
        } else if (objAny.isElementGroup && objAny.groupId && !validGroupIds.has(objAny.groupId)) {
          console.log('🧹 Removing ghost group:', objAny.groupId);
          toRemove.push(obj);
        }
      });

      if (toRemove.length > 0) {
        console.log(`🧹 Canvas cleanup removing ${toRemove.length} ghost objects`);
        toRemove.forEach(obj => canvas.remove(obj));
        canvas.requestRenderAll();
      }
    };

    // Run cleanup on certain events
    const handleMouseUp = () => {
      // Small delay to allow other operations to complete
      setTimeout(cleanupGhostObjects, 100);
    };

    canvas.on('mouse:up', handleMouseUp);
    
    // Also run cleanup periodically
    const intervalId = setInterval(cleanupGhostObjects, 5000);

    return () => {
      canvas.off('mouse:up', handleMouseUp);
      clearInterval(intervalId);
    };
  }, [canvas]);
}