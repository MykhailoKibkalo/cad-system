// src/components/ui/ForceToolSelection.tsx
import React from 'react';
import styled from '@emotion/styled';
import { useCad } from '@/context/CadContext';
import { ToolType } from '@/types';

const ToolContainer = styled.div`
  position: fixed;
  bottom: 70px;
  right: 10px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 5px;
`;

const ToolButton = styled.button<{ active?: boolean }>`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: ${props => (props.active ? '#4CAF50' : '#444')};
  color: white;
  border: none;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);

  &:hover {
    background-color: ${props => (props.active ? '#3e8e41' : '#333')};
  }
`;

/**
 * This is a temporary component to force-select tools when regular buttons don't work
 */
const ForceToolSelection: React.FC = () => {
  const { toolState, setToolState } = useCad();

  const selectTool = (tool: ToolType) => {
    console.log(`Force selecting tool: ${tool}`);
    setToolState({ activeTool: tool, selectedObjectId: null });
  };

  return (
    <ToolContainer>
      <ToolButton
        active={toolState.activeTool === ToolType.SELECT}
        onClick={() => selectTool(ToolType.SELECT)}
        title="Select Tool"
      >
        S
      </ToolButton>
      <ToolButton
        active={toolState.activeTool === ToolType.MODULE}
        onClick={() => selectTool(ToolType.MODULE)}
        title="Module Tool"
      >
        M
      </ToolButton>
      <ToolButton
        active={toolState.activeTool === ToolType.BALCONY}
        onClick={() => selectTool(ToolType.BALCONY)}
        title="Balcony Tool"
      >
        B
      </ToolButton>
    </ToolContainer>
  );
};

export default ForceToolSelection;
