// src/components/debug/DebugHelper.tsx
import React, { useState } from 'react';
import styled from '@emotion/styled';
import { useCad } from '@/context/CadContext';

const DebugContainer = styled.div`
  position: fixed;
  bottom: 0;
  right: 0;
  background-color: rgba(0, 0, 0, 0.7);
  color: #fff;
  padding: 10px;
  font-family: monospace;
  max-width: 400px;
  max-height: 300px;
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

const DebugHelper: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { fabricCanvasRef, activeFloorId, floors, toolState, gridSettings } = useCad();

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
          <strong>Active Floor:</strong> {activeFloor?.name || 'None'} (ID: {activeFloorId})
        </div>
        <div>
          <strong>Active Tool:</strong> {toolState.activeTool}
        </div>
        <div>
          <strong>Selected Object:</strong> {toolState.selectedObjectId || 'None'}
        </div>
        <div>
          <strong>Grid Settings:</strong> {gridSettings.size}px, {gridSettings.snapToGrid ? 'Snap' : 'No Snap'}
        </div>
        <div>
          <strong>Floor Data:</strong>{' '}
          {activeFloor
            ? `${activeFloor.modules.length} modules, ${activeFloor.balconies.length} balconies`
            : 'No floor'}
        </div>
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
