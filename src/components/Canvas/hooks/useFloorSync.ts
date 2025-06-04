// src/components/Canvas/hooks/useFloorSync.ts
import { useEffect, useRef } from 'react';
import { Canvas } from 'fabric';
import { useFloorStore } from '@/state/floorStore';
import { useCanvasStore } from '@/state/canvasStore';

export default function useFloorSync(canvas: Canvas | null) {
  const selectedFloorId = useFloorStore(s => s.selectedFloorId);
  const updateActiveCanvasState = useFloorStore(s => s.updateActiveCanvasState);
  const getActiveCanvasState = useFloorStore(s => s.getActiveCanvasState);
  const previousFloorIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!canvas) return;
    
    // Initialize previous floor ID on first mount
    if (previousFloorIdRef.current === null) {
      previousFloorIdRef.current = selectedFloorId;
      
      // On first mount, restore canvas state from active floor
      const canvasState = getActiveCanvasState();
      if (canvasState) {
        // Restore zoom and pan
        const transform: [number, number, number, number, number, number] = [
          canvasState.zoomLevel, 0, 0, 
          canvasState.zoomLevel, 
          canvasState.panX, 
          canvasState.panY
        ];
        canvas.setViewportTransform(transform);
        
        // Update global canvas store for compatibility
        useCanvasStore.getState().setZoomLevel(canvasState.zoomLevel);
        useCanvasStore.getState().setPan(canvasState.panX, canvasState.panY);
        useCanvasStore.getState().setGridSize(canvasState.gridSizeMm);
        useCanvasStore.getState().setSnapMode(canvasState.snapMode);
        useCanvasStore.getState().setElementGapMm(canvasState.elementGapMm);
      }
      
      return;
    }
    
    // Only process if floor actually changed
    if (previousFloorIdRef.current !== selectedFloorId) {
      console.log(`🏢 Floor changed from ${previousFloorIdRef.current} to ${selectedFloorId}`);
      
      // Debug: Check current floor data before switching
      const floorStore = useFloorStore.getState();
      const currentFloor = floorStore.floors.find(f => f.id === previousFloorIdRef.current);
      const targetFloor = floorStore.floors.find(f => f.id === selectedFloorId);
      
      console.log(`🏢 Current floor (${previousFloorIdRef.current}) data:`, {
        exists: !!currentFloor,
        groups: currentFloor?.gridState?.groups?.length || 0,
        modules: currentFloor?.gridState?.modules?.length || 0,
        groupDetails: currentFloor?.gridState?.groups || []
      });
      
      console.log(`🏢 Target floor (${selectedFloorId}) data:`, {
        exists: !!targetFloor,
        groups: targetFloor?.gridState?.groups?.length || 0,
        modules: targetFloor?.gridState?.modules?.length || 0,
        groupDetails: targetFloor?.gridState?.groups || []
      });
      
      // 1. Save current canvas state to the previous floor
      if (previousFloorIdRef.current) {
        const vpt = canvas.viewportTransform || [1, 0, 0, 1, 0, 0];
        const currentCanvasState = {
          zoomLevel: vpt[0],
          panX: vpt[4],
          panY: vpt[5],
          gridSizeMm: useCanvasStore.getState().gridSizeMm,
          snapMode: useCanvasStore.getState().snapMode,
          elementGapMm: useCanvasStore.getState().elementGapMm,
        };
        
        // Save to previous floor 
        const floors = useFloorStore.getState().floors;
        const prevFloor = floors.find(f => f.id === previousFloorIdRef.current);
        if (prevFloor) {
          useFloorStore.getState().updateActiveGridState({
            canvasState: currentCanvasState
          });
        }
        
        console.log(`🏢 Saved canvas state for floor ${previousFloorIdRef.current}`);
      }
      
      // 2. Clear the entire canvas (this will trigger useRenderGroups to restore groups)
      console.log(`🏢 Clearing canvas - current objects:`, canvas.getObjects().length);
      const objects = canvas.getObjects();
      objects.forEach(obj => {
        console.log(`🏢 Removing object:`, {
          type: obj.type,
          isModule: (obj as any).isModule,
          isCorridor: (obj as any).isCorridor,
          isElementGroup: (obj as any).isElementGroup,
          groupId: (obj as any).groupId
        });
        canvas.remove(obj);
      });
      console.log(`🏢 Canvas cleared - remaining objects:`, canvas.getObjects().length);

      // 3. Restore canvas state for new floor
      const newCanvasState = getActiveCanvasState();
      if (newCanvasState) {
        // Restore zoom and pan
        const transform: [number, number, number, number, number, number] = [
          newCanvasState.zoomLevel, 0, 0, 
          newCanvasState.zoomLevel, 
          newCanvasState.panX, 
          newCanvasState.panY
        ];
        canvas.setViewportTransform(transform);
        
        // Update global canvas store for compatibility
        useCanvasStore.getState().setZoomLevel(newCanvasState.zoomLevel);
        useCanvasStore.getState().setPan(newCanvasState.panX, newCanvasState.panY);
        useCanvasStore.getState().setGridSize(newCanvasState.gridSizeMm);
        useCanvasStore.getState().setSnapMode(newCanvasState.snapMode);
        useCanvasStore.getState().setElementGapMm(newCanvasState.elementGapMm);
      } else {
        // Reset to default if no canvas state exists
        canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
        useCanvasStore.getState().setZoomLevel(1);
        useCanvasStore.getState().setPan(0, 0);
      }

      // 4. Request a render to ensure canvas is updated
      canvas.requestRenderAll();

      console.log(`🎨 Canvas cleared and state restored for floor: ${selectedFloorId}`);
      
      // Update previous floor reference
      previousFloorIdRef.current = selectedFloorId;
    }
  }, [canvas, selectedFloorId, updateActiveCanvasState, getActiveCanvasState]);

  // Save canvas state on viewport transform (pan/zoom changes)
  useEffect(() => {
    if (!canvas) return;

    const handleViewportChange = () => {
      const vpt = canvas.viewportTransform || [1, 0, 0, 1, 0, 0];
      updateActiveCanvasState({
        zoomLevel: vpt[0],
        panX: vpt[4],
        panY: vpt[5],
      });
    };

    canvas.on('after:render', handleViewportChange);
    
    return () => {
      canvas.off('after:render', handleViewportChange);
    };
  }, [canvas, updateActiveCanvasState]);
}