// src/components/Canvas/hooks/useRenderGroups.ts
import { useEffect, useRef } from 'react';
import type { Canvas } from 'fabric';
import * as fabric from 'fabric';
import { useObjectStore } from '@/state/objectStore';
import { useCanvasStore } from '@/state/canvasStore';
import { useFloorStore } from '@/state/floorStore';
import { ElementGroup } from '@/types/geometry';

export default function useRenderGroups(canvas: Canvas | null) {
  // Use floorStore directly to avoid objectStore sync issues
  const selectedFloorId = useFloorStore(s => s.selectedFloorId);
  const getActiveGridState = useFloorStore(s => s.getActiveGridState);
  const scaleFactor = useCanvasStore(s => s.scaleFactor);
  const previousFloorRef = useRef<string | null>(null);
  
  // Get data directly from active grid state to avoid objectStore timing issues
  const gridState = getActiveGridState();
  const groups = (gridState?.groups || []) as ElementGroup[];
  const modules = gridState?.modules || [];
  const corridors = gridState?.corridors || [];
  const balconies = gridState?.balconies || [];
  const bathroomPods = gridState?.bathroomPods || [];

  useEffect(() => {
    if (!canvas || !selectedFloorId) return;
    
    // Determine if this is a floor change
    const isFloorChange = previousFloorRef.current !== null && 
                         previousFloorRef.current !== selectedFloorId;
    
    console.log('🎨 useRenderGroups triggered:', {
      isFloorChange,
      selectedFloorId,
      groupsCount: groups?.length || 0,
      groups: groups
    });
    
    // Additional debug: Check objectStore directly
    const objectStoreGroups = useObjectStore.getState().groups;
    console.log('🎨 ObjectStore groups:', {
      count: objectStoreGroups?.length || 0,
      groups: objectStoreGroups
    });
    
    // Additional debug: Check floorStore directly  
    const floorStore = useFloorStore.getState();
    const activeGridState = floorStore.getActiveGridState();
    console.log('🎨 FloorStore active grid state:', {
      exists: !!activeGridState,
      groupsCount: activeGridState?.groups?.length || 0,
      groups: activeGridState?.groups || []
    });
    
    // Only handle group restoration on floor change
    if (!isFloorChange) {
      console.log('🎨 Not a floor change, skipping group rendering');
      return;
    }
    
    // Add delay to ensure elements are loaded first
    const delay = 200;
    
    const timeoutId = setTimeout(() => {
      console.log('🎨 Restoring groups after floor change');
      
      if (!groups || groups.length === 0) {
        console.log('🎨 No groups to restore');
        previousFloorRef.current = selectedFloorId;
        return;
      }

      // Find any existing fabric groups that shouldn't be there
      const existingGroups = canvas.getObjects().filter(obj => (obj as any).isElementGroup);
      console.log('🎨 Found existing fabric groups:', existingGroups.length);
      
      // Remove any stray fabric groups (they should be restored properly)
      existingGroups.forEach(group => {
        const groupId = (group as any).groupId;
        const groupExists = groups.find(g => g.id === groupId);
        if (!groupExists) {
          console.log('🎨 Removing orphaned fabric group:', groupId);
          canvas.remove(group);
        }
      });

      // Restore each group by finding existing canvas objects and grouping them
      groups.forEach(group => {
        console.log('🎨 Restoring group:', group.name, group.id);
        
        // Check if this group already exists as a fabric group
        const existingFabricGroup = canvas.getObjects().find(obj => 
          (obj as any).isElementGroup && (obj as any).groupId === group.id
        );
        
        if (existingFabricGroup) {
          console.log('🎨 Group already exists as fabric group, skipping:', group.id);
          return;
        }
        
        // Find or create canvas objects that belong to this group
        const groupObjects: fabric.Object[] = [];
        
        // Find or create modules
        group.elements.modules.forEach(moduleId => {
          let canvasObj = canvas.getObjects().find(obj => (obj as any).isModule === moduleId);
          if (canvasObj) {
            groupObjects.push(canvasObj);
            console.log('🎨 Found existing module for grouping:', moduleId);
          } else {
            // Module doesn't exist on canvas, create it
            const module = modules.find(m => m.id === moduleId);
            if (module) {
              console.log('🎨 Creating missing module for group:', moduleId);
              
              const rect = new fabric.Rect({
                left: Math.round(module.x0 * scaleFactor),
                top: Math.round(module.y0 * scaleFactor),
                width: Math.round(module.width * scaleFactor),
                height: Math.round(module.length * scaleFactor),
                fill: 'rgba(54, 162, 235, 0.2)',
                stroke: module.showBorder ? '#36a2eb' : 'transparent',
                strokeWidth: module.showBorder ? 2 : 0,
                selectable: true,
                evented: true,
                hasControls: true,
                hasBorders: true,
                lockScalingX: false,
                lockScalingY: false,
                lockUniScaling: false,
                lockMovementX: false,
                lockMovementY: false,
              });

              (rect as any).isModule = module.id;
              groupObjects.push(rect);
              console.log('🎨 Created module for grouping:', moduleId);
            } else {
              console.log('🎨 Module not found in store:', moduleId);
            }
          }
        });
        
        // Find or create corridors  
        group.elements.corridors.forEach(corridorId => {
          let canvasObj = canvas.getObjects().find(obj => (obj as any).isCorridor === corridorId);
          if (canvasObj) {
            groupObjects.push(canvasObj);
            console.log('🎨 Found existing corridor for grouping:', corridorId);
          } else {
            // Create missing corridor (simplified for now)
            const corridor = corridors.find(c => c.id === corridorId);
            if (corridor) {
              console.log('🎨 Creating missing corridor for group:', corridorId);
              // TODO: Implement corridor creation logic
              console.log('🎨 Corridor creation not implemented yet');
            }
          }
        });
        
        // Find or create balconies
        group.elements.balconies.forEach(balconyId => {
          let canvasObj = canvas.getObjects().find(obj => (obj as any).isBalcony === balconyId);
          if (canvasObj) {
            groupObjects.push(canvasObj);
            console.log('🎨 Found existing balcony for grouping:', balconyId);
          } else {
            // Create missing balcony (simplified for now)
            const balcony = balconies.find(b => b.id === balconyId);
            if (balcony) {
              console.log('🎨 Creating missing balcony for group:', balconyId);
              // TODO: Implement balcony creation logic
              console.log('🎨 Balcony creation not implemented yet');
            }
          }
        });
        
        // Find or create bathroom pods
        group.elements.bathroomPods.forEach(podId => {
          let canvasObj = canvas.getObjects().find(obj => (obj as any).isBathroomPod === podId);
          if (canvasObj) {
            groupObjects.push(canvasObj);
            console.log('🎨 Found existing bathroom pod for grouping:', podId);
          } else {
            // Create missing bathroom pod (simplified for now)
            const pod = bathroomPods.find(bp => bp.id === podId);
            if (pod) {
              console.log('🎨 Creating missing bathroom pod for group:', podId);
              // TODO: Implement bathroom pod creation logic
              console.log('🎨 Bathroom pod creation not implemented yet');
            }
          }
        });
        
        console.log('🎨 Found objects for group restoration:', {
          groupId: group.id,
          expectedElements: {
            modules: group.elements.modules.length,
            corridors: group.elements.corridors.length,
            balconies: group.elements.balconies.length,
            bathroomPods: group.elements.bathroomPods.length
          },
          foundObjects: groupObjects.length
        });
        
        if (groupObjects.length === 0) {
          console.log('🎨 No objects found for group, skipping:', group.id);
          return;
        }
        
        try {
          // Remove individual objects from canvas
          groupObjects.forEach(obj => canvas.remove(obj));
          
          // Create the fabric group
          const fabricGroup = new fabric.Group(groupObjects, {
            left: group.x,
            top: group.y,
            originX: 'left',
            originY: 'top',
            selectable: true,
            evented: true,
            hasControls: true,
          });
          
          // Mark as element group
          (fabricGroup as any).isElementGroup = true;
          (fabricGroup as any).groupElements = group.elements;
          (fabricGroup as any).groupId = group.id;
          
          // Add to canvas
          canvas.add(fabricGroup);
          
          console.log('🎨 Successfully restored group:', group.name);
        } catch (error) {
          console.error('🎨 Error restoring group:', group.id, error);
          // Re-add objects individually if grouping fails
          groupObjects.forEach(obj => canvas.add(obj));
        }
      });

      canvas.requestRenderAll();
      previousFloorRef.current = selectedFloorId;
      console.log('🎨 Group restoration completed');
    }, delay);
    
    return () => clearTimeout(timeoutId);
  }, [canvas, groups, selectedFloorId]);
  
  // Also update the previous floor ref when groups change (not just floor change)
  useEffect(() => {
    if (selectedFloorId && !previousFloorRef.current) {
      previousFloorRef.current = selectedFloorId;
    }
  }, [selectedFloorId]);
}