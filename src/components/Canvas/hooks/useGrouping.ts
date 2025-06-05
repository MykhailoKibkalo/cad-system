// src/components/Canvas/hooks/useGrouping.ts
import { useEffect, useCallback } from 'react';
import type { Canvas, Object as FabricObject, ActiveSelection } from 'fabric';
import * as fabric from 'fabric';
import { v4 as uuidv4 } from 'uuid';
import { useObjectStore } from '@/state/objectStore';
import { useSelectionStore } from '@/state/selectionStore';
import { useCanvasStore } from '@/state/canvasStore';
import { useFloorStore } from '@/state/floorStore';
import { ElementGroup } from '@/types/geometry';

export default function useGrouping(canvas: Canvas | null) {
  // Always call hooks first - this is required by Rules of Hooks
  const { 
    addGroup, 
    updateGroup, 
    deleteGroup, 
    getGroupContainingModule,
    updateModule,
    updateCorridor,
    updateBalcony,
    updateBathroomPod,
    modules,
    corridors,
    balconies,
    bathroomPods
  } = useObjectStore();
  
  const { 
    selectedObjectIds, 
    selectedElementTypes,
    setSelectedObjectIds, 
    setSelectedElements,
    clearSelection 
  } = useSelectionStore();
  
  const scaleFactor = useCanvasStore(s => s.scaleFactor);

  // Skip during SSR - return after hooks are called
  if (typeof window === 'undefined') {
    return {
      createGroup: () => null,
      copyGroup: () => null,
      ungroupGroup: () => {},
      canCreateGroup: false,
    };
  }

  // Create a group from selected elements using correct Fabric.js API
  const createGroup = useCallback((groupName?: string) => {
    console.log('🔥 createGroup called with groupName:', groupName);
    
    if (!canvas) {
      console.error('🔥 No canvas - aborting');
      return null;
    }

    // Get the active selection
    const activeObject = canvas.getActiveObject();
    console.log('🔥 Active object:', {
      exists: !!activeObject,
      type: activeObject?.type,
      isActiveSelection: (activeObject as any)?.type === 'activeselection'
    });
    
    if (!activeObject || (activeObject as any).type !== 'activeselection') {
      console.log('🔥 No active selection found - current active object type:', (activeObject as any)?.type);
      return null;
    }

    const activeSelection = activeObject as fabric.ActiveSelection;
    const selectedObjects = activeSelection.getObjects();
    console.log('🔥 Selected objects from activeSelection:', {
      count: selectedObjects.length,
      objects: selectedObjects.map((obj: any, index: number) => ({
        index,
        type: obj.type,
        isModule: obj.isModule,
        isCorridor: obj.isCorridor,
        isBalcony: obj.isBalcony,
        isBathroomPod: obj.isBathroomPod
      }))
    });
    
    // Categorize selected objects by type
    const groupElements = {
      modules: [] as string[],
      corridors: [] as string[],
      balconies: [] as string[],
      bathroomPods: [] as string[]
    };
    
    selectedObjects.forEach((obj, index) => {
      const objAny = obj as any;
      console.log(`🔥 Processing object ${index}:`, {
        type: objAny.type,
        isModule: objAny.isModule,
        isCorridor: objAny.isCorridor,
        isBalcony: objAny.isBalcony,
        isBathroomPod: objAny.isBathroomPod
      });
      
      if (objAny.isModule) {
        groupElements.modules.push(objAny.isModule);
        console.log(`🔥 Added module: ${objAny.isModule}`);
      } else if (objAny.isCorridor) {
        groupElements.corridors.push(objAny.isCorridor);
        console.log(`🔥 Added corridor: ${objAny.isCorridor}`);
      } else if (objAny.isBalcony) {
        groupElements.balconies.push(objAny.isBalcony);
        console.log(`🔥 Added balcony: ${objAny.isBalcony}`);
      } else if (objAny.isBathroomPod) {
        groupElements.bathroomPods.push(objAny.isBathroomPod);
        console.log(`🔥 Added bathroom pod: ${objAny.isBathroomPod}`);
      } else {
        console.log(`🔥 Object ${index} has no groupable identifier`);
      }
    });
    
    console.log('🔥 Final group elements categorization:', groupElements);
    
    // Check if we have at least 2 groupable elements
    const totalElements = groupElements.modules.length + 
                         groupElements.corridors.length + 
                         groupElements.balconies.length + 
                         groupElements.bathroomPods.length;
    
    console.log('🔥 Element count validation:', {
      modules: groupElements.modules.length,
      corridors: groupElements.corridors.length,
      balconies: groupElements.balconies.length,
      bathroomPods: groupElements.bathroomPods.length,
      total: totalElements,
      minimumRequired: 2,
      passesValidation: totalElements >= 2
    });
    
    if (totalElements < 2) {
      console.error('🔥 Not enough elements for grouping - need at least 2, got:', totalElements);
      return null;
    }

    // Use proper Fabric.js Group constructor
    console.log('🔥 Creating fabric group using Group constructor...');
    let group;
    try {
      // Create a new Group from the selected objects
      group = new fabric.Group(selectedObjects, {
        left: activeSelection.left,
        top: activeSelection.top,
        originX: 'left',
        originY: 'top',
        selectable: true,
        evented: true,
        hasControls: true,
      });
      
      // Remove the active selection and add the group
      canvas.remove(activeSelection);
      canvas.add(group);
      canvas.setActiveObject(group);
      
      console.log('🔥 Fabric group created successfully:', !!group);
    } catch (error) {
      console.error('🔥 Error creating fabric group:', error);
      return null;
    }
    
    // Generate group ID
    const groupId = uuidv4();
    console.log('🔥 Generated group ID:', groupId);
    
    // Mark the group
    (group as any).isElementGroup = true;
    (group as any).groupElements = groupElements;
    (group as any).groupId = groupId;
    console.log('🔥 Marked fabric group with metadata');

    // Get group bounds
    const bounds = group.getBoundingRect();
    console.log('🔥 Group bounds:', bounds);
    
    // Create group data
    const groupData: ElementGroup = {
      id: groupId,
      name: groupName || `Group ${Date.now()}`,
      elements: groupElements,
      x: Math.round(bounds.left),
      y: Math.round(bounds.top),
      width: Math.round(bounds.width),
      height: Math.round(bounds.height),
      createdAt: Date.now(),
    };
    console.log('🔥 Created group data object:', groupData);

    // Mark elements as grouped in store
    console.log('🔥 Marking elements as grouped...');
    groupElements.modules.forEach(id => {
      console.log(`🔥 Marking module ${id} as grouped`);
      updateModule(id, { isGrouped: true, groupId });
    });
    groupElements.corridors.forEach(id => {
      console.log(`🔥 Marking corridor ${id} as grouped`);
      updateCorridor(id, { isGrouped: true, groupId });
    });
    groupElements.balconies.forEach(id => {
      console.log(`🔥 Marking balcony ${id} as grouped`);
      updateBalcony(id, { isGrouped: true, groupId });
    });
    groupElements.bathroomPods.forEach(id => {
      console.log(`🔥 Marking bathroom pod ${id} as grouped`);
      updateBathroomPod(id, { isGrouped: true, groupId });
    });

    // Save to store
    console.log('🔥 Adding group to store:', groupData);
    try {
      addGroup(groupData);
      console.log('🔥 Group successfully added to store');
    } catch (error) {
      console.error('🔥 Error adding group to store:', error);
      return null;
    }
    
    // Update selection
    console.log('🔥 Updating selection to group ID:', groupData.id);
    setSelectedObjectIds([groupData.id]);
    
    // Update canvas
    console.log('🔥 Requesting canvas re-render');
    canvas.requestRenderAll();
    
    console.log('🔥 Group creation completed successfully - returning group data');
    return groupData;
  }, [canvas, modules, corridors, balconies, bathroomPods, addGroup, updateModule, updateCorridor, updateBalcony, updateBathroomPod, setSelectedObjectIds]);

  // Ungroup using proper Fabric.js API
  const ungroupGroup = useCallback((groupId?: string) => {
    console.log('🔥 ungroupGroup called with groupId:', groupId);
    if (!canvas) {
      console.error('🔥 No canvas for ungrouping');
      return;
    }

    let group: fabric.Group | null = null;
    let groupData: ElementGroup | null = null;

    if (groupId) {
      // Find group by ID in floorStore
      console.log('🔥 Finding group by ID:', groupId);
      const floorStore = useFloorStore.getState();
      const gridState = floorStore.getActiveGridState();
      const groups = gridState?.groups || [];
      groupData = groups.find(g => g.id === groupId) as ElementGroup || null;
      
      console.log('🔥 Group data found:', !!groupData, groupData);
      if (!groupData) {
        console.error('🔥 Group data not found for ID:', groupId);
        return;
      }
      
      // Find fabric group
      group = canvas.getObjects().find(obj => 
        (obj as any).isElementGroup && (obj as any).groupId === groupId
      ) as fabric.Group;
      
      console.log('🔥 Fabric group found:', !!group);
    } else {
      // Use active object
      console.log('🔥 Using active object for ungrouping');
      const activeObject = canvas.getActiveObject();
      console.log('🔥 Active object:', {
        exists: !!activeObject,
        isElementGroup: (activeObject as any)?.isElementGroup,
        groupId: (activeObject as any)?.groupId
      });
      
      if (!activeObject || !(activeObject as any).isElementGroup) {
        console.error('🔥 Active object is not a group');
        return;
      }
      
      group = activeObject as fabric.Group;
      const gId = (group as any).groupId;
      
      console.log('🔥 Found group ID from active object:', gId);
      
      // Find group data in floorStore
      const floorStore = useFloorStore.getState();
      const gridState = floorStore.getActiveGridState();
      const groups = gridState?.groups || [];
      groupData = groups.find(g => g.id === gId) as ElementGroup || null;
      
      console.log('🔥 Group data found from active object:', !!groupData);
    }

    if (!group || !groupData) {
      console.error('🔥 Missing group or groupData:', { group: !!group, groupData: !!groupData });
      return;
    }

    console.log('🔥 Starting ungrouping process for group:', groupData.name);

    try {
      console.log('🔥 Starting ungrouping with position preservation...');
      
      // Get the group's current position and the objects within it
      const groupObjects = group.getObjects();
      const groupLeft = group.left || 0;
      const groupTop = group.top || 0;
      
      console.log('🔥 Group position:', { left: groupLeft, top: groupTop });
      console.log('🔥 Group contains objects:', groupObjects.length);
      
      // Calculate new positions for each element based on group position + relative offset
      const elementUpdates = new Map<string, any>();
      
      groupObjects.forEach((obj: any, index: number) => {
        // Get the object's position relative to the group
        const objLeft = obj.left || 0;
        const objTop = obj.top || 0;
        
        // Calculate absolute position (group position + relative position)
        const absoluteLeft = Math.round(groupLeft + objLeft);
        const absoluteTop = Math.round(groupTop + objTop);
        
        // Convert back to mm coordinates
        const newX = Math.round(absoluteLeft / scaleFactor);
        const newY = Math.round(absoluteTop / scaleFactor);
        
        console.log(`🔥 Object ${index} position calculation:`, {
          objType: obj.type,
          objLeft,
          objTop,
          groupLeft,
          groupTop,
          absoluteLeft,
          absoluteTop,
          newX,
          newY
        });
        
        // Store updates for each element type
        if (obj.isModule) {
          elementUpdates.set(obj.isModule, {
            type: 'module',
            id: obj.isModule,
            updates: { x0: newX, y0: newY, isGrouped: false, groupId: undefined }
          });
        } else if (obj.isCorridor) {
          // For corridors, we need to update both points maintaining the shape
          const corridor = corridors.find(c => c.id === obj.isCorridor);
          if (corridor) {
            const width = corridor.x2 - corridor.x1;
            const height = corridor.y2 - corridor.y1;
            elementUpdates.set(obj.isCorridor, {
              type: 'corridor',
              id: obj.isCorridor,
              updates: { 
                x1: newX, 
                y1: newY, 
                x2: newX + width, 
                y2: newY + height,
                isGrouped: false, 
                groupId: undefined 
              }
            });
          }
        } else if (obj.isBalcony) {
          elementUpdates.set(obj.isBalcony, {
            type: 'balcony',
            id: obj.isBalcony,
            updates: { isGrouped: false, groupId: undefined }
          });
        } else if (obj.isBathroomPod) {
          elementUpdates.set(obj.isBathroomPod, {
            type: 'bathroomPod',
            id: obj.isBathroomPod,
            updates: { isGrouped: false, groupId: undefined }
          });
        }
      });
      
      // Apply all updates to store
      console.log('🔥 Applying position updates to elements...');
      elementUpdates.forEach(update => {
        console.log(`🔥 Updating ${update.type} ${update.id}:`, update.updates);
        
        switch (update.type) {
          case 'module':
            updateModule(update.id, update.updates);
            break;
          case 'corridor':
            updateCorridor(update.id, update.updates);
            break;
          case 'balcony':
            updateBalcony(update.id, update.updates);
            break;
          case 'bathroomPod':
            updateBathroomPod(update.id, update.updates);
            break;
        }
      });
      
      // Also unmark any remaining elements that weren't in the fabric group
      groupData.elements.modules.forEach(moduleId => {
        if (!elementUpdates.has(moduleId)) {
          console.log(`🔥 Unmarking module not in fabric group: ${moduleId}`);
          updateModule(moduleId, { isGrouped: false, groupId: undefined });
        }
      });
      
      groupData.elements.corridors.forEach(corridorId => {
        if (!elementUpdates.has(corridorId)) {
          console.log(`🔥 Unmarking corridor not in fabric group: ${corridorId}`);
          updateCorridor(corridorId, { isGrouped: false, groupId: undefined });
        }
      });
      
      groupData.elements.balconies.forEach(balconyId => {
        if (!elementUpdates.has(balconyId)) {
          console.log(`🔥 Unmarking balcony not in fabric group: ${balconyId}`);
          updateBalcony(balconyId, { isGrouped: false, groupId: undefined });
        }
      });
      
      groupData.elements.bathroomPods.forEach(podId => {
        if (!elementUpdates.has(podId)) {
          console.log(`🔥 Unmarking bathroom pod not in fabric group: ${podId}`);
          updateBathroomPod(podId, { isGrouped: false, groupId: undefined });
        }
      });

      // Remove group from canvas - but first ensure all internal objects are destroyed
      console.log('🔥 Removing group from canvas');
      
      // Destroy the group to ensure no ghost objects remain
      const objectsInGroup = group.getObjects();
      console.log('🔥 Destroying group objects:', objectsInGroup.length);
      
      // Remove all objects from the group first
      group.removeAll();
      
      // Then remove the group itself
      canvas.remove(group);
      
      // Force cleanup of any remaining objects
      canvas.getObjects().forEach(obj => {
        // Remove any objects that shouldn't exist
        if ((obj as any).group === group) {
          console.log('🔥 Removing orphaned group object');
          canvas.remove(obj);
        }
      });

      // Remove group from store
      console.log('🔥 Removing group from store:', groupData.id);
      deleteGroup(groupData.id);
      
      // Force canvas to re-render - the reactive hooks should recreate individual elements
      canvas.requestRenderAll();
      
      // Update selection to individual elements
      const allElementIds = [
        ...groupData.elements.modules,
        ...groupData.elements.corridors,
        ...groupData.elements.balconies,
        ...groupData.elements.bathroomPods
      ];
      console.log('🔥 Updating selection to individual elements:', allElementIds);
      setSelectedObjectIds(allElementIds);
      
      console.log('🔥 Ungrouping completed - reactive hooks should render individual elements');
    } catch (error) {
      console.error('🔥 Error during ungrouping:', error);
    }
  }, [canvas, deleteGroup, updateModule, updateCorridor, updateBalcony, updateBathroomPod, setSelectedObjectIds]);

  // Copy group implementation - simplified approach without cloning
  const copyGroup = useCallback((groupId: string) => {
    console.log('🔥 copyGroup called with groupId:', groupId);
    if (!canvas || !groupId) {
      console.error('🔥 No canvas or groupId for copying');
      return null;
    }

    // Find group data in floorStore
    const floorStore = useFloorStore.getState();
    const gridState = floorStore.getActiveGridState();
    const groups = gridState?.groups || [];
    const groupData = groups.find(g => g.id === groupId) as ElementGroup || null;
    
    if (!groupData) {
      console.error('🔥 Group data not found for copying:', groupId);
      return null;
    }

    // Find the fabric group on canvas
    const fabricGroup = canvas.getObjects().find(obj => 
      (obj as any).isElementGroup && (obj as any).groupId === groupId
    ) as fabric.Group;

    if (!fabricGroup) {
      console.error('🔥 Fabric group not found on canvas:', groupId);
      return null;
    }

    // Generate new IDs for copied elements
    const newGroupId = uuidv4();
    const elementIdMap = new Map<string, string>();
    
    // Create mappings for new element IDs
    groupData.elements.modules.forEach(id => elementIdMap.set(id, uuidv4()));
    groupData.elements.corridors.forEach(id => elementIdMap.set(id, uuidv4()));
    groupData.elements.balconies.forEach(id => elementIdMap.set(id, uuidv4()));
    groupData.elements.bathroomPods.forEach(id => elementIdMap.set(id, uuidv4()));

    const offset = 100; // pixels
    
    // Create new group data with copied elements
    const newGroupElements = {
      modules: groupData.elements.modules.map(id => elementIdMap.get(id)!),
      corridors: groupData.elements.corridors.map(id => elementIdMap.get(id)!),
      balconies: groupData.elements.balconies.map(id => elementIdMap.get(id)!),
      bathroomPods: groupData.elements.bathroomPods.map(id => elementIdMap.get(id)!),
    };

    const newGroupData: ElementGroup = {
      id: newGroupId,
      name: `${groupData.name} (Copy)`,
      elements: newGroupElements,
      x: Math.round((fabricGroup.left || 0) + offset),
      y: Math.round((fabricGroup.top || 0) + offset),
      width: groupData.width,
      height: groupData.height,
      createdAt: Date.now(),
    };

    // Copy the actual elements in the store
    const objectStore = useObjectStore.getState();
    
    // Copy modules
    groupData.elements.modules.forEach(oldId => {
      const module = modules.find(m => m.id === oldId);
      if (module) {
        const newId = elementIdMap.get(oldId)!;
        const copiedModule = {
          ...module,
          id: newId,
          x0: module.x0 + Math.round(offset / scaleFactor),
          y0: module.y0 + Math.round(offset / scaleFactor),
          isGrouped: true,
          groupId: newGroupId,
        };
        objectStore.addModule(copiedModule);
      }
    });

    // Copy corridors
    groupData.elements.corridors.forEach(oldId => {
      const corridor = corridors.find(c => c.id === oldId);
      if (corridor) {
        const newId = elementIdMap.get(oldId)!;
        const offsetMm = Math.round(offset / scaleFactor);
        const copiedCorridor = {
          ...corridor,
          id: newId,
          x1: corridor.x1 + offsetMm,
          y1: corridor.y1 + offsetMm,
          x2: corridor.x2 + offsetMm,
          y2: corridor.y2 + offsetMm,
          isGrouped: true,
          groupId: newGroupId,
        };
        objectStore.addCorridor(copiedCorridor);
      }
    });

    // Copy balconies
    groupData.elements.balconies.forEach(oldId => {
      const balcony = balconies.find(b => b.id === oldId);
      if (balcony) {
        const newId = elementIdMap.get(oldId)!;
        const copiedBalcony = {
          ...balcony,
          id: newId,
          // Balconies need to find their new parent module
          moduleId: elementIdMap.get(balcony.moduleId) || balcony.moduleId,
          isGrouped: true,
          groupId: newGroupId,
        };
        objectStore.addBalcony(copiedBalcony);
      }
    });

    // Copy bathroom pods
    groupData.elements.bathroomPods.forEach(oldId => {
      const pod = bathroomPods.find(bp => bp.id === oldId);
      if (pod) {
        const newId = elementIdMap.get(oldId)!;
        const copiedPod = {
          ...pod,
          id: newId,
          // Bathroom pods need to find their new parent module
          moduleId: elementIdMap.get(pod.moduleId) || pod.moduleId,
          isGrouped: true,
          groupId: newGroupId,
        };
        objectStore.addBathroomPod(copiedPod);
      }
    });

    // Add the new group to store
    addGroup(newGroupData);
    
    console.log('🔥 All elements copied to store, group data created');
    console.log('🔥 New group elements:', newGroupElements);
    console.log('🔥 Copied modules:', newGroupElements.modules.length);
    console.log('🔥 Copied corridors:', newGroupElements.corridors.length);
    console.log('🔥 Copied balconies:', newGroupElements.balconies.length);
    console.log('🔥 Copied bathroom pods:', newGroupElements.bathroomPods.length);
    
    // The reactive render hooks will automatically create the new group and its elements
    // because we've added them to the store
    
    // Update selection to the new group
    setSelectedObjectIds([newGroupId]);
    
    // Small delay to allow render hooks to create the copied group
    setTimeout(() => {
      setSelectedObjectIds([newGroupId]);
      
      // Find the new group on canvas and select it
      const newGroup = canvas.getObjects().find(obj => 
        (obj as any).isElementGroup && (obj as any).groupId === newGroupId
      );
      
      if (newGroup) {
        canvas.setActiveObject(newGroup);
        console.log('🔥 Selected copied group on canvas');
      } else {
        console.log('🔥 New group not found on canvas yet, selection updated in store');
      }
      
      canvas.requestRenderAll();
      console.log('🔥 Group copied successfully:', newGroupData);
    }, 300); // Longer delay to ensure group rendering completes

    return true;
  }, [canvas, modules, corridors, balconies, bathroomPods, scaleFactor, addGroup, setSelectedObjectIds]);

  return {
    createGroup,
    copyGroup,
    ungroupGroup,
    canCreateGroup: (() => {
      if (!canvas) return false;
      const activeObject = canvas.getActiveObject();
      if (!activeObject || (activeObject as any).type !== 'activeselection') return false;
      const selectedObjects = (activeObject as fabric.ActiveSelection).getObjects();
      
      // Count groupable objects
      let groupableCount = 0;
      selectedObjects.forEach((obj: any) => {
        if (obj.isModule || obj.isCorridor || obj.isBalcony || obj.isBathroomPod) {
          groupableCount++;
        }
      });
      
      return groupableCount >= 2;
    })(),
  };
}