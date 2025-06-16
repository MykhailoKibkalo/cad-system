// src/components/Floors/FloorsSidebar.tsx
import React, { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import { colors } from '@/styles/theme';
import { useFloorStore } from '@/state/floorStore';
import { LuCopy, LuLayers, LuPencil, LuPlus, LuTrash2, LuX } from 'react-icons/lu';
import AddFloorModal from './AddFloorModal';
import EditFloorModal from './EditFloorModal';
import CopyFloorModal from './CopyFloorModal';
import { Button } from '@/components/ui/Button';

const SidebarContainer = styled.div<{ isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: ${props => (props.isOpen ? '0' : '-320px')};
  width: 320px;
  height: 100vh;
  background: ${colors.white};
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
  transition: left 0.3s ease;
  z-index: 1001;
  display: flex;
  flex-direction: column;
`;

const SidebarHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px;
  border-bottom: 1px solid ${colors.gray};
`;

const Title = styled.h2`
  font-size: 20px;
  font-weight: 600;
  margin: 0;
  color: ${colors.black};
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: background 0.2s;

  &:hover {
    background: ${colors.gray};
  }
`;

const FloorsList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 16px;
`;

const FloorItem = styled.div<{ isActive: boolean }>`
  display: flex;
  align-items: center;
  padding: 12px;
  margin-bottom: 8px;
  background: ${props => (props.isActive ? '#e3f2fd' : colors.white)};
  border: 1px solid ${props => (props.isActive ? '#2196f3' : colors.gray)};
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: ${props => (props.isActive ? '#e3f2fd' : '#f5f5f5')};

    .actions {
      opacity: 1;
    }
  }
`;

const FloorIcon = styled.div`
  margin-right: 12px;
  color: #666;
`;

const FloorInfo = styled.div`
  flex: 1;
`;

const FloorName = styled.div`
  font-weight: 500;
  color: ${colors.black};
  margin-bottom: 2px;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
`;

const FloorHeight = styled.div`
  font-size: 14px;
  color: #666;
`;

const GroupBadge = styled.div`
  background: #e3f2fd;
  color: #1976d2;
  border-radius: 12px;
  padding: 2px 8px;
  font-size: 12px;
  font-weight: 500;
  margin-left: 8px;
  white-space: nowrap;
`;

const FloorActions = styled.div`
  display: flex;
  gap: 8px;
  opacity: 0;
  transition: opacity 0.2s;
`;

const ContextMenuButton = styled.div`
  position: relative;
  display: inline-block;
  
  /* Ensure context menu is above other elements */
  &:has([data-context-menu]:first-child) {
    z-index: 1003;
  }
`;

const ContextMenu = styled.div<{ isOpen: boolean }>`
  position: absolute;
  top: 100%;
  right: 0;
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1002;
  min-width: 160px;
  display: ${props => props.isOpen ? 'block' : 'none'};
  overflow: hidden;
`;

const ContextMenuItem = styled.div<{ variant?: 'normal' | 'danger' | 'disabled' }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  cursor: ${props => props.variant === 'disabled' ? 'not-allowed' : 'pointer'};
  transition: background 0.2s;
  font-size: 14px;
  color: ${props => {
    if (props.variant === 'disabled') return '#9ca3af';
    if (props.variant === 'danger') return '#dc2626';
    return '#374151';
  }};
  opacity: ${props => props.variant === 'disabled' ? 0.5 : 1};
  
  &:hover {
    background: ${props => {
      if (props.variant === 'disabled') return 'transparent';
      if (props.variant === 'danger') return '#fee2e2';
      return '#f3f4f6';
    }};
  }
  
  svg {
    color: currentColor;
  }
`;

const ActionButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: background 0.2s;
  color: #666;
  min-width: 32px;
  min-height: 32px;
  font-size: 16px;
  line-height: 1;

  &:hover {
    background: ${colors.gray};
    color: ${colors.black};
  }

  &.delete:hover {
    background: #ffebee;
    color: #c62828;
  }

  /* Style for context menu button */
  &:focus {
    outline: 2px solid #3b82f6;
    outline-offset: 2px;
  }
`;

const AddFloorButton = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: calc(100% - 32px);
  margin: 16px;
  border: none;
`;

const Backdrop = styled.div<{ isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  display: ${props => (props.isOpen ? 'block' : 'none')};
  z-index: 1000;
`;

const FloorsSidebar: React.FC = () => {
  const { floors, selectedFloorId, isSidebarOpen, selectFloor, deleteFloor, cloneFloor, setSidebarOpen } = useFloorStore();

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingFloorId, setEditingFloorId] = useState<string | null>(null);
  const [copyingFloorId, setCopyingFloorId] = useState<string | null>(null);
  const [floorToDelete, setFloorToDelete] = useState<string | null>(null);
  const [contextMenuFloorId, setContextMenuFloorId] = useState<string | null>(null);
  
  // Debug: Log context menu state changes
  useEffect(() => {
    console.log('Context menu floor ID changed:', contextMenuFloorId);
  }, [contextMenuFloorId]);

  const handleFloorClick = (floorId: string) => {
    selectFloor(floorId);
  };

  const handleEditClick = (e: React.MouseEvent, floorId: string) => {
    e.stopPropagation();
    setEditingFloorId(floorId);
  };

  const handleDeleteClick = (e: React.MouseEvent, floorId: string) => {
    e.stopPropagation();
    // Prevent deletion if only one floor exists
    if (floors.length <= 1) {
      alert('Cannot delete the last remaining floor. At least one floor must exist.');
      return;
    }
    
    const floor = floors.find(f => f.id === floorId);
    if (floor && window.confirm(`Are you sure you want to permanently delete floor "${floor.name}"?`)) {
      deleteFloor(floorId);
    }
  };

  const handleContextMenuClick = (e: React.MouseEvent, floorId: string) => {
    e.stopPropagation();
    e.preventDefault();
    console.log('Context menu clicked for floor:', floorId);
    setContextMenuFloorId(contextMenuFloorId === floorId ? null : floorId);
  };

  const handleCopyFloor = (e: React.MouseEvent, sourceFloorId: string) => {
    e.stopPropagation();
    setCopyingFloorId(sourceFloorId);
    setContextMenuFloorId(null);
  };

  const handleContextEdit = (e: React.MouseEvent, floorId: string) => {
    e.stopPropagation();
    setEditingFloorId(floorId);
    setContextMenuFloorId(null);
  };

  const handleContextDelete = (e: React.MouseEvent, floorId: string) => {
    e.stopPropagation();
    setContextMenuFloorId(null);
    handleDeleteClick(e, floorId);
  };

  // Close context menu when clicking elsewhere
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      // Check if the click is outside of any context menu
      if (!target.closest('[data-context-menu]')) {
        setContextMenuFloorId(null);
      }
    };
    
    if (contextMenuFloorId) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [contextMenuFloorId]);

  const handleClose = () => {
    setSidebarOpen(false);
  };

  // Handle responsive backdrop click
  const handleBackdropClick = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  return (
    <>
      <Backdrop
        isOpen={isSidebarOpen && typeof window !== 'undefined' && window.innerWidth < 768}
        onClick={handleBackdropClick}
      />
      <SidebarContainer isOpen={isSidebarOpen}>
        <SidebarHeader>
          <Title>Floors</Title>
          <CloseButton onClick={handleClose}>
            <LuX size={20} />
          </CloseButton>
        </SidebarHeader>

        <FloorsList>
          {floors
            .filter(floor => !floor.groupId || floor.isGroupMaster)
            .map(floor => (
            <FloorItem
              key={floor.id}
              isActive={floor.id === selectedFloorId}
              onClick={() => handleFloorClick(floor.id)}
            >
              <FloorIcon>
                <LuLayers size={20} />
              </FloorIcon>
              <FloorInfo>
                <FloorName>
                  {floor.name}
                  {floor.groupCount && floor.groupCount > 1 && (
                    <GroupBadge>×{floor.groupCount}</GroupBadge>
                  )}
                </FloorName>
                <FloorHeight>({floor.height} mm)</FloorHeight>
              </FloorInfo>
              <FloorActions className="actions">
                <ContextMenuButton data-context-menu>
                  <ActionButton 
                    onClick={e => handleContextMenuClick(e, floor.id)}
                    title="More options"
                    type="button"
                  >
                    ⋮
                  </ActionButton>
                  <ContextMenu isOpen={contextMenuFloorId === floor.id} data-context-menu>
                    <ContextMenuItem onClick={e => handleContextEdit(e, floor.id)}>
                      <LuPencil size={16} />
                      Edit Floor
                    </ContextMenuItem>
                    <ContextMenuItem onClick={e => handleCopyFloor(e, floor.id)}>
                      <LuCopy size={16} />
                      Copy Floor...
                    </ContextMenuItem>
                    <ContextMenuItem 
                      variant={floors.length <= 1 ? 'disabled' : 'danger'}
                      onClick={floors.length <= 1 ? undefined : e => handleContextDelete(e, floor.id)}
                    >
                      <LuTrash2 size={16} />
                      Delete Floor
                    </ContextMenuItem>
                  </ContextMenu>
                </ContextMenuButton>
              </FloorActions>
            </FloorItem>
          ))}
        </FloorsList>

        <AddFloorButton>

          <Button variant="primary" icon={<LuPlus size={20} />} style={{flex:1}} onClick={() => setShowAddModal(true)}>
            Add New Floor
          </Button>
        </AddFloorButton>
      </SidebarContainer>

      {showAddModal && <AddFloorModal onClose={() => setShowAddModal(false)} />}

      {editingFloorId && <EditFloorModal floorId={editingFloorId} onClose={() => setEditingFloorId(null)} />}

      {copyingFloorId && <CopyFloorModal sourceFloorId={copyingFloorId} onClose={() => setCopyingFloorId(null)} />}
    </>
  );
};

export default FloorsSidebar;
