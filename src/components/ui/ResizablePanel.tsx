// src/components/ui/ResizablePanel.tsx
import React, { useEffect, useRef, useState } from 'react';
import styled from '@emotion/styled';

interface ResizablePanelProps {
  children: React.ReactNode;
  defaultWidth: number;
  minWidth: number;
  maxWidth: number;
  title?: string;
}

// Styled components for the panel
const PanelContainer = styled.div<{ width: number; isCollapsed: boolean }>`
  position: relative;
  width: ${props => (props.isCollapsed ? '40px' : `${props.width}px`)};
  height: 100%;
  background-color: #f5f5f5;
  border-left: 1px solid #ccc;
  transition: width 0.3s ease;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const PanelHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background-color: #e0e0e0;
  border-bottom: 1px solid #ccc;
  height: 40px;
`;

const PanelTitle = styled.h3<{ isCollapsed: boolean }>`
  margin: 0;
  font-size: 14px;
  flex-grow: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  writing-mode: ${props => (props.isCollapsed ? 'vertical-rl' : 'horizontal-tb')};
  transform: ${props => (props.isCollapsed ? 'rotate(180deg)' : 'none')};
  transition: transform 0.3s ease;
`;

const PanelContent = styled.div<{ isCollapsed: boolean }>`
  flex-grow: 1;
  overflow-y: auto;
  visibility: ${props => (props.isCollapsed ? 'hidden' : 'visible')};
  opacity: ${props => (props.isCollapsed ? '0' : '1')};
  transition: opacity 0.3s ease;
`;

const ResizeHandle = styled.div<{ isCollapsed: boolean }>`
  position: absolute;
  left: 0;
  top: 0;
  width: 5px;
  height: 100%;
  cursor: col-resize;
  background-color: transparent;
  display: ${props => (props.isCollapsed ? 'none' : 'block')};

  &:hover {
    background-color: rgba(0, 0, 0, 0.1);
  }

  &:active {
    background-color: rgba(0, 0, 0, 0.2);
  }
`;

const ToggleButton = styled.button<{ isCollapsed: boolean }>`
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  width: 24px;
  height: 24px;
  padding: 0;
  transform: ${props => (props.isCollapsed ? 'rotate(180deg)' : 'none')};
  transition: transform 0.3s ease;

  &:hover {
    background-color: rgba(0, 0, 0, 0.1);
    border-radius: 4px;
  }
`;

// Chevron icon component
const ChevronIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

const ResizablePanel: React.FC<ResizablePanelProps> = ({
  children,
  defaultWidth = 300,
  minWidth = 200,
  maxWidth = 600,
  title = 'Properties',
}) => {
  const [width, setWidth] = useState(defaultWidth);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef<number>(0);
  const startWidthRef = useRef<number>(defaultWidth);

  // Handle the start of resizing
  const handleResizeStart = (e: React.MouseEvent) => {
    setIsResizing(true);
    startXRef.current = e.clientX;
    startWidthRef.current = width;
    e.preventDefault();
  };

  // Handle resizing
  useEffect(() => {
    const handleResize = (e: MouseEvent) => {
      if (!isResizing) return;

      const deltaX = startXRef.current - e.clientX;
      const newWidth = Math.max(minWidth, Math.min(maxWidth, startWidthRef.current + deltaX));
      setWidth(newWidth);

      e.preventDefault();
    };

    const handleResizeEnd = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleResize);
      document.addEventListener('mouseup', handleResizeEnd);
    }

    return () => {
      document.removeEventListener('mousemove', handleResize);
      document.removeEventListener('mouseup', handleResizeEnd);
    };
  }, [isResizing, minWidth, maxWidth]);

  // Toggle panel collapsed state
  const toggleCollapsed = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <PanelContainer width={width} isCollapsed={isCollapsed} ref={panelRef}>
      <ResizeHandle isCollapsed={isCollapsed} onMouseDown={handleResizeStart} />
      <PanelHeader>
        <PanelTitle isCollapsed={isCollapsed}>{title}</PanelTitle>
        <ToggleButton onClick={toggleCollapsed} isCollapsed={isCollapsed}>
          <ChevronIcon />
        </ToggleButton>
      </PanelHeader>
      <PanelContent isCollapsed={isCollapsed}>{children}</PanelContent>
    </PanelContainer>
  );
};

export default ResizablePanel;
