// src/components/ui/FloorSelector.tsx
import React, { useState } from 'react';
import styled from '@emotion/styled';
import { useCad } from '@/context/CadContext';
import { useHistory } from '@/context/HistoryContext';
import { ActionType } from '@/types';

const FloorSelectorContainer = styled.div`
  display: flex;
  flex-direction: column;
  background-color: #f5f5f5;
  border-top: 1px solid #ccc;
  padding: 8px;
`;

const FloorList = styled.div`
  display: flex;
  gap: 4px;
  margin-bottom: 8px;
  overflow-x: auto;
  padding-bottom: 4px;
`;

const FloorTab = styled.div<{ active: boolean }>`
  padding: 8px 16px;
  background-color: ${props => (props.active ? '#4a90e2' : '#e0e0e0')};
  color: ${props => (props.active ? 'white' : 'black')};
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;

  &:hover {
    background-color: ${props => (props.active ? '#3a80d2' : '#d0d0d0')};
  }
`;

const VisibilityIcon = styled.span<{ visible: boolean }>`
  font-size: 16px;
  cursor: pointer;
  opacity: ${props => (props.visible ? 1 : 0.5)};
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 8px;
`;

const Button = styled.button`
  padding: 6px 12px;
  background-color: #4a90e2;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;

  &:hover {
    background-color: #3a80d2;
  }
`;

const FloorNameInput = styled.input`
  padding: 6px 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
  margin-right: 8px;
`;

const FloorSelector: React.FC = () => {
  const { floors, activeFloorId, setActiveFloorId, addFloor, duplicateFloor, deleteFloor, updateFloor } = useCad();

  const { addAction } = useHistory();
  const [newFloorName, setNewFloorName] = useState('');
  const [isAddingFloor, setIsAddingFloor] = useState(false);

  const handleFloorClick = (floorId: string) => {
    setActiveFloorId(floorId);
  };

  const handleToggleVisibility = (floorId: string, isVisible: boolean) => {
    const floor = floors.find(f => f.id === floorId);
    if (!floor) return;

    // Store the original state for history
    const before = { floor };

    // Update the floor visibility
    updateFloor(floorId, { visible: !isVisible });

    // Find the updated floor for history
    const updatedFloor = floors.find(f => f.id === floorId);
    const after = { floor: updatedFloor };

    // Add to history
    addAction({
      type: ActionType.UPDATE_FLOOR,
      payload: {
        before,
        after,
        id: floorId,
      },
    });
  };

  const handleAddFloor = () => {
    if (isAddingFloor) {
      if (newFloorName.trim() === '') return;

      // Add the new floor
      addFloor(newFloorName.trim());

      // Reset the input
      setNewFloorName('');
      setIsAddingFloor(false);
    } else {
      setIsAddingFloor(true);
    }
  };

  const handleDuplicateFloor = () => {
    if (!activeFloorId) return;

    // Store the original state for history
    const before = {
      floors,
    };

    // Duplicate the floor
    duplicateFloor(activeFloorId);

    // Add to history
    addAction({
      type: ActionType.ADD_FLOOR,
      payload: {
        before,
        after: { floors },
        id: activeFloorId,
      },
    });
  };

  const handleDeleteFloor = () => {
    if (!activeFloorId || floors.length <= 1) return;

    // Store the original state for history
    const floor = floors.find(f => f.id === activeFloorId);
    if (!floor) return;

    const before = { floor };

    // Delete the floor
    deleteFloor(activeFloorId);

    // Add to history
    addAction({
      type: ActionType.DELETE_FLOOR,
      payload: {
        before,
        after: { floor: null },
        id: activeFloorId,
      },
    });
  };

  const handleCancelAdd = () => {
    setNewFloorName('');
    setIsAddingFloor(false);
  };

  return (
    <FloorSelectorContainer>
      <FloorList>
        {floors.map(floor => (
          <FloorTab key={floor.id} active={floor.id === activeFloorId} onClick={() => handleFloorClick(floor.id)}>
            {floor.name}
            <VisibilityIcon
              visible={floor.visible}
              onClick={e => {
                e.stopPropagation();
                handleToggleVisibility(floor.id, floor.visible);
              }}
            >
              {floor.visible ? '👁️' : '👁️‍🗨️'}
            </VisibilityIcon>
          </FloorTab>
        ))}
      </FloorList>

      <ActionButtons>
        {isAddingFloor ? (
          <>
            <FloorNameInput
              value={newFloorName}
              onChange={e => setNewFloorName(e.target.value)}
              placeholder="Floor name"
              autoFocus
            />
            <Button onClick={handleAddFloor}>Add</Button>
            <Button onClick={handleCancelAdd}>Cancel</Button>
          </>
        ) : (
          <>
            <Button onClick={handleAddFloor}>Add Floor</Button>
            <Button onClick={handleDuplicateFloor}>Duplicate Floor</Button>
            <Button onClick={handleDeleteFloor} disabled={floors.length <= 1}>
              Delete Floor
            </Button>
          </>
        )}
      </ActionButtons>
    </FloorSelectorContainer>
  );
};

export default FloorSelector;
