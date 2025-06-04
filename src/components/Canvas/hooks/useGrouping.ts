// src/components/Canvas/hooks/useGrouping.ts
import { useEffect, useCallback } from 'react';
import type { Canvas, Object as FabricObject, ActiveSelection } from 'fabric';
import * as fabric from 'fabric';
import { v4 as uuidv4 } from 'uuid';
import { useObjectStore } from '@/state/objectStore';
import { useSelectionStore } from '@/state/selectionStore';
import { useCanvasStore } from '@/state/canvasStore';
import { ElementGroup } from '@/types/geometry';

export default function useGrouping(canvas: Canvas | null) {
  // Skip during SSR
  if (typeof window === 'undefined') {
    return {
      createGroup: () => null,
      copyGroup: () => null,
      ungroupGroup: () => {},
      canCreateGroup: false,
    };
  }

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
    if (!canvas) return;

    let group: fabric.Group | null = null;
    let groupData: ElementGroup | null = null;

    if (groupId) {
      // Find group by ID
      const groups = useObjectStore.getState().groups;
      groupData = groups?.find(g => g.id === groupId) as ElementGroup || null;
      if (!groupData) return;
      
      // Find fabric group
      group = canvas.getObjects().find(obj => 
        (obj as any).isElementGroup && (obj as any).groupId === groupId
      ) as fabric.Group;
    } else {
      // Use active object
      const activeObject = canvas.getActiveObject();
      if (!activeObject || !(activeObject as any).isElementGroup) return;
      
      group = activeObject as fabric.Group;
      const gId = (group as any).groupId;
      
      // Find group data
      const groups = useObjectStore.getState().groups;
      groupData = groups?.find(g => g.id === gId) as ElementGroup || null;
    }

    if (!group || !groupData) return;

    console.log('🔥 Ungrouping group:', groupData.id);

    // Get the objects from the group
    const groupObjects = group.getObjects();
    
    // Remove the group from canvas
    canvas.remove(group);
    
    // Add individual objects back to canvas
    groupObjects.forEach(obj => {
      canvas.add(obj);
    });
    
    // Create active selection from the ungrouped objects
    const activeSelection = new fabric.ActiveSelection(groupObjects, {
      canvas: canvas,
    });
    canvas.setActiveObject(activeSelection);
    
    // Mark elements as not grouped
    groupData.elements.modules.forEach(moduleId => {
      updateModule(moduleId, { isGrouped: false, groupId: undefined });
    });
    groupData.elements.corridors.forEach(corridorId => {
      updateCorridor(corridorId, { isGrouped: false, groupId: undefined });
    });
    groupData.elements.balconies.forEach(balconyId => {
      updateBalcony(balconyId, { isGrouped: false, groupId: undefined });
    });
    groupData.elements.bathroomPods.forEach(podId => {
      updateBathroomPod(podId, { isGrouped: false, groupId: undefined });
    });

    // Remove group from store
    deleteGroup(groupData.id);
    
    // Update selection to individual elements
    const allElementIds = [
      ...groupData.elements.modules,
      ...groupData.elements.corridors,
      ...groupData.elements.balconies,
      ...groupData.elements.bathroomPods
    ];
    setSelectedObjectIds(allElementIds);
    
    canvas.requestRenderAll();
    console.log('🔥 Ungrouping completed');
  }, [canvas, deleteGroup, updateModule, updateCorridor, updateBalcony, updateBathroomPod, setSelectedObjectIds]);

  // Simple copy group implementation
  const copyGroup = useCallback((groupId: string) => {
    console.log('🔥 Copy group not implemented yet');
    return null;
  }, []);

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