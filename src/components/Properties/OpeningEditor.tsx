'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styled from '@emotion/styled';
import { Canvas, Rect, Text as FabricText } from 'fabric';
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
  max-height: 80vh;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  font-family: sans-serif;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const InputLabel = styled(Text)`
  font-size: 16px;
  font-weight: 400;
`;

const Preview = styled.div`
  position: relative;
  width: 100%;
  height: 406px;
  background: #f8f9fa;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  overflow: hidden;
`;

const MenuHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 44px 44px 26px 44px;
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

const ContentWrapper = styled.div`
  display: flex;
  flex: 1;
  gap: 0px;
  min-height: 0;
  overflow: hidden;
`;

const LeftPanel = styled.div`
  width: 50%;
  display: flex;
  flex: 1;
  flex-direction: column;
  padding: 24px 16px 44px 44px;
  min-height: 0;
`;

const RightPanel = styled.div`
  display: flex;
  flex: 1;
  width: 50%;
  padding: 24px 44px 44px 16px;
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

const SuccessMessage = styled.div`
  color: #059669;
  font-size: 14px;
  margin-top: 4px;
  display: flex;
  align-items: center;
  gap: 4px;
`;

const DrowdownWrap = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: 8px;
  margin-top: 8px;
`;

interface OpeningEditorProps {
  moduleId: string;
  onClose: () => void;
  openingId?: string;
}

export default function OpeningEditor({ moduleId, onClose, openingId }: OpeningEditorProps) {
  const modules = useObjectStore(s => s.modules);
  const addOpening = useObjectStore(s => s.addOpening);
  const updateOpening = useObjectStore(s => s.updateOpening);
  const deleteOpening = useObjectStore(s => s.deleteOpening);
  const openings = useObjectStore(s => s.openings);
  const { floorHeightMm } = useCanvasStore();
  const { openingTemplates, addOpeningTemplate } = useTemplateStore();

  const module = useMemo<Module>(() => {
    const m = modules.find(m => m.id === moduleId);
    if (!m) throw new Error(`Module ${moduleId} not found`);
    return m;
  }, [modules, moduleId]);

  const existing = useMemo(() => {
    return openingId ? openings.find(o => o.id === openingId) : null;
  }, [openings, openingId]);

  // Canvas refs
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const fabricCanvasRef = useRef<Canvas | null>(null);
  const wallObjectRef = useRef<Rect | null>(null);
  const openingObjectRef = useRef<Rect | null>(null);
  const widthLabelRef = useRef<FabricText | null>(null);
  const heightLabelRef = useRef<FabricText | null>(null);
  const isUpdatingFromCanvas = useRef(false);
  const currentScaleRef = useRef<number>(1);

  // Form state - ensure integers
  const [tplIndex, setTplIndex] = useState<number | ''>('');
  const [wallSide, setWallSide] = useState<1 | 2 | 3 | 4>(existing?.wallSide ?? 1);
  const [distance, setDistance] = useState(Math.round(existing?.distanceAlongWall ?? 0));
  const [yOffset, setYOffset] = useState(Math.round(existing?.yOffset ?? 0));
  const [width, setWidth] = useState(Math.round(existing?.width ?? Math.min(Math.round(module.width) / 2, 1000)));
  const [height, setHeight] = useState(Math.round(existing?.height ?? Math.min(Math.round(floorHeightMm) / 2, 2000)));

  // Validation state
  const [validationErrors, setValidationErrors] = useState<{
    width?: string;
    height?: string;
    distance?: string;
    yOffset?: string;
  }>({});

  // Calculate wall dimensions based on wall side - ensure integers
  const wallDimensions = useMemo(() => {
    const isHorizontal = wallSide === 1 || wallSide === 3;
    return {
      width: Math.round(isHorizontal ? module.width : module.length),
      height: Math.round(floorHeightMm),
      isHorizontal,
    };
  }, [wallSide, module.width, module.length, floorHeightMm]);

  // Validation logic
  useEffect(() => {
    const errors: typeof validationErrors = {};

    if (width <= 0) {
      errors.width = 'Width must be greater than 0';
    } else if (width > wallDimensions.width) {
      errors.width = `Width must be ≤${wallDimensions.width} mm`;
    }

    if (height <= 0) {
      errors.height = 'Height must be greater than 0';
    } else if (height > wallDimensions.height) {
      errors.height = `Height must be ≤${wallDimensions.height} mm`;
    }

    if (distance < 0) {
      errors.distance = 'Distance cannot be negative';
    } else if (distance + width > wallDimensions.width) {
      errors.distance = `Distance + width must be ≤${wallDimensions.width} mm`;
    }

    if (yOffset < 0) {
      errors.yOffset = 'Y-offset cannot be negative';
    } else if (yOffset + height > wallDimensions.height) {
      errors.yOffset = `Y-offset + height must be ≤${wallDimensions.height} mm`;
    }

    setValidationErrors(errors);

    // Update opening object color based on validation
    const opening = openingObjectRef.current;
    if (opening) {
      const hasErrors = Object.keys(errors).length > 0;
      opening.set({
        fill: hasErrors ? 'rgba(239, 68, 68, 0.6)' : 'rgba(245, 158, 11, 0.6)',
        stroke: hasErrors ? '#dc2626' : '#d97706',
      });
      fabricCanvasRef.current?.renderAll();
    }
  }, [width, height, distance, yOffset, wallDimensions]);

  // Initialize Fabric.js canvas
  useEffect(() => {
    if (!canvasContainerRef.current) return;

    const container = canvasContainerRef.current;
    const canvas = new Canvas('preview-canvas', {
      width: container.clientWidth,
      height: container.clientHeight,
      backgroundColor: '#f8f9fa',
      selection: false,
    });

    fabricCanvasRef.current = canvas;

    // Create wall rectangle
    const wallRect = new Rect({
      left: 0,
      top: 0,
      width: 100,
      height: 100,
      fill: '#C0D8FC',
      stroke: '#374151',
      strokeWidth: 2,
      selectable: false,
      evented: false,
      strokeUniform: true,
    });
    wallObjectRef.current = wallRect;
    canvas.add(wallRect);

    // Create dimension labels
    const widthLabel = new FabricText('', {
      fontSize: 14,
      fill: '#374151',
      fontFamily: 'Atkinson Hyperlegible, sans-serif',
      textAlign: 'center',
      selectable: false,
      evented: false,
    });
    widthLabelRef.current = widthLabel;
    canvas.add(widthLabel);

    const heightLabel = new FabricText('', {
      fontSize: 14,
      fill: '#374151',
      fontFamily: 'Atkinson Hyperlegible, sans-serif',
      textAlign: 'center',
      selectable: false,
      evented: false,
      angle: -90,
    });
    heightLabelRef.current = heightLabel;
    canvas.add(heightLabel);

    // Create opening rectangle
    const openingRect = new Rect({
      left: 10,
      top: 10,
      width: 40,
      height: 30,
      fill: 'rgba(245, 158, 11, 0.6)',
      stroke: '#d97706',
      strokeWidth: 2,
      selectable: true,
      evented: true,
      hasControls: true,
      hasBorders: true,
      strokeUniform: true,
      cornerColor: '#636DF8',
      cornerStrokeColor: '#636DF8',
      transparentCorners: false,
      lockRotation: true,
    });
    openingObjectRef.current = openingRect;
    canvas.add(openingRect);

    // Canvas event handlers - ensure integers
    const onObjectMoving = (e: any) => {
      const obj = e.target;
      if (obj !== openingObjectRef.current) return;

      const wall = wallObjectRef.current!;

      // Apply 1mm grid snapping (convert 1mm to canvas pixels) - ensure integers
      const gridPx = Math.round(currentScaleRef.current); // 1mm in canvas pixels
      let left = Math.round(Math.round(obj.left / gridPx) * gridPx);
      let top = Math.round(Math.round(obj.top / gridPx) * gridPx);

      // Constrain to wall bounds
      const objWidth = Math.round(obj.getScaledWidth());
      const objHeight = Math.round(obj.getScaledHeight());

      if (left < Math.round(wall.left)) {
        left = Math.round(wall.left);
      }
      if (top < Math.round(wall.top)) {
        top = Math.round(wall.top);
      }
      if (left + objWidth > Math.round(wall.left) + Math.round(wall.width)) {
        left = Math.round(wall.left) + Math.round(wall.width) - objWidth;
      }
      if (top + objHeight > Math.round(wall.top) + Math.round(wall.height)) {
        top = Math.round(wall.top) + Math.round(wall.height) - objHeight;
      }

      obj.set({ left: Math.round(left), top: Math.round(top) });
      obj.setCoords();
    };

    const onObjectScaling = (e: any) => {
      const obj = e.target;
      if (obj !== openingObjectRef.current) return;

      const wall = wallObjectRef.current!;

      // Calculate current scaled dimensions - ensure integers
      const scaledWidth = Math.round(obj.width * obj.scaleX);
      const scaledHeight = Math.round(obj.height * obj.scaleY);

      // Apply 1mm grid snapping to dimensions - ensure integers
      const gridPx = Math.round(currentScaleRef.current); // 1mm in canvas pixels
      const snappedWidth = Math.max(gridPx, Math.round(Math.round(scaledWidth / gridPx) * gridPx));
      const snappedHeight = Math.max(gridPx, Math.round(Math.round(scaledHeight / gridPx) * gridPx));

      // Constrain to wall bounds
      const maxWidth = Math.round(wall.left) + Math.round(wall.width) - Math.round(obj.left);
      const maxHeight = Math.round(wall.top) + Math.round(wall.height) - Math.round(obj.top);

      const finalWidth = Math.min(snappedWidth, maxWidth);
      const finalHeight = Math.min(snappedHeight, maxHeight);

      // Update scale factors
      obj.scaleX = finalWidth / obj.width;
      obj.scaleY = finalHeight / obj.height;
      obj.setCoords();
    };

    const onObjectModified = (e: any) => {
      const obj = e.target;
      if (obj !== openingObjectRef.current || isUpdatingFromCanvas.current) return;

      isUpdatingFromCanvas.current = true;

      const wall = wallObjectRef.current!;

      // Calculate the scale factors to convert canvas coordinates to real dimensions
      const scaleX = wallDimensions.width / Math.round(wall.width);
      const scaleY = wallDimensions.height / Math.round(wall.height);

      // Get final dimensions - ensure integers
      const finalWidth = Math.round(obj.getScaledWidth());
      const finalHeight = Math.round(obj.getScaledHeight());

      // Convert to real coordinates - ensure integers
      const newDistance = Math.round((Math.round(obj.left) - Math.round(wall.left)) * scaleX);
      const newYOffset = Math.round((Math.round(obj.top) - Math.round(wall.top)) * scaleY);
      const newWidth = Math.round(finalWidth * scaleX);
      const newHeight = Math.round(finalHeight * scaleY);

      // Update form state - ensure integers
      setDistance(Math.max(0, Math.round(newDistance)));
      setYOffset(Math.max(0, Math.round(newYOffset)));
      setWidth(Math.max(1, Math.round(newWidth)));
      setHeight(Math.max(1, Math.round(newHeight)));

      // Normalize the object to have scale 1:1 with new dimensions
      obj.set({
        width: Math.round(finalWidth),
        height: Math.round(finalHeight),
        scaleX: 1,
        scaleY: 1,
      });
      obj.setCoords();

      setTimeout(() => {
        isUpdatingFromCanvas.current = false;
      }, 100);
    };

    canvas.on('object:moving', onObjectMoving);
    canvas.on('object:scaling', onObjectScaling);
    canvas.on('object:modified', onObjectModified);

    // Handle container resize
    const resizeObserver = new ResizeObserver(() => {
      updateCanvasSize();
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      canvas.dispose();
      fabricCanvasRef.current = null;
      wallObjectRef.current = null;
      openingObjectRef.current = null;
      widthLabelRef.current = null;
      heightLabelRef.current = null;
    };
  }, []);

  // Update canvas size and scale
  const updateCanvasSize = useCallback(() => {
    const canvas = fabricCanvasRef.current;
    const container = canvasContainerRef.current;
    if (!canvas || !container) return;

    const containerWidth = Math.round(container.clientWidth);
    const containerHeight = Math.round(container.clientHeight);

    canvas.setDimensions({
      width: containerWidth,
      height: containerHeight,
    });

    updateCanvasObjects();
  }, [wallDimensions, distance, yOffset, width, height]);

  // Update canvas objects based on current state
  const updateCanvasObjects = useCallback(() => {
    const canvas = fabricCanvasRef.current;
    const wall = wallObjectRef.current;
    const opening = openingObjectRef.current;
    const widthLabel = widthLabelRef.current;
    const heightLabel = heightLabelRef.current;
    if (!canvas || !wall || !opening || !widthLabel || !heightLabel || isUpdatingFromCanvas.current) return;

    const containerWidth = Math.round(canvas.width!);
    const containerHeight = Math.round(canvas.height!);

    // Calculate scale to fit wall in container with padding
    const padding = 60; // Increased padding for dimension labels
    const availableWidth = containerWidth - 2 * padding;
    const availableHeight = containerHeight - 2 * padding;

    const scaleX = availableWidth / wallDimensions.width;
    const scaleY = availableHeight / wallDimensions.height;
    const scale = Math.min(scaleX, scaleY, 0.5); // Max scale of 0.5 for better visibility

    // Store current scale for grid snapping (1mm in canvas pixels)
    currentScaleRef.current = scale;

    // Update wall size and position - ensure integers
    const wallWidth = Math.round(wallDimensions.width * scale);
    const wallHeight = Math.round(wallDimensions.height * scale);
    const wallLeft = Math.round((containerWidth - wallWidth) / 2);
    const wallTop = Math.round((containerHeight - wallHeight) / 2);

    wall.set({
      left: Math.round(wallLeft),
      top: Math.round(wallTop),
      width: Math.round(wallWidth),
      height: Math.round(wallHeight),
    });

    // Update opening size and position - ensure integers
    const openingWidth = Math.round(width * scale);
    const openingHeight = Math.round(height * scale);
    const openingLeft = Math.round(wallLeft + distance * scale);
    const openingTop = Math.round(wallTop + yOffset * scale);

    opening.set({
      left: Math.round(openingLeft),
      top: Math.round(openingTop),
      width: Math.round(openingWidth),
      height: Math.round(openingHeight),
      scaleX: 1,
      scaleY: 1,
    });

    // Update dimension labels
    widthLabel.set({
      text: `${wallDimensions.width} mm`,
      left: Math.round(wallLeft + wallWidth / 2),
      top: Math.round(wallTop + wallHeight + 15),
    });

    heightLabel.set({
      text: `${wallDimensions.height} mm`,
      left: Math.round(wallLeft - 25),
      top: Math.round(wallTop + wallHeight / 2),
    });

    wall.setCoords();
    opening.setCoords();
    canvas.renderAll();
  }, [wallDimensions, distance, yOffset, width, height]);

  // Update canvas when dimensions change
  useEffect(() => {
    updateCanvasObjects();
  }, [updateCanvasObjects]);

  // Apply template - ensure integers
  useEffect(() => {
    if (tplIndex === '') return;
    const tpl = openingTemplates[tplIndex];
    if (!tpl) return;
    setWallSide(tpl.wallSide);
    setDistance(Math.round(tpl.distanceAlongWall));
    setYOffset(Math.round(tpl.yOffset));
    setWidth(Math.round(tpl.width));
    setHeight(Math.round(tpl.height));
  }, [tplIndex, openingTemplates]);

  const onSubmit = () => {
    if (Object.keys(validationErrors).length > 0) return;

    if (existing) {
      updateOpening(existing.id, {
        wallSide,
        distanceAlongWall: Math.round(distance),
        yOffset: Math.round(yOffset),
        width: Math.round(width),
        height: Math.round(height),
      });
    } else {
      const id = Date.now().toString();
      addOpening({
        id,
        moduleId,
        wallSide,
        distanceAlongWall: Math.round(distance),
        yOffset: Math.round(yOffset),
        width: Math.round(width),
        height: Math.round(height),
      });
    }
    onClose();
  };

  const onSaveTpl = () => {
    addOpeningTemplate({
      wallSide,
      distanceAlongWall: Math.round(distance),
      yOffset: Math.round(yOffset),
      width: Math.round(width),
      height: Math.round(height),
    });
  };

  const hasValidationErrors = Object.keys(validationErrors).length > 0;

  // Template selector dropdown
  const templateOptions: DropdownOption[] = [
    { value: '', label: 'Select template' },
    ...openingTemplates.map((t, i) => ({
      value: i,
      label: `tpl ${i + 1}: w${Math.round(t.width)}×h${Math.round(t.height)}`,
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
              {existing ? 'Edit opening' : 'Add opening'}
            </Text>
            <HiMiniXMark style={{ cursor: 'pointer' }} onClick={onClose} size={24} />
          </MenuHeader>
          <Divider orientation={'horizontal'} />
        </MenuWrap>

        <ContentWrapper>
          <LeftPanel>
            <MenuItem>
              <Text weight={700} size={20}>
                Interactive Preview
              </Text>
              <Text size={14} color="#64748b">
                Drag and resize the opening. Changes sync with form fields.
              </Text>
              <Preview ref={canvasContainerRef}>
                <canvas id="preview-canvas" />
              </Preview>
            </MenuItem>
          </LeftPanel>

          <RightPanel>
            <ScrollContent>
              {/* Template selector */}
              <MenuItem>
                <Text weight={700} size={20}>
                  Template
                </Text>
                <DrowdownWrap>
                  <InputLabel>Select template</InputLabel>
                  <Dropdown
                    options={templateOptions}
                    value={tplIndex}
                    onChange={value => setTplIndex(value === '' ? '' : Number(value))}
                    placeholder="Select template"
                  />
                </DrowdownWrap>
              </MenuItem>

              {/* Wall side */}
              <MenuItem>
                <Text weight={700} size={20}>
                  Wall side
                </Text>
                <DrowdownWrap>
                  <InputLabel>Select wall</InputLabel>
                  <Dropdown
                    options={wallSideOptions}
                    value={wallSide}
                    onChange={value => setWallSide(Number(value) as 1 | 2 | 3 | 4)}
                    placeholder="Select wall side"
                  />
                </DrowdownWrap>
                <Text size={14} color="#64748b">
                  Wall dimensions: {wallDimensions.width} × {wallDimensions.height} mm
                </Text>
              </MenuItem>

              {/* Dimensions */}
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
                      step="1"
                      min="1"
                      value={width}
                      onChange={e => setWidth(Math.max(1, Math.round(parseInt(e.target.value) || 1)))}
                      error={validationErrors.width}
                    />
                    {!validationErrors.width && <SuccessMessage>Maximum: {wallDimensions.width} mm</SuccessMessage>}
                  </div>
                  <div style={{ width: '50%' }}>
                    <Input
                      label="Height"
                      suffix="mm"
                      type="number"
                      step="1"
                      min="1"
                      value={height}
                      onChange={e => setHeight(Math.max(1, Math.round(parseInt(e.target.value) || 1)))}
                      error={validationErrors.height}
                    />
                    {!validationErrors.height && <SuccessMessage>Maximum: {wallDimensions.height} mm</SuccessMessage>}
                  </div>
                </Row>
              </MenuItem>

              {/* Position */}
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
                      step="1"
                      min="0"
                      value={distance}
                      onChange={e => setDistance(Math.max(0, Math.round(parseInt(e.target.value) || 0)))}
                      error={validationErrors.distance}
                    />
                    {!validationErrors.distance && (
                      <SuccessMessage>Available: {Math.max(0, wallDimensions.width - width)} mm</SuccessMessage>
                    )}
                  </div>
                  <div style={{ width: '50%' }}>
                    <Input
                      label="Y-position"
                      suffix="mm"
                      type="number"
                      step="1"
                      min="0"
                      value={yOffset}
                      onChange={e => setYOffset(Math.max(0, Math.round(parseInt(e.target.value) || 0)))}
                      error={validationErrors.yOffset}
                    />
                    {!validationErrors.yOffset && (
                      <SuccessMessage>Available: {Math.max(0, wallDimensions.height - height)} mm</SuccessMessage>
                    )}
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
                    if (existing) {
                      deleteOpening(existing.id);
                    }
                    onClose();
                  }}
                >
                  {existing ? 'Delete' : 'Cancel'}
                </HalfWidthButton>

                <HalfWidthButton
                  variant="primary"
                  icon={<LuPlus size={20} />}
                  onClick={onSubmit}
                  disabled={hasValidationErrors}
                >
                  {existing ? 'Save' : 'Add'}
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
