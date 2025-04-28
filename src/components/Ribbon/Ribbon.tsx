'use client';

import React from 'react';
import styled from '@emotion/styled';
import FileButtons from '../FileButtons';
import { TOOL_GROUPS } from './groups';          // now a factory fn
import useCadStore from '@/store/cadStore';

/* ─────────── styled ─────────── */
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
  background: ${({ isActive }) => (isActive ? '#cce' : 'transparent')};
  padding: 6px 12px;
  cursor: pointer;
  border-radius: 4px;
  opacity: ${({ disabled }) => (disabled ? 0.4 : 1)};
  pointer-events: ${({ disabled }) => (disabled ? 'none' : 'auto')};

  &:hover {
    background: ${({ isActive, disabled }) =>
        disabled ? 'transparent' : isActive ? '#cce' : '#ddd'};
  }
`;

/* ─────────── component ─────────── */
const Ribbon: React.FC = () => {
  const { currentTool, setTool, selectedModuleId } = useCadStore();

  const handleToolClick = (toolId: ReturnType<typeof setTool> extends (arg: infer T) => any ? T : never) => {
    setTool(toolId);
  };

  /* Build button config with enable/disable logic */
  const toolGroups = TOOL_GROUPS(!!selectedModuleId);

  return (
      <RibbonContainer>
        <FileButtons />

        {toolGroups.map(group => (
            <ToolGroup key={group.label}>
              <GroupLabel>{group.label}</GroupLabel>
              {group.buttons.map(btn => (
                  <ToolButton
                      key={btn.id}
                      isActive={currentTool === btn.id}
                      disabled={btn.disabled}
                      onClick={() => !btn.disabled && handleToolClick(btn.id as any)}
                  >
                    {btn.text}
                  </ToolButton>
              ))}
            </ToolGroup>
        ))}
      </RibbonContainer>
  );
};

export default Ribbon;
