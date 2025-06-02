// src/components/Floors/FloorsSidebar.tsx
import React, { useState } from 'react';
import styled from '@emotion/styled';
import { colors } from '@/styles/theme';
import { useFloorStore } from '@/state/floorStore';
import { LuX, LuLayers, LuPencil, LuTrash2, LuPlus } from 'react-icons/lu';
import AddFloorModal from './AddFloorModal';
import EditFloorModal from './EditFloorModal';

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
`;

const FloorHeight = styled.div`
  font-size: 14px;
  color: #666;
`;

const FloorActions = styled.div`
  display: flex;
  gap: 8px;
  opacity: 0;
  transition: opacity 0.2s;
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
  
  &:hover {
    background: ${colors.gray};
    color: ${colors.black};
  }
  
  &.delete:hover {
    background: #ffebee;
    color: #c62828;
  }
`;

const AddFloorButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: calc(100% - 32px);
  margin: 16px;
  padding: 12px 24px;
  background: #2196f3;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
  
  &:hover {
    background: #1976d2;
  }
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
  const {
    floors,
    selectedFloorId,
    isSidebarOpen,
    selectFloor,
    deleteFloor,
    setSidebarOpen,
  } = useFloorStore();

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingFloorId, setEditingFloorId] = useState<string | null>(null);
  const [floorToDelete, setFloorToDelete] = useState<string | null>(null);

  const handleFloorClick = (floorId: string) => {
    selectFloor(floorId);
  };

  const handleEditClick = (e: React.MouseEvent, floorId: string) => {
    e.stopPropagation();
    setEditingFloorId(floorId);
  };

  const handleDeleteClick = (e: React.MouseEvent, floorId: string) => {
    e.stopPropagation();
    const floor = floors.find(f => f.id === floorId);
    if (floor && window.confirm(`Are you sure you want to permanently delete floor "${floor.name}"?`)) {
      deleteFloor(floorId);
    }
  };

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
      <Backdrop isOpen={isSidebarOpen && typeof window !== 'undefined' && window.innerWidth < 768} onClick={handleBackdropClick} />
      <SidebarContainer isOpen={isSidebarOpen}>
        <SidebarHeader>
          <Title>Floors</Title>
          <CloseButton onClick={handleClose}>
            <LuX size={20} />
          </CloseButton>
        </SidebarHeader>

        <FloorsList>
          {floors.map(floor => (
            <FloorItem
              key={floor.id}
              isActive={floor.id === selectedFloorId}
              onClick={() => handleFloorClick(floor.id)}
            >
              <FloorIcon>
                <LuLayers size={20} />
              </FloorIcon>
              <FloorInfo>
                <FloorName>{floor.name}</FloorName>
                <FloorHeight>({floor.height} mm)</FloorHeight>
              </FloorInfo>
              <FloorActions className="actions">
                <ActionButton onClick={(e) => handleEditClick(e, floor.id)}>
                  <LuPencil size={16} />
                </ActionButton>
                <ActionButton
                  className="delete"
                  onClick={(e) => handleDeleteClick(e, floor.id)}
                >
                  <LuTrash2 size={16} />
                </ActionButton>
              </FloorActions>
            </FloorItem>
          ))}
        </FloorsList>

        <AddFloorButton onClick={() => setShowAddModal(true)}>
          <LuPlus size={20} />
          Add New Floor
        </AddFloorButton>
      </SidebarContainer>

      {showAddModal && (
        <AddFloorModal onClose={() => setShowAddModal(false)} />
      )}

      {editingFloorId && (
        <EditFloorModal
          floorId={editingFloorId}
          onClose={() => setEditingFloorId(null)}
        />
      )}
    </>
  );
};

export default FloorsSidebar;
