import React, { useState, useEffect } from 'react';
import { useFloorStore } from '../state/floorStore';
import { Module, Opening, Balcony, BathroomPod } from '../types/geometry';
import { v4 as uuidv4 } from 'uuid';
import styled from '@emotion/styled';

const EditorContainer = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 24px;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
`;

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
`;

const FormSection = styled.fieldset`
  margin-bottom: 20px;
  padding: 16px;
  border: 1px solid #ddd;
  border-radius: 4px;
  
  legend {
    font-weight: bold;
    padding: 0 8px;
  }
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
  margin-bottom: 16px;
`;

const FormLabel = styled.label`
  display: flex;
  flex-direction: column;
  font-size: 14px;
  
  input {
    margin-top: 4px;
    padding: 8px;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 14px;
  }
`;

const ItemContainer = styled.div`
  border: 1px solid #eee;
  border-radius: 4px;
  padding: 12px;
  margin-bottom: 12px;
  background: #f9f9f9;
`;

const ItemGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 8px;
  margin-bottom: 8px;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' | 'danger' }>`
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  
  ${props => {
    switch (props.variant) {
      case 'primary':
        return `
          background: #007bff;
          color: white;
          &:hover { background: #0056b3; }
        `;
      case 'danger':
        return `
          background: #dc3545;
          color: white;
          &:hover { background: #c82333; }
        `;
      default:
        return `
          background: #6c757d;
          color: white;
          &:hover { background: #545b62; }
        `;
    }
  }}
`;

const SmallButton = styled(Button)`
  padding: 4px 8px;
  font-size: 12px;
`;

interface ModuleEditorProps {
  moduleId: string;
  onClose: () => void;
}

const ModuleEditor: React.FC<ModuleEditorProps> = ({ moduleId, onClose }) => {
  const floorStore = useFloorStore();
  const activeGridState = floorStore.getActiveGridState();
  
  const [editableModule, setEditableModule] = useState<Module | null>(null);
  const [moduleOpenings, setModuleOpenings] = useState<Opening[]>([]);
  const [moduleBalconies, setModuleBalconies] = useState<Balcony[]>([]);
  const [moduleBathroomPods, setModuleBathroomPods] = useState<BathroomPod[]>([]);

  useEffect(() => {
    if (activeGridState) {
      const foundModule = activeGridState.modules.find(m => m.id === moduleId);
      if (foundModule) {
        setEditableModule(JSON.parse(JSON.stringify(foundModule)));
        
        // Load related elements
        setModuleOpenings(activeGridState.openings.filter(o => o.moduleId === moduleId));
        setModuleBalconies(activeGridState.balconies.filter(b => b.moduleId === moduleId));
        setModuleBathroomPods(activeGridState.bathroomPods.filter(bp => bp.moduleId === moduleId));
      }
    }
  }, [activeGridState, moduleId]);

  const handleSave = () => {
    if (!editableModule) return;

    // Update module
    floorStore.updateModule(moduleId, editableModule);

    // Update openings
    const existingOpenings = activeGridState?.openings.filter(o => o.moduleId === moduleId) || [];
    existingOpenings.forEach(opening => {
      if (!moduleOpenings.find(o => o.id === opening.id)) {
        floorStore.deleteOpening(opening.id);
      }
    });
    moduleOpenings.forEach(opening => {
      const existing = existingOpenings.find(o => o.id === opening.id);
      if (existing) {
        floorStore.updateOpening(opening.id, opening);
      } else {
        floorStore.addOpening(opening);
      }
    });

    // Update balconies
    const existingBalconies = activeGridState?.balconies.filter(b => b.moduleId === moduleId) || [];
    existingBalconies.forEach(balcony => {
      if (!moduleBalconies.find(b => b.id === balcony.id)) {
        floorStore.deleteBalcony(balcony.id);
      }
    });
    moduleBalconies.forEach(balcony => {
      const existing = existingBalconies.find(b => b.id === balcony.id);
      if (existing) {
        floorStore.updateBalcony(balcony.id, balcony);
      } else {
        floorStore.addBalcony(balcony);
      }
    });

    // Update bathroom pods
    const existingPods = activeGridState?.bathroomPods.filter(bp => bp.moduleId === moduleId) || [];
    existingPods.forEach(pod => {
      if (!moduleBathroomPods.find(bp => bp.id === pod.id)) {
        floorStore.deleteBathroomPod(pod.id);
      }
    });
    moduleBathroomPods.forEach(pod => {
      const existing = existingPods.find(bp => bp.id === pod.id);
      if (existing) {
        floorStore.updateBathroomPod(pod.id, pod);
      } else {
        floorStore.addBathroomPod(pod);
      }
    });

    onClose();
  };

  if (!editableModule) {
    return (
      <>
        <Overlay onClick={onClose} />
        <EditorContainer>
          <h2>Module not found</h2>
          <Button onClick={onClose}>Close</Button>
        </EditorContainer>
      </>
    );
  }

  return (
    <>
      <Overlay onClick={onClose} />
      <EditorContainer>
        <h2>Edit Module: {editableModule.name}</h2>

        {/* Basic Properties */}
        <FormSection>
          <legend>Basic Properties</legend>
          <FormGrid>
            <FormLabel>
              Name:
              <input
                type="text"
                value={editableModule.name}
                onChange={e => setEditableModule({ ...editableModule, name: e.target.value })}
              />
            </FormLabel>
            <FormLabel>
              Width (mm):
              <input
                type="number"
                value={editableModule.width}
                onChange={e => setEditableModule({ ...editableModule, width: Number(e.target.value) })}
              />
            </FormLabel>
            <FormLabel>
              Length (mm):
              <input
                type="number"
                value={editableModule.length}
                onChange={e => setEditableModule({ ...editableModule, length: Number(e.target.value) })}
              />
            </FormLabel>
            <FormLabel>
              Height (mm):
              <input
                type="number"
                value={editableModule.height}
                onChange={e => setEditableModule({ ...editableModule, height: Number(e.target.value) })}
              />
            </FormLabel>
          </FormGrid>
        </FormSection>

        {/* Position & Transform */}
        <FormSection>
          <legend>Position & Transform</legend>
          <FormGrid>
            <FormLabel>
              X Position (mm):
              <input
                type="number"
                value={editableModule.x0}
                onChange={e => setEditableModule({ ...editableModule, x0: Number(e.target.value) })}
              />
            </FormLabel>
            <FormLabel>
              Y Position (mm):
              <input
                type="number"
                value={editableModule.y0}
                onChange={e => setEditableModule({ ...editableModule, y0: Number(e.target.value) })}
              />
            </FormLabel>
            <FormLabel>
              Z Offset (mm):
              <input
                type="number"
                value={editableModule.zOffset}
                onChange={e => setEditableModule({ ...editableModule, zOffset: Number(e.target.value) })}
              />
            </FormLabel>
            <FormLabel>
              Rotation (°):
              <input
                type="number"
                value={editableModule.rotation}
                onChange={e => setEditableModule({ ...editableModule, rotation: Number(e.target.value) })}
              />
            </FormLabel>
            <FormLabel>
              Stacked Floors:
              <input
                type="number"
                min="1"
                value={editableModule.stackedFloors}
                onChange={e => setEditableModule({ ...editableModule, stackedFloors: Number(e.target.value) })}
              />
            </FormLabel>
          </FormGrid>
        </FormSection>

        {/* Openings */}
        <FormSection>
          <legend>Openings</legend>
          {moduleOpenings.map((opening, idx) => (
            <ItemContainer key={opening.id}>
              <ItemGrid>
                <FormLabel>
                  ID:
                  <input
                    type="text"
                    value={opening.id}
                    onChange={e => {
                      const newOpenings = [...moduleOpenings];
                      newOpenings[idx] = { ...newOpenings[idx], id: e.target.value };
                      setModuleOpenings(newOpenings);
                    }}
                  />
                </FormLabel>
                <FormLabel>
                  Wall Side (1-4):
                  <input
                    type="number"
                    min={1}
                    max={4}
                    value={opening.wallSide}
                    onChange={e => {
                      const newOpenings = [...moduleOpenings];
                      newOpenings[idx] = { ...newOpenings[idx], wallSide: Number(e.target.value) as 1 | 2 | 3 | 4 };
                      setModuleOpenings(newOpenings);
                    }}
                  />
                </FormLabel>
                <FormLabel>
                  Width (mm):
                  <input
                    type="number"
                    value={opening.width}
                    onChange={e => {
                      const newOpenings = [...moduleOpenings];
                      newOpenings[idx] = { ...newOpenings[idx], width: Number(e.target.value) };
                      setModuleOpenings(newOpenings);
                    }}
                  />
                </FormLabel>
                <FormLabel>
                  Height (mm):
                  <input
                    type="number"
                    value={opening.height}
                    onChange={e => {
                      const newOpenings = [...moduleOpenings];
                      newOpenings[idx] = { ...newOpenings[idx], height: Number(e.target.value) };
                      setModuleOpenings(newOpenings);
                    }}
                  />
                </FormLabel>
                <FormLabel>
                  Distance Along Wall (mm):
                  <input
                    type="number"
                    value={opening.distanceAlongWall}
                    onChange={e => {
                      const newOpenings = [...moduleOpenings];
                      newOpenings[idx] = { ...newOpenings[idx], distanceAlongWall: Number(e.target.value) };
                      setModuleOpenings(newOpenings);
                    }}
                  />
                </FormLabel>
                <FormLabel>
                  Y Offset (mm):
                  <input
                    type="number"
                    value={opening.yOffset}
                    onChange={e => {
                      const newOpenings = [...moduleOpenings];
                      newOpenings[idx] = { ...newOpenings[idx], yOffset: Number(e.target.value) };
                      setModuleOpenings(newOpenings);
                    }}
                  />
                </FormLabel>
              </ItemGrid>
              <SmallButton variant="danger" onClick={() => {
                setModuleOpenings(moduleOpenings.filter((_, i) => i !== idx));
              }}>
                Remove Opening
              </SmallButton>
            </ItemContainer>
          ))}
          <Button onClick={() => {
            const newOpening: Opening = {
              id: uuidv4(),
              moduleId: moduleId,
              wallSide: 1,
              width: 1000,
              height: 2100,
              distanceAlongWall: 0,
              yOffset: 0,
            };
            setModuleOpenings([...moduleOpenings, newOpening]);
          }}>
            Add Opening
          </Button>
        </FormSection>

        {/* Balconies */}
        <FormSection>
          <legend>Balconies</legend>
          {moduleBalconies.map((balcony, idx) => (
            <ItemContainer key={balcony.id}>
              <ItemGrid>
                <FormLabel>
                  ID:
                  <input
                    type="text"
                    value={balcony.id}
                    onChange={e => {
                      const newBalconies = [...moduleBalconies];
                      newBalconies[idx] = { ...newBalconies[idx], id: e.target.value };
                      setModuleBalconies(newBalconies);
                    }}
                  />
                </FormLabel>
                <FormLabel>
                  Name:
                  <input
                    type="text"
                    value={balcony.name}
                    onChange={e => {
                      const newBalconies = [...moduleBalconies];
                      newBalconies[idx] = { ...newBalconies[idx], name: e.target.value };
                      setModuleBalconies(newBalconies);
                    }}
                  />
                </FormLabel>
                <FormLabel>
                  Wall Side (1-4):
                  <input
                    type="number"
                    min={1}
                    max={4}
                    value={balcony.wallSide}
                    onChange={e => {
                      const newBalconies = [...moduleBalconies];
                      newBalconies[idx] = { ...newBalconies[idx], wallSide: Number(e.target.value) as 1 | 2 | 3 | 4 };
                      setModuleBalconies(newBalconies);
                    }}
                  />
                </FormLabel>
                <FormLabel>
                  Width (mm):
                  <input
                    type="number"
                    value={balcony.width}
                    onChange={e => {
                      const newBalconies = [...moduleBalconies];
                      newBalconies[idx] = { ...newBalconies[idx], width: Number(e.target.value) };
                      setModuleBalconies(newBalconies);
                    }}
                  />
                </FormLabel>
                <FormLabel>
                  Length (mm):
                  <input
                    type="number"
                    value={balcony.length}
                    onChange={e => {
                      const newBalconies = [...moduleBalconies];
                      newBalconies[idx] = { ...newBalconies[idx], length: Number(e.target.value) };
                      setModuleBalconies(newBalconies);
                    }}
                  />
                </FormLabel>
                <FormLabel>
                  Distance Along Wall (mm):
                  <input
                    type="number"
                    value={balcony.distanceAlongWall}
                    onChange={e => {
                      const newBalconies = [...moduleBalconies];
                      newBalconies[idx] = { ...newBalconies[idx], distanceAlongWall: Number(e.target.value) };
                      setModuleBalconies(newBalconies);
                    }}
                  />
                </FormLabel>
              </ItemGrid>
              <SmallButton variant="danger" onClick={() => {
                setModuleBalconies(moduleBalconies.filter((_, i) => i !== idx));
              }}>
                Remove Balcony
              </SmallButton>
            </ItemContainer>
          ))}
          <Button onClick={() => {
            const newBalcony: Balcony = {
              id: uuidv4(),
              moduleId: moduleId,
              name: `Balcony ${moduleBalconies.length + 1}`,
              width: 2000,
              length: 1500,
              distanceAlongWall: 0,
              wallSide: 1,
            };
            setModuleBalconies([...moduleBalconies, newBalcony]);
          }}>
            Add Balcony
          </Button>
        </FormSection>

        {/* Bathroom Pods */}
        <FormSection>
          <legend>Bathroom Pods</legend>
          {moduleBathroomPods.map((pod, idx) => (
            <ItemContainer key={pod.id}>
              <ItemGrid>
                <FormLabel>
                  ID:
                  <input
                    type="text"
                    value={pod.id}
                    onChange={e => {
                      const newPods = [...moduleBathroomPods];
                      newPods[idx] = { ...newPods[idx], id: e.target.value };
                      setModuleBathroomPods(newPods);
                    }}
                  />
                </FormLabel>
                <FormLabel>
                  Name:
                  <input
                    type="text"
                    value={pod.name}
                    onChange={e => {
                      const newPods = [...moduleBathroomPods];
                      newPods[idx] = { ...newPods[idx], name: e.target.value };
                      setModuleBathroomPods(newPods);
                    }}
                  />
                </FormLabel>
                <FormLabel>
                  Width (mm):
                  <input
                    type="number"
                    value={pod.width}
                    onChange={e => {
                      const newPods = [...moduleBathroomPods];
                      newPods[idx] = { ...newPods[idx], width: Number(e.target.value) };
                      setModuleBathroomPods(newPods);
                    }}
                  />
                </FormLabel>
                <FormLabel>
                  Length (mm):
                  <input
                    type="number"
                    value={pod.length}
                    onChange={e => {
                      const newPods = [...moduleBathroomPods];
                      newPods[idx] = { ...newPods[idx], length: Number(e.target.value) };
                      setModuleBathroomPods(newPods);
                    }}
                  />
                </FormLabel>
                <FormLabel>
                  X Offset (mm):
                  <input
                    type="number"
                    value={pod.x_offset}
                    onChange={e => {
                      const newPods = [...moduleBathroomPods];
                      newPods[idx] = { ...newPods[idx], x_offset: Number(e.target.value) };
                      setModuleBathroomPods(newPods);
                    }}
                  />
                </FormLabel>
                <FormLabel>
                  Y Offset (mm):
                  <input
                    type="number"
                    value={pod.y_offset}
                    onChange={e => {
                      const newPods = [...moduleBathroomPods];
                      newPods[idx] = { ...newPods[idx], y_offset: Number(e.target.value) };
                      setModuleBathroomPods(newPods);
                    }}
                  />
                </FormLabel>
                <FormLabel>
                  Type:
                  <input
                    type="text"
                    value={pod.type || ''}
                    onChange={e => {
                      const newPods = [...moduleBathroomPods];
                      newPods[idx] = { ...newPods[idx], type: e.target.value };
                      setModuleBathroomPods(newPods);
                    }}
                  />
                </FormLabel>
              </ItemGrid>
              <SmallButton variant="danger" onClick={() => {
                setModuleBathroomPods(moduleBathroomPods.filter((_, i) => i !== idx));
              }}>
                Remove Bathroom Pod
              </SmallButton>
            </ItemContainer>
          ))}
          <Button onClick={() => {
            const newPod: BathroomPod = {
              id: uuidv4(),
              moduleId: moduleId,
              name: `Bathroom Pod ${moduleBathroomPods.length + 1}`,
              width: 2000,
              length: 2000,
              x_offset: 0,
              y_offset: 0,
              type: 'Standard',
            };
            setModuleBathroomPods([...moduleBathroomPods, newPod]);
          }}>
            Add Bathroom Pod
          </Button>
        </FormSection>

        {/* Action Buttons */}
        <ButtonGroup>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleSave}>Save Changes</Button>
        </ButtonGroup>
      </EditorContainer>
    </>
  );
};

export default ModuleEditor;