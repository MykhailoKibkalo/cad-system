// src/components/Properties/PropertyPanel.tsx
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import styled from '@emotion/styled';
import { useSelectionStore } from '@/state/selectionStore';
import { useObjectStore } from '@/state/objectStore';
import { useCanvasStore } from '@/state/canvasStore';
import OpeningEditor from './OpeningEditor';
import { Canvas } from 'fabric';
import CorridorProperties from '@/components/Properties/CorridorProperties';
import { Panel } from '@/components/ui/Panel';
import BathroomPodProperties from './BathroomPodProperties';
import { useToolStore } from '@/state/toolStore';
import GroupProperties from '@/components/Properties/GroupProperties';
import BalconyProperties from '@/components/Properties/BalconyProperties';
import BalconyEditor from '@/components/Properties/BalconyEditor';
import { Text } from '@/components/ui/Text';
import { HiMiniXMark } from 'react-icons/hi2';
import { Divider } from '@/components/ui/Divider';
import { Button } from '../ui/Button';
import { LuBath, LuCopy, LuDoorClosed, LuPencil, LuTrash2 } from 'react-icons/lu';
import { MdBalcony } from 'react-icons/md';
import { InputWithAffix } from '@/components/ui/InputWithAffix';
import { ContextMenu } from '@/components/ui/ContextMenu';

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
`;

const Label = styled.label`
  display: block;
  font-size: 16px;
  margin-bottom: 4px;
`;

const MenuHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  flex-shrink: 0;
`;

const MenuItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 24px;
  width: 100%;
  gap: 16px;
  border-top: 1px solid #f1f5f9;
`;

const Row = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
`;

const ScrollContent = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  overflow-y: auto;
  min-height: 0;
`;

const Footer = styled.div`
  flex-shrink: 0;
  background: white;
  border-top: 1px solid #f1f5f9;
`;

// New styled components for item lists
const ItemList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
`;

const ItemRow = styled.li`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 16px;
  border-radius: 8px;
  position: relative;
  transition: all .2s;
  
  :hover {
    background: #f8fafc;
  }
`;

const ItemContent = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
`;

const ItemIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  color: #636df8;
`;

const ItemText = styled.div`
  flex: 1;
`;

const ItemDescription = styled.span`
  font-size: 14px;
  color: #64748b;
  line-height: 1.4;
`;

export default function PropertyPanel({ canvas }: { canvas: Canvas | null }) {
  const selectedModuleId = useSelectionStore(s => s.selectedModuleId);
  const selectedBathroomPodId = useSelectionStore(s => s.selectedBathroomPodId);
  const selectedCorridorId = useSelectionStore(s => s.selectedCorridorId);
  const selectedBalconyId = useSelectionStore(s => s.selectedBalconyId);
  const [adding, setAdding] = useState(false);
  const [editingOpeningId, setEditingOpeningId] = useState<string | null>(null);

  const modules = useObjectStore(s => s.modules);
  const deleteModule = useObjectStore(s => s.deleteModule);
  const openingsAll = useObjectStore(s => s.openings);
  const deleteOpening = useObjectStore(s => s.deleteOpening);
  const addOpening = useObjectStore(s => s.addOpening);
  const updateModule = useObjectStore(s => s.updateModule);
  const scaleFactor = useCanvasStore(s => s.scaleFactor);
  const bathroomPodsAll = useObjectStore(s => s.bathroomPods);
  const deleteBathroomPod = useObjectStore(s => s.deleteBathroomPod);
  const addBathroomPod = useObjectStore(s => s.addBathroomPod);
  const balconiesAll = useObjectStore(s => s.balconies);
  const deleteBalcony = useObjectStore(s => s.deleteBalcony);
  const addBalcony = useObjectStore(s => s.addBalcony);
  const { setTool } = useToolStore();

  const [addingBalcony, setAddingBalcony] = useState(false);
  const [editingBalconyId, setEditingBalconyId] = useState<string | null>(null);

  const module = useMemo(() => modules.find(m => m.id === selectedModuleId) ?? null, [modules, selectedModuleId]);
  const openings = useMemo(
    () => openingsAll.filter(o => o.moduleId === selectedModuleId),
    [openingsAll, selectedModuleId]
  );

  const bathroomPods = bathroomPodsAll.filter(bp => bp.moduleId === selectedModuleId);
  const balconies = balconiesAll.filter(b => b.moduleId === selectedModuleId);

  const [form, setForm] = useState({ name: '', width: '', length: '' });

  useEffect(() => {
    if (module) {
      setForm({
        name: module.name,
        width: module.width.toString(),
        length: module.length.toString(),
      });
    } else {
      setForm({ name: '', width: '', length: '' });
    }
  }, [module]);

  const onChange = (field: 'name' | 'width' | 'length' | 'showBorder') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setForm(f => ({ ...f, [field]: v }));
    if (!module) return;

    const updates: Partial<typeof module> = {};
    if (field === 'showBorder') {
      const show = e.target.checked;
      updateModule(module.id, { showBorder: show });
      const obj = canvas?.getObjects().find(o => (o as any).isModule === module.id);
      obj?.set({ strokeWidth: show ? 2 : 0 });
      canvas?.requestRenderAll();
      return;
    }
    if (field === 'name') {
      updates.name = v;
    } else {
      const num = parseFloat(v);
      if (isNaN(num)) return;
      updates[field] = num;
      const obj = canvas?.getObjects().find(o => (o as any).isModule === module.id);
      if (obj) {
        if (field === 'width') obj.set({ width: num * scaleFactor });
        if (field === 'length') obj.set({ height: num * scaleFactor });
        obj.setCoords();
        canvas!.requestRenderAll();
      }
    }
    updateModule(module.id, updates);
  };

  const onDeleteModule = () => {
    if (module && module.id) {
      canvas?.getObjects().forEach(o => {
        const anyO = o as any;
        if (anyO.isModule === module.id) {
          canvas.remove(o);
        }
        if (anyO.isOpening && anyO.moduleId === module.id) {
          canvas.remove(o);
        }
      });

      canvas?.requestRenderAll();
      deleteModule(module.id);
      useSelectionStore.getState().setSelectedModuleId(null);
    }
  };

  // Handle copy actions
  const handleCopyOpening = (opening: any) => {
    const newOpening = {
      ...opening,
      id: `opening_${Date.now()}`,
      distanceAlongWall: opening.distanceAlongWall + 100, // Offset slightly
    };
    addOpening(newOpening);
    canvas?.requestRenderAll();
  };

  const handleCopyBathroomPod = (pod: any) => {
    const newPod = {
      ...pod,
      id: `BP${Date.now()}`,
      name: `${pod.name}_copy`,
      x_offset: pod.x_offset + 100, // Offset slightly
    };
    addBathroomPod(newPod);
    canvas?.requestRenderAll();
  };

  const handleCopyBalcony = (balcony: any) => {
    const newBalcony = {
      ...balcony,
      id: `BC${Date.now()}`,
      name: `${balcony.name}_copy`,
      distanceAlongWall: balcony.distanceAlongWall + 100, // Offset slightly
    };
    addBalcony(newBalcony);
    canvas?.requestRenderAll();
  };

  // Check for group selection first
  const selectedGroup = canvas?.getActiveObject?.();
  if (selectedGroup && (selectedGroup as any).type === 'group' && canvas) {
    return <GroupProperties canvas={canvas} />;
  }

  // Check for balcony selection - this should come before checking other selections
  if (selectedBalconyId && canvas) {
    return <BalconyProperties canvas={canvas} />;
  }

  // Check for corridor selection
  if (selectedCorridorId && canvas) {
    return <CorridorProperties canvas={canvas} />;
  }

  // Check for bathroom pod selection
  if (selectedBathroomPodId && canvas) {
    return <BathroomPodProperties canvas={canvas} />;
  }

  // Check for opening editor
  if (editingOpeningId && selectedModuleId) {
    return (
      <OpeningEditor
        moduleId={selectedModuleId}
        openingId={editingOpeningId}
        onClose={() => setEditingOpeningId(null)}
      />
    );
  }

  // Check for balcony editor
  if (editingBalconyId && module) {
    return (
      <BalconyEditor
        module={module}
        balconyId={editingBalconyId}
        onSave={updated => {
          setEditingBalconyId(null);
          canvas?.requestRenderAll();
        }}
        onCancel={() => setEditingBalconyId(null)}
      />
    );
  }

  // If no module is selected, don't show the panel
  if (!module) return null;

  return (
    <Panel>
      {/* Fixed Header */}
      <MenuHeader>
        <Text weight={700} size={24}>
          Module Properties
        </Text>
        <HiMiniXMark
          style={{ cursor: 'pointer' }}
          onClick={() => useSelectionStore.getState().setSelectedModuleId(null)}
          size={24}
        />
      </MenuHeader>

      {/* Scrollable Content */}
      <ScrollContent>
        <MenuItem>
          <Text weight={700} size={20}>
            Information
          </Text>
          <Field>
            <Text size={16}>Name</Text>
            <InputWithAffix value={form.name} onChange={onChange('name')} />
          </Field>
        </MenuItem>

        <Divider orientation={'horizontal'} />

        <MenuItem>
          <Text weight={700} size={20}>
            Dimensions
          </Text>
          <Row>
            <Field>
              <Label htmlFor="prop-width">Width</Label>
              <InputWithAffix
                suffix={'mm'}
                id="prop-width"
                type="number"
                value={form.width}
                onChange={onChange('width')}
              />
            </Field>
            <Field>
              <Label htmlFor="prop-length">Length</Label>
              <InputWithAffix
                suffix={'mm'}
                id="prop-length"
                type="number"
                value={form.length}
                onChange={onChange('length')}
              />
            </Field>
          </Row>
        </MenuItem>

        <Divider orientation={'horizontal'} />

        <MenuItem>
          <Text weight={700} size={20}>
            Openings
          </Text>
          {openings.length > 0 && (
            <ItemList>
              {openings.map(o => (
                <ItemRow key={o.id}>
                  <ItemContent>
                    <ItemIcon>
                      <LuDoorClosed color={'#64748b'} size={16} />
                    </ItemIcon>
                    <ItemText>
                      <ItemDescription>
                        Side {o.wallSide}, dist {o.distanceAlongWall} mm, y {o.yOffset} mm
                      </ItemDescription>
                    </ItemText>
                  </ItemContent>
                  <ContextMenu
                    items={[
                      {
                        label: 'Edit',
                        icon: <LuPencil size={14} />,
                        onClick: () => setEditingOpeningId(o.id),
                      },
                      // {
                      //   label: 'Copy',
                      //   icon: <LuCopy size={14} />,
                      //   onClick: () => handleCopyOpening(o),
                      // },
                      {
                        label: 'Delete',
                        icon: <LuTrash2 size={14} />,
                        onClick: () => {
                          deleteOpening(o.id);
                          canvas?.requestRenderAll();
                        },
                        danger: true,
                      },
                    ]}
                  />
                </ItemRow>
              ))}
            </ItemList>
          )}
          <Button
            onClick={() => setAdding(true)}
            style={{ width: '100%' }}
            variant={'secondary'}
            icon={<LuDoorClosed size={20} />}
          >
            Add Opening
          </Button>
        </MenuItem>

        <Divider orientation={'horizontal'} />

        <MenuItem>
          <Text weight={700} size={20}>
            Bathroom Pods
          </Text>
          {bathroomPods.length > 0 && (
            <ItemList>
              {bathroomPods.map(bp => (
                <ItemRow key={bp.id}>
                  <ItemContent>
                    <ItemIcon>
                      <LuBath color={'#64748b'} size={16} />
                    </ItemIcon>
                    <ItemText>
                      <ItemDescription>
                        {bp.name}: {bp.width}×{bp.length} mm @ ({bp.x_offset},{bp.y_offset})
                      </ItemDescription>
                    </ItemText>
                  </ItemContent>
                  <ContextMenu
                    items={[
                      {
                        label: 'Edit',
                        icon: <LuPencil size={14} />,
                        onClick: () => useSelectionStore.getState().setSelectedBathroomPodId(bp.id),
                      },
                      // {
                      //   label: 'Copy',
                      //   icon: <LuCopy size={14} />,
                      //   onClick: () => handleCopyBathroomPod(bp),
                      // },
                      {
                        label: 'Delete',
                        icon: <LuTrash2 size={14} />,
                        onClick: () => {
                          deleteBathroomPod(bp.id);
                          canvas?.requestRenderAll();
                        },
                        danger: true,
                      },
                    ]}
                  />
                </ItemRow>
              ))}
            </ItemList>
          )}
          <Button
            onClick={() => setTool('bathroomPod')}
            style={{ width: '100%' }}
            variant={'secondary'}
            icon={<LuBath size={20} />}
          >
            Add Bathroom Pod
          </Button>
        </MenuItem>

        <Divider orientation={'horizontal'} />

        <MenuItem>
          <Text weight={700} size={20}>
            Balconies
          </Text>
          {balconies.length > 0 && (
            <ItemList>
              {balconies.map(b => (
                <ItemRow key={b.id}>
                  <ItemContent>
                    <ItemIcon>
                      <MdBalcony color={'#64748b'} size={16} />
                    </ItemIcon>
                    <ItemText>
                      <ItemDescription>
                        {b.name}: {b.width}×{b.length} mm @ {b.distanceAlongWall} mm on side {b.wallSide}
                      </ItemDescription>
                    </ItemText>
                  </ItemContent>
                  <ContextMenu
                    items={[
                      {
                        label: 'Edit',
                        icon: <LuPencil size={14} />,
                        onClick: () => setEditingBalconyId(b.id),
                      },
                      // {
                      //   label: 'Copy',
                      //   icon: <LuCopy size={14} />,
                      //   onClick: () => handleCopyBalcony(b),
                      // },
                      {
                        label: 'Delete',
                        icon: <LuTrash2 size={14} />,
                        onClick: () => {
                          deleteBalcony(b.id);
                          canvas?.requestRenderAll();
                        },
                        danger: true,
                      },
                    ]}
                  />
                </ItemRow>
              ))}
            </ItemList>
          )}
          <Button
            onClick={() => setAddingBalcony(true)}
            style={{ width: '100%' }}
            variant={'secondary'}
            icon={<MdBalcony size={20} />}
          >
            Add Balcony
          </Button>
        </MenuItem>
      </ScrollContent>

      {/* Fixed Footer */}
      <Footer>
        <MenuItem>
          <Button style={{ width: '100%' }} variant={'danger'} onClick={onDeleteModule}>
            Delete Module
          </Button>
        </MenuItem>
      </Footer>

      {/* Modals/Overlays */}
      {addingBalcony && (
        <BalconyEditor
          module={module}
          onSave={() => {
            setAddingBalcony(false);
            canvas?.requestRenderAll();
          }}
          onCancel={() => setAddingBalcony(false)}
        />
      )}
      {adding && <OpeningEditor moduleId={module.id} onClose={() => setAdding(false)} />}
    </Panel>
  );
}
