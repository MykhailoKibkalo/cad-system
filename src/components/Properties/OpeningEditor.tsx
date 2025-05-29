'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import styled from '@emotion/styled';
import { useObjectStore } from '@/state/objectStore';
import { useCanvasStore } from '@/state/canvasStore';
import { useTemplateStore } from '@/state/templateStore';
import { Module } from '@/types/geometry';
import { Text } from '@/components/ui/Text';
import { HiMiniXMark } from 'react-icons/hi2';
import { Divider } from '@/components/ui/Divider';
import { Input } from '@/components/ui/InputWithAffix';
import { Button } from '@/components/ui/Button';
import { Dropdown, DropdownOption } from '@/components/ui/Dropdown';
import { LuPlus, LuSave, LuTrash2 } from 'react-icons/lu';

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const Box = styled.div`
  background: white;
  border-radius: 8px;
  width: 860px;
  max-width: 90%;
  max-height: 80vh; /* Changed from height to max-height */
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  font-family: sans-serif;
  display: flex;
  flex-direction: column;
  overflow: hidden; /* Added to contain content */
`;

const InputLabel = styled(Text)`
  font-size: 16px;
  font-weight: 400;
  margin-bottom: 8px;
`;

const Preview = styled.div`
  position: relative;
  width: 100%;
  height: 100px;
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  margin: 16px 0;
`;

const OpeningMark = styled.div<{
  left: number;
  width: number;
  bottom: number;
  height: number;
}>`
  position: absolute;
  left: ${p => p.left}px;
  bottom: ${p => p.bottom}px;
  width: ${p => p.width}px;
  height: ${p => p.height}px;
  background: rgba(245, 158, 11, 0.6);
  border: 1px solid #d97706;
  pointer-events: none;
`;

const MenuHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  flex-shrink: 0;
`;

const MenuWrap = styled.div`
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
`;

const MenuItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  width: 100%;
  gap: 8px;
`;

const Row = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  width: 100%;
`;

// Fixed: Added overflow handling
const ContentWrapper = styled.div`
  display: flex;
  flex: 1;
  gap: 32px;
  min-height: 0; 
  overflow: hidden; 
`;

const LeftPanel = styled.div`
  width: 50%;
  display: flex;
  flex: 1;
  flex-direction: column;
  padding: 24px;
  min-height: 0;
`;

const RightPanel = styled.div`
  display: flex;
  flex: 1;
  width: 50%;
  padding: 24px;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
`;

const ScrollContent = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 24px;
  overflow-y: auto;
  min-height: 0;
  padding-right: 8px;
`;

const Footer = styled.div`
  margin-top: 24px;
  flex-shrink: 0;
`;

const ButtonRow = styled.div`
  display: flex;
  width: 100%;
  gap: 12px;
  margin-bottom: 12px;
`;

const HalfWidthButton = styled(Button)`
  flex: 1;
`;

const SaveTemplateRow = styled.div`
  width: 100%;
`;

const FullWidthButton = styled(Button)`
  width: 100%;
`;

interface OpeningEditorProps {
  moduleId: string;
  onClose: () => void;
  openingId?: string;
}

export default function OpeningEditor({ moduleId, onClose, openingId }: OpeningEditorProps) {
  const modules = useObjectStore(s => s.modules);
  const addOpening = useObjectStore(s => s.addOpening);
  const { floorHeightMm } = useCanvasStore();
  const { openingTemplates, addOpeningTemplate } = useTemplateStore();

  const updateOpening = useObjectStore(s => s.updateOpening);
  const deleteOpening = useObjectStore(s => s.deleteOpening);

  const module = useMemo<Module>(() => {
    const m = modules.find(m => m.id === moduleId);
    if (!m) throw new Error(`Module ${moduleId} not found`);
    return m;
  }, [modules, moduleId]);

  // local state
  const [tplIndex, setTplIndex] = useState<number | ''>('');
  const [wallSide, setWallSide] = useState<1 | 2 | 3 | 4>(1);
  const [distance, setDistance] = useState(0);
  const [yOffset, setYOffset] = useState(0);
  const [width, setWidth] = useState(module.width / 2);
  const [height, setHeight] = useState(floorHeightMm / 2);

  // apply template
  useEffect(() => {
    if (tplIndex === '') return;
    const tpl = openingTemplates[tplIndex];
    if (!tpl) return;
    setWallSide(tpl.wallSide);
    setDistance(tpl.distanceAlongWall);
    setYOffset(tpl.yOffset);
    setWidth(tpl.width);
    setHeight(tpl.height);
  }, [tplIndex, openingTemplates]);

  // compute wall-length for horizontal vs vertical
  const isHorizontal = wallSide === 1 || wallSide === 3;
  const realLengthMm = isHorizontal ? module.width : module.length;

  // constraints
  const maxDistance = realLengthMm;
  const maxYOffset = floorHeightMm;
  const maxWidth = Math.max(0, realLengthMm - distance);
  const maxHeight = Math.max(0, floorHeightMm - yOffset);

  // preview measurements
  const previewRef = useRef<HTMLDivElement>(null);
  const [pw, setPw] = useState(0);
  const [ph, setPh] = useState(0);
  useEffect(() => {
    const el = previewRef.current;
    if (!el) return;
    setPw(el.clientWidth);
    setPh(el.clientHeight);
    const ro = new ResizeObserver(es => {
      for (let e of es) {
        setPw(e.contentRect.width);
        setPh(e.contentRect.height);
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // scale: px per mm along wall, and vertical scale
  const pxPerMmX = pw / realLengthMm;
  const pxPerMmY = ph / floorHeightMm;

  const previewLeft = distance * pxPerMmX;
  const previewWidth = width * pxPerMmX;
  const previewBottom = yOffset * pxPerMmY;
  const previewHeight = height * pxPerMmY;

  const opening = openingId ? useObjectStore.getState().openings.find(o => o.id === openingId) : undefined;

  const onSubmit = () => {
    if (opening) {
      updateOpening(opening.id, {
        wallSide,
        distanceAlongWall: distance,
        yOffset,
        width,
        height,
      });
    } else {
      const id = Date.now().toString();
      addOpening({ id, moduleId, wallSide, distanceAlongWall: distance, yOffset, width, height });
    }
    onClose();
  };

  const onSaveTpl = () => {
    addOpeningTemplate({
      wallSide,
      distanceAlongWall: distance,
      yOffset,
      width,
      height,
    });
  };

  // Template selector dropdown
  const templateOptions: DropdownOption[] = [
    { value: '', label: 'Select template' },
    ...openingTemplates.map((t, i) => ({
      value: i,
      label: `tpl ${i + 1}: w${t.width}×h${t.height}`,
    })),
  ];

  // Wall side dropdown
  const wallSideOptions: DropdownOption[] = [
    { value: 1, label: 'Bottom' },
    { value: 2, label: 'Left' },
    { value: 3, label: 'Top' },
    { value: 4, label: 'Right' },
  ];

  return (
    <Overlay>
      <Box>
        <MenuWrap>
          <MenuHeader>
            <Text weight={700} size={32}>
              {opening ? 'Edit opening' : 'Add opening'}
            </Text>
            <HiMiniXMark style={{ cursor: 'pointer' }} onClick={onClose} size={24} />
          </MenuHeader>
          <Divider orientation={'horizontal'} />
        </MenuWrap>

        <ContentWrapper>
          <LeftPanel>
            <MenuItem>
              <Text weight={700} size={20}>
                Preview
              </Text>
              <Preview ref={previewRef}>
                <OpeningMark left={previewLeft} width={previewWidth} bottom={previewBottom} height={previewHeight} />
              </Preview>
            </MenuItem>
          </LeftPanel>

          <RightPanel>
            <ScrollContent>
              {/* — Template selector — */}
              <MenuItem>
                <Text weight={700} size={20}>
                  Template
                </Text>
                <InputLabel>Select template</InputLabel>
                <Dropdown
                  options={templateOptions}
                  value={tplIndex}
                  onChange={value => setTplIndex(value === '' ? '' : Number(value))}
                  placeholder="Select template"
                />
              </MenuItem>

              {/* — Wall side — */}
              <MenuItem>
                <Text weight={700} size={20}>
                  Wall side
                </Text>
                <InputLabel>Select wall</InputLabel>
                <Dropdown
                  options={wallSideOptions}
                  value={wallSide}
                  onChange={value => setWallSide(Number(value) as 1 | 2 | 3 | 4)}
                  placeholder="Select wall side"
                />
              </MenuItem>

              {/* — Dimensions — */}
              <MenuItem>
                <Text weight={700} size={20}>
                  Dimensions
                </Text>
                <Row>
                  <div style={{ width: '50%' }}>
                    <Input
                      label="Width"
                      suffix="mm"
                      type="number"
                      min={1}
                      max={maxWidth}
                      value={width}
                      onChange={e => setWidth(Math.min(maxWidth, Math.max(1, +e.target.value)))}
                    />
                  </div>
                  <div style={{ width: '50%' }}>
                    <Input
                      label="Height"
                      suffix="mm"
                      type="number"
                      min={1}
                      max={maxHeight}
                      value={height}
                      onChange={e => setHeight(Math.min(maxHeight, Math.max(1, +e.target.value)))}
                    />
                  </div>
                </Row>
              </MenuItem>

              {/* — Position — */}
              <MenuItem>
                <Text weight={700} size={20}>
                  Position
                </Text>
                <Row>
                  <div style={{ width: '50%' }}>
                    <Input
                      label="X-position"
                      suffix="mm"
                      type="number"
                      min={0}
                      max={maxDistance}
                      value={distance}
                      onChange={e => setDistance(Math.min(maxDistance, Math.max(0, +e.target.value)))}
                    />
                  </div>
                  <div style={{ width: '50%' }}>
                    <Input
                      label="Y-position"
                      suffix="mm"
                      type="number"
                      min={0}
                      max={maxYOffset}
                      value={yOffset}
                      onChange={e => setYOffset(Math.min(maxYOffset, Math.max(0, +e.target.value)))}
                    />
                  </div>
                </Row>
              </MenuItem>
            </ScrollContent>

            <Footer>
              <ButtonRow>
                <HalfWidthButton
                  variant="danger"
                  icon={<LuTrash2 size={20} />}
                  onClick={() => {
                    if (opening) {
                      deleteOpening(opening.id);
                    }
                    onClose();
                  }}
                >
                  {opening ? 'Delete' : 'Cancel'}
                </HalfWidthButton>

                <HalfWidthButton variant="primary" icon={<LuPlus size={20} />} onClick={onSubmit}>
                  {opening ? 'Save' : 'Add'}
                </HalfWidthButton>
              </ButtonRow>

              <SaveTemplateRow>
                <FullWidthButton variant="ghost" icon={<LuSave size={20} />} onClick={onSaveTpl}>
                  Save as template
                </FullWidthButton>
              </SaveTemplateRow>
            </Footer>
          </RightPanel>
        </ContentWrapper>
      </Box>
    </Overlay>
  );
}
