// src/components/debug/DebugHelper.tsx
import React, { useState } from 'react';
import styled from '@emotion/styled';
import { useCad } from '@/context/CadContext';
import { ToolType } from '@/types';
import { fabric } from 'fabric';

const DebugContainer = styled.div`
  position: fixed;
  bottom: 0;
  right: 0;
  background-color: rgba(0, 0, 0, 0.7);
  color: #fff;
  padding: 10px;
  font-family: monospace;
  max-width: 500px;
  max-height: 400px;
  overflow: auto;
  z-index: 9999;
  border-top-left-radius: 8px;
  font-size: 12px;
`;

const DebugButton = styled.button`
  position: fixed;
  bottom: 10px;
  right: 10px;
  background-color: #f44336;
  color: white;
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  font-size: 20px;
  cursor: pointer;
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);

  &:hover {
    background-color: #d32f2f;
  }
`;

const ToolButton = styled.button<{ active?: boolean }>`
  padding: 5px 10px;
  background-color: ${props => (props.active ? '#4CAF50' : '#555')};
  color: white;
  border: none;
  border-radius: 4px;
  margin: 5px;
  cursor: pointer;

  &:hover {
    background-color: ${props => (props.active ? '#3e8e41' : '#444')};
  }
`;

const DebugTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 10px;

  th,
  td {
    border: 1px solid #444;
    padding: 4px 8px;
    text-align: left;
  }

  th {
    background-color: #333;
  }
`;

const DebugHelper: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { fabricCanvasRef, activeFloorId, floors, toolState, gridSettings, setToolState } = useCad();

  const toggleOpen = () => setIsOpen(!isOpen);

  const forceDrawModule = () => {
    if (!fabricCanvasRef.current) return;

    const canvas = fabricCanvasRef.current;
    const activeFloor = floors.find(f => f.id === activeFloorId);

    if (!activeFloor) return;

    // Force draw a test module
    const rect = new fabric.Rect({
      left: 100,
      top: 100,
      width: 100,
      height: 100,
      fill: 'red',
      stroke: '#333',
      strokeWidth: 2,
    });

    rect.data = {
      type: 'module',
      id: 'test-module-' + Date.now(),
      floorId: activeFloor.id,
    };

    canvas.add(rect);
    canvas.renderAll();

    console.log('Test module drawn');
  };

  const logCanvasState = () => {
    if (!fabricCanvasRef.current) {
      console.log('Canvas reference is null');
      return;
    }

    const canvas = fabricCanvasRef.current;
    console.log('Canvas Objects:', canvas.getObjects());
    console.log('Active Object:', canvas.getActiveObject());
    console.log('Canvas Size:', {
      width: canvas.getWidth(),
      height: canvas.getHeight(),
    });
    console.log('Viewport Transform:', canvas.viewportTransform);
  };

  const resetCanvas = () => {
    if (!fabricCanvasRef.current) return;

    const canvas = fabricCanvasRef.current;
    canvas.clear();
    canvas.renderAll();

    console.log('Canvas reset');
  };

  const changeTool = (tool: ToolType) => {
    console.log(`Debug - Changing tool to: ${tool}`);
    setToolState({ activeTool: tool, selectedObjectId: null });
  };

  if (!isOpen) {
    return <DebugButton onClick={toggleOpen}>🐞</DebugButton>;
  }

  const activeFloor = floors.find(f => f.id === activeFloorId);

  return (
    <>
      <DebugButton onClick={toggleOpen}>✕</DebugButton>
      <DebugContainer>
        <h3>Debug Panel</h3>

        <div>
          <strong>Active Tool:</strong> {toolState.activeTool}
          <div style={{ marginTop: '5px' }}>
            <ToolButton active={toolState.activeTool === ToolType.SELECT} onClick={() => changeTool(ToolType.SELECT)}>
              Select
            </ToolButton>
            <ToolButton active={toolState.activeTool === ToolType.MODULE} onClick={() => changeTool(ToolType.MODULE)}>
              Module
            </ToolButton>
            <ToolButton active={toolState.activeTool === ToolType.BALCONY} onClick={() => changeTool(ToolType.BALCONY)}>
              Balcony
            </ToolButton>
            <ToolButton
              active={toolState.activeTool === ToolType.OPENING_DOOR}
              onClick={() => changeTool(ToolType.OPENING_DOOR)}
            >
              Door
            </ToolButton>
            <ToolButton
              active={toolState.activeTool === ToolType.OPENING_WINDOW}
              onClick={() => changeTool(ToolType.OPENING_WINDOW)}
            >
              Window
            </ToolButton>
          </div>
        </div>

        <DebugTable>
          <thead>
            <tr>
              <th>Property</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Active Floor</td>
              <td>
                {activeFloor?.name || 'None'} (ID: {activeFloorId})
              </td>
            </tr>
            <tr>
              <td>Selected Object</td>
              <td>{toolState.selectedObjectId || 'None'}</td>
            </tr>
            <tr>
              <td>Grid Settings</td>
              <td>
                {gridSettings.size}px, {gridSettings.snapToGrid ? 'Snap' : 'No Snap'}
              </td>
            </tr>
            <tr>
              <td>Floor Data</td>
              <td>
                {activeFloor
                  ? `${activeFloor.modules.length} modules, ${activeFloor.balconies.length} balconies`
                  : 'No floor'}
              </td>
            </tr>
          </tbody>
        </DebugTable>

        <hr />
        <div>
          <button onClick={forceDrawModule} style={{ marginRight: 8 }}>
            Draw Test Module
          </button>
          <button onClick={logCanvasState} style={{ marginRight: 8 }}>
            Log Canvas State
          </button>
          <button onClick={resetCanvas}>Reset Canvas</button>
        </div>
      </DebugContainer>
    </>
  );
};

export default DebugHelper;
