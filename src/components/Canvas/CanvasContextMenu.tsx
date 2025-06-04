// src/components/Canvas/CanvasContextMenu.tsx
'use client';

import React, { useCallback, useEffect, useState } from 'react';
import type { Canvas as FabricCanvas } from 'fabric';
import styled from '@emotion/styled';
import { useSelectionStore } from '@/state/selectionStore';
import { useObjectStore } from '@/state/objectStore';
import useGrouping from './hooks/useGrouping';

const Menu = styled.ul`
  position: absolute;
  background: white;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  padding: 4px 0;
  margin: 0;
  list-style: none;
  border-radius: 4px;
  z-index: 2000;
`;
const Item = styled.li`
  padding: 6px 16px;
  cursor: pointer;

  &:hover {
    background: #f3f4f6;
  }
`;

interface Props {
  canvas: FabricCanvas | null;
}

export default function CanvasContextMenu({ canvas }: Props) {
  const [pos, setPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [visible, setVisible] = useState(false);
  const [contextState, setContextState] = useState<{
    canGroup: boolean;
    selectedGroupId: string | null;
    hasActions: boolean;
  }>({ canGroup: false, selectedGroupId: null, hasActions: false });
  
  const { selectedObjectIds, setSelectedObjectIds } = useSelectionStore();
  const objectStore = useObjectStore();
  const modules = objectStore?.modules || [];
  const groups = objectStore?.groups || [];
  const getGroupContainingModule = objectStore?.getGroupContainingModule || (() => null);
  const groupingHook = useGrouping(canvas);
  const { createGroup, copyGroup, ungroupGroup, canCreateGroup } = groupingHook || {
    createGroup: () => null,
    copyGroup: () => null,
    ungroupGroup: () => {},
    canCreateGroup: false,
  };

  const handleContextMenu = useCallback((e: MouseEvent) => {
    e.preventDefault();
    setPos({ x: e.clientX, y: e.clientY });
    
    console.log('🔍 Context menu triggered at position:', { x: e.clientX, y: e.clientY });
    console.log('🔍 Canvas exists:', !!canvas);
    console.log('🔍 groupingHook exists:', !!groupingHook);
    console.log('🔍 canCreateGroup value:', groupingHook?.canCreateGroup);
    
    let canGroup = false;
    let selectedGroupId: string | null = null;
    
    // Check the current selection when opening context menu
    if (canvas) {
      const activeObject = canvas.getActiveObject();
      console.log('🔍 Active object:', activeObject);
      console.log('🔍 Active object type:', (activeObject as any)?.type);
      console.log('🔍 Is module group?', (activeObject as any)?.isModuleGroup);
      
      if (activeObject) {
        // Handle group selection first
        if ((activeObject as any).isElementGroup || (activeObject as any).isModuleGroup) {
          console.log('🔍 Found element group');
          const groupId = (activeObject as any).groupId;
          const groups = objectStore?.groups || [];
          const group = groups.find(g => g.id === groupId);
          
          if (group) {
            selectedGroupId = group.id;
            console.log('🔍 Group found:', group.name);
          }
        }
        // Handle multiple selection for grouping
        else if ((activeObject as any).type === 'activeselection') {
          console.log('🔍 Found active selection');
          const selectedObjects = (activeObject as any).getObjects() || [];
          console.log('🔍 Objects in ActiveSelection:', selectedObjects.length);
          
          // Count all groupable elements (modules, corridors, balconies, bathroom pods)
          let groupableCount = 0;
          selectedObjects.forEach((obj: any) => {
            if (obj.isModule || obj.isCorridor || obj.isBalcony || obj.isBathroomPod) {
              groupableCount++;
            }
          });
          
          console.log('🔍 Groupable objects:', groupableCount);
          
          canGroup = groupableCount >= 2;
          console.log('🔍 Can group:', canGroup);
        }
        // Handle single element selection
        else if ((activeObject as any).isModule || 
                 (activeObject as any).isCorridor || 
                 (activeObject as any).isBalcony || 
                 (activeObject as any).isBathroomPod) {
          console.log('🔍 Single element selected');
          // Check if element is part of a group
          let elementId = null;
          let elementType = '';
          
          if ((activeObject as any).isModule) {
            elementId = (activeObject as any).isModule;
            elementType = 'module';
          } else if ((activeObject as any).isCorridor) {
            elementId = (activeObject as any).isCorridor;
            elementType = 'corridor';
          } else if ((activeObject as any).isBalcony) {
            elementId = (activeObject as any).isBalcony;
            elementType = 'balcony';
          } else if ((activeObject as any).isBathroomPod) {
            elementId = (activeObject as any).isBathroomPod;
            elementType = 'bathroom pod';
          }
          
          if (elementId) {
            const groups = objectStore?.groups || [];
            const containingGroup = groups.find(g => {
              if (elementType === 'module') return g.elements?.modules?.includes(elementId) || g.moduleIds?.includes(elementId);
              if (elementType === 'corridor') return g.elements?.corridors?.includes(elementId);
              if (elementType === 'balcony') return g.elements?.balconies?.includes(elementId);
              if (elementType === 'bathroom pod') return g.elements?.bathroomPods?.includes(elementId);
              return false;
            });
            
            if (containingGroup) {
              console.log(`🔍 ${elementType} is part of group:`, containingGroup.name);
              selectedGroupId = containingGroup.id;
            }
          }
        }
      }
    }
    
    const hasActions = canGroup || !!selectedGroupId;
    
    console.log('🔍 Final state:', { canGroup, selectedGroupId, hasActions });
    
    setContextState({
      canGroup,
      selectedGroupId,
      hasActions
    });
    
    setVisible(hasActions); // Only show if we have actions
  }, [canvas, objectStore]);

  const handleClickOutside = useCallback(() => {
    if (visible) setVisible(false);
  }, [visible]);

  useEffect(() => {
    if (!canvas) return;
    const el = canvas.upperCanvasEl as HTMLCanvasElement;
    const onMouseDownCapture = (e: MouseEvent) => {
      if (e.button === 2) {
        e.stopPropagation();
      }
    };
    el.addEventListener('mousedown', onMouseDownCapture, { capture: true });
    el.addEventListener('contextmenu', handleContextMenu, { capture: true });
    window.addEventListener('click', handleClickOutside);
    return () => {
      el.removeEventListener('mousedown', onMouseDownCapture, { capture: true });
      el.removeEventListener('contextmenu', handleContextMenu, { capture: true });
      window.removeEventListener('click', handleClickOutside);
    };
  }, [canvas, handleContextMenu, handleClickOutside]);

  // Check what actions are available based on current selection
  const getSelectedGroup = useCallback(() => {
    if (selectedObjectIds && selectedObjectIds.length === 1 && groups && Array.isArray(groups)) {
      return groups.find(g => g.id === selectedObjectIds[0]);
    }
    return null;
  }, [selectedObjectIds, groups]);

  const selectedGroup = getSelectedGroup();
  const isModuleInGroup = selectedObjectIds && selectedObjectIds.length === 1 && 
    modules && modules.some(m => m.id === selectedObjectIds[0]) &&
    getGroupContainingModule(selectedObjectIds[0]);


  const doGroup = () => {
    console.log('🚀 doGroup called - starting group creation process');
    console.log('🚀 Canvas state:', !!canvas);
    console.log('🚀 createGroup function:', typeof createGroup);
    
    if (!canvas) {
      console.error('❌ No canvas available for grouping');
      setVisible(false);
      return;
    }
    
    const activeObject = canvas.getActiveObject();
    console.log('🚀 Active object when grouping:', {
      exists: !!activeObject,
      type: activeObject?.type,
      isActiveSelection: activeObject?.type === 'activeselection'
    });
    
    if (activeObject?.type === 'activeselection') {
      const selectedObjects = (activeObject as any).getObjects();
      console.log('🚀 Objects in active selection:', {
        count: selectedObjects.length,
        objects: selectedObjects.map((obj: any) => ({
          type: obj.type,
          isModule: obj.isModule,
          isCorridor: obj.isCorridor,
          isBalcony: obj.isBalcony,
          isBathroomPod: obj.isBathroomPod
        }))
      });
    }
    
    console.log('🚀 Calling createGroup...');
    const result = createGroup();
    console.log('🚀 createGroup result:', result);
    
    if (result) {
      console.log('✅ Group created successfully:', result);
    } else {
      console.error('❌ Group creation failed - no result returned');
    }
    setVisible(false);
  };

  // Use immediate context state instead of store-based state
  const { canGroup, selectedGroupId, hasActions } = contextState;
  const currentSelectedGroup = selectedGroupId ? groups?.find(g => g.id === selectedGroupId) : null;
  
  const doUngroup = () => {
    if (currentSelectedGroup) {
      ungroupGroup(currentSelectedGroup.id);
    }
    setVisible(false);
  };

  const doCopyGroup = () => {
    if (currentSelectedGroup) {
      copyGroup(currentSelectedGroup.id);
    }
    setVisible(false);
  };
  
  return visible && hasActions ? (
    <Menu style={{ top: pos.y, left: pos.x }}>
      {canGroup && (
        <Item onClick={doGroup}>Group</Item>
      )}
      {currentSelectedGroup && (
        <>
          <Item onClick={doUngroup}>Ungroup</Item>
          <Item onClick={doCopyGroup}>Copy Group</Item>
        </>
      )}
    </Menu>
  ) : null;
}
