// src/components/ui/FloorDropdown.tsx
'use client';

import React, { useEffect, useRef, useState } from 'react';
import styled from '@emotion/styled';
import { Text } from '@/components/ui/Text';
import { LuChevronDown, LuCopy, LuPencil, LuPlus, LuTrash2 } from 'react-icons/lu';
import { colors } from '@/styles/theme';
import {useFloorStore} from "@/state/floorStore";

interface FloorDropdownProps {
  onEditFloor: (floorId?: string) => void;
}

const Container = styled.div`
  position: relative;
  display: inline-block;
`;

const Trigger = styled.div<{ isOpen: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  min-width: 200px;
  background: ${props => (props.isOpen ? '#f8fafc' : 'transparent')};
  border: 1px solid ${props => (props.isOpen ? '#e2e8f0' : 'transparent')};
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  user-select: none;

  &:hover {
    background: #f8fafc;
    border-color: #e2e8f0;
  }
`;

const FloorName = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Arrow = styled(LuChevronDown)<{ isOpen: boolean }>`
  transform: rotate(${props => (props.isOpen ? '180deg' : '0deg')});
  transition: transform 0.2s;
  flex-shrink: 0;
`;

const Dropdown = styled.div<{ isOpen: boolean }>`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 10000;
  margin-top: 4px;
  max-height: 300px;
  overflow-y: auto;
  opacity: ${props => (props.isOpen ? 1 : 0)};
  visibility: ${props => (props.isOpen ? 'visible' : 'hidden')};
  transform: translateY(${props => (props.isOpen ? '0' : '-8px')});
  transition: all 0.2s;
  pointer-events: ${props => (props.isOpen ? 'auto' : 'none')};
`;

const FloorItem = styled.div<{ isActive: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  cursor: pointer;
  background: ${props => (props.isActive ? '#eff6ff' : 'transparent')};
  border-bottom: 1px solid #f1f5f9;
  transition: background 0.2s;

  &:hover {
    background: ${props => (props.isActive ? '#dbeafe' : '#f8fafc')};
  }

  &:last-child {
    border-bottom: none;
  }
`;

const FloorInfo = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const FloorNameText = styled(Text)<{ isActive: boolean }>`
  font-weight: ${props => (props.isActive ? 600 : 400)};
  color: ${props => (props.isActive ? '#1d4ed8' : '#374151')};
`;

const FloorHeight = styled(Text)`
  font-size: 12px;
  color: #64748b;
`;

const ContextMenu = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s;

  ${FloorItem}:hover & {
    opacity: 1;
  }
`;

const ContextButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  border-radius: 4px;
  cursor: pointer;
  color: #64748b;
  transition: all 0.2s;

  &:hover {
    background: #e2e8f0;
    color: #374151;
  }

  &:hover.danger {
    background: #fef2f2;
    color: #dc2626;
  }
`;

const AddFloorItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  cursor: pointer;
  color: ${colors.primary};
  border-top: 1px solid #f1f5f9;
  transition: background 0.2s;

  &:hover {
    background: #eff6ff;
  }
`;

const NoFloorsMessage = styled.div`
  padding: 16px;
  text-align: center;
  color: #64748b;
`;

export default function FloorDropdown({ onEditFloor }: FloorDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const { floors, currentFloorId, setCurrentFloor, copyFloor, deleteFloor, getCurrentFloor } = useFloorStore();

  const currentFloor = getCurrentFloor();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleFloorSelect = (floorId: string) => {
    setCurrentFloor(floorId);
    setIsOpen(false);
  };

  const handleEditFloor = (e: React.MouseEvent, floorId: string) => {
    e.stopPropagation();
    onEditFloor(floorId);
    setIsOpen(false);
  };

  const handleCopyFloor = (e: React.MouseEvent, floorId: string) => {
    e.stopPropagation();
    copyFloor(floorId);
  };

  const handleDeleteFloor = (e: React.MouseEvent, floorId: string) => {
    e.stopPropagation();
    if (floors.length <= 1) {
      alert('Cannot delete the last floor');
      return;
    }

    if (confirm('Are you sure you want to delete this floor? This action cannot be undone.')) {
      deleteFloor(floorId);
    }
  };

  const handleAddFloor = () => {
    onEditFloor(); // No ID means create new
    setIsOpen(false);
  };

  return (
    <Container ref={containerRef}>
      <Trigger isOpen={isOpen} onClick={() => setIsOpen(!isOpen)}>
        <FloorName>
          {currentFloor ? (
            <>
              <Text size={16}>{currentFloor.name}</Text>
              <Text size={14} color="#64748b">
                ({Math.round(currentFloor.height)} mm)
              </Text>
            </>
          ) : (
            <Text size={16} color="#64748b">
              No floors. Add a floor.
            </Text>
          )}
        </FloorName>
        <Arrow isOpen={isOpen} size={16} />
      </Trigger>

      <Dropdown isOpen={isOpen}>
        {floors.length === 0 ? (
          <NoFloorsMessage>
            <Text size={14}>No floors available</Text>
          </NoFloorsMessage>
        ) : (
          floors.map(floor => (
            <FloorItem
              key={floor.id}
              isActive={floor.id === currentFloorId}
              onClick={() => handleFloorSelect(floor.id)}
            >
              <FloorInfo>
                <FloorNameText isActive={floor.id === currentFloorId} size={14}>
                  {floor.name}
                </FloorNameText>
                <FloorHeight>Height: {Math.round(floor.height)} mm</FloorHeight>
              </FloorInfo>

              <ContextMenu>
                <ContextButton onClick={e => handleEditFloor(e, floor.id)} title="Edit floor">
                  <LuPencil size={14} />
                </ContextButton>
                <ContextButton onClick={e => handleCopyFloor(e, floor.id)} title="Copy floor">
                  <LuCopy size={14} />
                </ContextButton>
                <ContextButton
                  className="danger"
                  onClick={e => handleDeleteFloor(e, floor.id)}
                  title="Delete floor"
                  disabled={floors.length <= 1}
                >
                  <LuTrash2 size={14} />
                </ContextButton>
              </ContextMenu>
            </FloorItem>
          ))
        )}

        <AddFloorItem onClick={handleAddFloor}>
          <LuPlus size={16} />
          <Text size={14} weight={500}>
            Add New Floor
          </Text>
        </AddFloorItem>
      </Dropdown>
    </Container>
  );
}
