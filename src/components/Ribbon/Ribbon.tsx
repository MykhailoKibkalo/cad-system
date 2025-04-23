'use client';

import React from 'react';
import styled from '@emotion/styled';
import FileButtons from '../FileButtons';
import { TOOL_GROUPS } from './groups';
import useCadStore from '@/store/cadStore';

// Styled components
const RibbonContainer = styled.div`
  display: flex;
  gap: 24px;
  padding: 8px 16px;
  background: #fafafa;
  border-bottom: 1px solid #ddd;
  align-items: center;
`;

const ToolGroup = styled.div`
  display: flex;
  gap: 6px;
  align-items: center;
`;

const GroupLabel = styled.div`
  font-size: 12px;
  color: #666;
  margin-right: 8px;
`;

const ToolButton = styled.button<{ isActive: boolean }>`
  border: none;
  background: ${props => (props.isActive ? '#cce' : 'transparent')};
  padding: 6px 12px;
  cursor: pointer;
  border-radius: 4px;

  &:hover {
    background: ${props => (props.isActive ? '#cce' : '#ddd')};
  }
`;

const Ribbon: React.FC = () => {
  const { currentTool, setTool } = useCadStore();

  const handleToolClick = (
    toolId: 'select' | 'draw-module' | 'copy' | 'remove' | 'draw-opening' | 'draw-balcony' | 'draw-bathroom'
  ) => {
    setTool(toolId);
  };

  return (
    <RibbonContainer>
      <FileButtons />

      {TOOL_GROUPS.map(group => (
        <ToolGroup key={group.label}>
          <GroupLabel>{group.label}</GroupLabel>
          {group.buttons.map(button => (
            <ToolButton
              key={button.id}
              isActive={currentTool === button.id}
              onClick={() =>
                handleToolClick(
                  button.id as
                    | 'select'
                    | 'draw-module'
                    | 'copy'
                    | 'remove'
                    | 'draw-opening'
                    | 'draw-balcony'
                    | 'draw-bathroom'
                )
              }
            >
              {button.text}
            </ToolButton>
          ))}
        </ToolGroup>
      ))}
    </RibbonContainer>
  );
};

export default Ribbon;
