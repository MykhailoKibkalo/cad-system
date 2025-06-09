import React, { useState } from 'react';
import { useFloorStore } from '../state/floorStore';
import { Module } from '../types/geometry';
import ModuleEditor from './ModuleEditor';
import styled from '@emotion/styled';

const RendererContainer = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
`;

const PdfImage = styled.img`
  position: absolute;
  user-select: none;
  pointer-events: none;
`;

const ModuleElement = styled.div<{ isSelected?: boolean }>`
  position: absolute;
  border: 2px solid ${props => props.isSelected ? '#ff6b35' : 'rgba(0, 128, 255, 0.5)'};
  box-sizing: border-box;
  cursor: pointer;
  background: ${props => props.isSelected ? 'rgba(255, 107, 53, 0.1)' : 'rgba(0, 128, 255, 0.05)'};
  transition: all 0.2s ease;
  
  &:hover {
    border-color: #ff6b35;
    background: rgba(255, 107, 53, 0.1);
    box-shadow: 0 2px 8px rgba(255, 107, 53, 0.3);
  }
`;

const ModuleLabel = styled.div`
  position: absolute;
  top: 4px;
  left: 4px;
  background: rgba(255, 255, 255, 0.9);
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 12px;
  font-weight: bold;
  color: #333;
  pointer-events: none;
`;

interface FloorRendererProps {
  className?: string;
}

const FloorRenderer: React.FC<FloorRendererProps> = ({ className }) => {
  const floorStore = useFloorStore();
  const activeGridState = floorStore.getActiveGridState();
  const activePdfData = floorStore.getActivePdfData();
  
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);

  if (!activeGridState) {
    return (
      <RendererContainer className={className}>
        <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
          No active floor selected
        </div>
      </RendererContainer>
    );
  }

  const handleModuleClick = (moduleId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setSelectedModuleId(moduleId);
  };

  const handleModuleDoubleClick = (moduleId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setEditingModuleId(moduleId);
  };

  const handleBackgroundClick = () => {
    setSelectedModuleId(null);
  };

  return (
    <RendererContainer className={className} onClick={handleBackgroundClick}>
      {/* PDF Background */}
      {activePdfData && (
        <PdfImage
          src={activePdfData.url}
          alt="Floor PDF"
          style={{
            left: activePdfData.x,
            top: activePdfData.y,
            width: activePdfData.width,
            height: activePdfData.height,
            opacity: activePdfData.opacity,
          }}
        />
      )}
      
      {/* Modules */}
      {activeGridState.modules.map((module: Module) => (
        <ModuleElement
          key={module.id}
          isSelected={selectedModuleId === module.id}
          style={{
            left: module.x0,
            top: module.y0,
            width: module.width,
            height: module.length,
            transform: `rotate(${module.rotation}deg)`,
            transformOrigin: 'top left',
          }}
          onClick={(e) => handleModuleClick(module.id, e)}
          onDoubleClick={(e) => handleModuleDoubleClick(module.id, e)}
          title={`Double-click to edit ${module.name}`}
        >
          <ModuleLabel>{module.name}</ModuleLabel>
        </ModuleElement>
      ))}
      
      {/* Module Editor Modal */}
      {editingModuleId && (
        <ModuleEditor
          moduleId={editingModuleId}
          onClose={() => setEditingModuleId(null)}
        />
      )}
    </RendererContainer>
  );
};

export default FloorRenderer;