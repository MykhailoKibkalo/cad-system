// src/components/Groups/GroupsSidebar.tsx
'use client';

import React, { useState } from 'react';
import styled from '@emotion/styled';
import { useObjectStore } from '@/state/objectStore';
import { useSelectionStore } from '@/state/selectionStore';
import useGrouping from '../Canvas/hooks/useGrouping';
import type { Canvas } from 'fabric';

const Sidebar = styled.div<{ isOpen: boolean }>`
  position: fixed;
  left: ${props => props.isOpen ? '0' : '-300px'};
  top: 60px;
  width: 300px;
  height: calc(100vh - 60px);
  background: white;
  border-right: 1px solid #e5e7eb;
  transition: left 0.3s ease;
  z-index: 100;
  display: flex;
  flex-direction: column;
`;

const Header = styled.div`
  padding: 16px;
  border-bottom: 1px solid #e5e7eb;
  font-weight: 600;
  font-size: 16px;
  color: #1f2937;
`;

const Content = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 8px;
`;

const GroupItem = styled.div<{ isSelected: boolean; isExpanded?: boolean }>`
  margin: 4px 0;
  border-radius: 6px;
  border: 1px solid ${props => props.isSelected ? '#3b82f6' : '#e5e7eb'};
  background: ${props => props.isSelected ? '#eff6ff' : 'white'};
  transition: all 0.2s ease;

  &:hover {
    border-color: #3b82f6;
    background: #f8fafc;
  }
`;

const GroupHeader = styled.div`
  padding: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const GroupContent = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
`;

const ExpandIcon = styled.div<{ isExpanded: boolean }>`
  transition: transform 0.2s ease;
  transform: ${props => props.isExpanded ? 'rotate(90deg)' : 'rotate(0deg)'};
  font-size: 12px;
  color: #6b7280;
`;

const GroupName = styled.div`
  font-weight: 500;
  color: #1f2937;
  margin-bottom: 4px;
`;

const GroupInfo = styled.div`
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 8px;
`;

const ModuleList = styled.div<{ isExpanded?: boolean }>`
  font-size: 11px;
  color: #9ca3af;
  max-height: ${props => props.isExpanded ? '200px' : '0'};
  overflow: hidden;
  transition: max-height 0.3s ease;
  padding: ${props => props.isExpanded ? '0 12px 12px' : '0 12px'};
`;

const ModuleItem = styled.div`
  padding: 6px 12px;
  margin: 2px 0;
  background: #f9fafb;
  border-radius: 4px;
  font-size: 12px;
  color: #374151;
  display: flex;
  align-items: center;
  justify-content: space-between;
  
  &:hover {
    background: #f3f4f6;
  }
`;

const ModuleDimensions = styled.span`
  font-size: 11px;
  color: #6b7280;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 8px;
`;

const ActionButton = styled.button`
  padding: 4px 8px;
  border: 1px solid #d1d5db;
  background: white;
  border-radius: 4px;
  font-size: 11px;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #f3f4f6;
    border-color: #9ca3af;
  }
`;

const EmptyState = styled.div`
  padding: 32px 16px;
  text-align: center;
  color: #6b7280;
  font-size: 14px;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 16px;
  right: 16px;
  background: none;
  border: none;
  font-size: 18px;
  color: #6b7280;
  cursor: pointer;
  padding: 4px;
  
  &:hover {
    color: #374151;
  }
`;

interface GroupsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  canvas: Canvas | null;
}

export default function GroupsSidebar({ isOpen, onClose, canvas }: GroupsSidebarProps) {
  const objectStore = useObjectStore();
  const groups = objectStore?.groups || [];
  const modules = objectStore?.modules || [];
  const { selectedObjectIds, setSelectedObjectIds } = useSelectionStore();
  const groupingHook = useGrouping(canvas);
  const { copyGroup, ungroupGroup } = groupingHook || { copyGroup: () => {}, ungroupGroup: () => {} };
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const handleGroupSelect = (groupId: string) => {
    setSelectedObjectIds([groupId]);
    
    // Also select the group on canvas
    if (canvas) {
      const fabricGroup = canvas.getObjects().find(obj => 
        (obj as any).isElementGroup && 
        (obj as any).groupId === groupId
      );
      
      if (fabricGroup) {
        canvas.setActiveObject(fabricGroup);
        canvas.requestRenderAll();
      }
    }
  };

  const handleCopyGroup = (e: React.MouseEvent, groupId: string) => {
    e.stopPropagation();
    copyGroup(groupId);
  };

  const handleUngroupGroup = (e: React.MouseEvent, groupId: string) => {
    e.stopPropagation();
    ungroupGroup(groupId);
  };

  const handleRenameStart = (e: React.MouseEvent, groupId: string, currentName: string) => {
    e.stopPropagation();
    setEditingGroupId(groupId);
    setEditName(currentName);
  };

  const handleRenameSubmit = (groupId: string) => {
    if (editName.trim()) {
      useObjectStore.getState().updateGroup(groupId, { name: editName.trim() });
    }
    setEditingGroupId(null);
    setEditName('');
  };

  const handleRenameCancel = () => {
    setEditingGroupId(null);
    setEditName('');
  };

  const getModules = (moduleIds: string[]) => {
    if (!moduleIds || !Array.isArray(moduleIds) || !modules) return [];
    return moduleIds
      .map(id => modules.find(m => m.id === id))
      .filter(Boolean) as typeof modules;
  };
  
  const toggleExpanded = (groupId: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <Sidebar isOpen={isOpen}>
      <Header>
        Groups
        <CloseButton onClick={onClose}>×</CloseButton>
      </Header>
      
      <Content>
        {!groups || groups.length === 0 ? (
          <EmptyState>
            No groups created yet.<br />
            Select multiple modules and right-click to create a group.
          </EmptyState>
        ) : (
          (groups || []).map(group => {
            const isSelected = selectedObjectIds.includes(group.id);
            const isExpanded = expandedGroups.has(group.id);
            const groupModules = getModules(group.elements?.modules || []);
            
            return (
              <GroupItem
                key={group.id}
                isSelected={isSelected}
                isExpanded={isExpanded}
              >
                <GroupHeader onClick={() => handleGroupSelect(group.id)}>
                  <GroupContent>
                    {editingGroupId === group.id ? (
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onBlur={() => handleRenameSubmit(group.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleRenameSubmit(group.id);
                          if (e.key === 'Escape') handleRenameCancel();
                        }}
                        onClick={(e) => e.stopPropagation()}
                        autoFocus
                        style={{
                          border: 'none',
                          background: 'transparent',
                          font: 'inherit',
                          fontWeight: 500,
                          width: '100%',
                          outline: 'none'
                        }}
                      />
                    ) : (
                      <GroupName>{group.name}</GroupName>
                    )}
                    
                    <GroupInfo>
                      {(group.elements?.modules || []).length} modules • Created {formatDate(group.createdAt)}
                    </GroupInfo>
                  </GroupContent>
                  
                  <ExpandIcon 
                    isExpanded={isExpanded}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleExpanded(group.id);
                    }}
                  >
                    ▶
                  </ExpandIcon>
                </GroupHeader>
                
                <ModuleList isExpanded={isExpanded}>
                  {groupModules.map(module => (
                    <ModuleItem key={module.id}>
                      <span>{module.name}</span>
                      <ModuleDimensions>
                        {module.width} × {module.length} mm
                      </ModuleDimensions>
                    </ModuleItem>
                  ))}
                </ModuleList>
                
                <ActionButtons style={{ padding: '0 12px 12px' }}>
                  <ActionButton
                    onClick={(e) => handleRenameStart(e, group.id, group.name)}
                  >
                    Rename
                  </ActionButton>
                  <ActionButton
                    onClick={(e) => handleCopyGroup(e, group.id)}
                  >
                    Copy
                  </ActionButton>
                  <ActionButton
                    onClick={(e) => handleUngroupGroup(e, group.id)}
                  >
                    Ungroup
                  </ActionButton>
                </ActionButtons>
              </GroupItem>
            );
          })
        )}
      </Content>
    </Sidebar>
  );
}