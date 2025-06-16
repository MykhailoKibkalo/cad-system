'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styled from '@emotion/styled';
import { Canvas, Rect, Text as FabricText } from 'fabric';
import * as fabric from 'fabric';
import { useObjectStore } from '@/state/objectStore';
import { useCurrentFloorElements } from '../Canvas/hooks/useFloorElements';
import { Module } from '@/types/geometry';
import { Text } from '@/components/ui/Text';
import { HiMiniXMark } from 'react-icons/hi2';
import { Divider } from '@/components/ui/Divider';
import { Input } from '@/components/ui/InputWithAffix';
import { Button } from '@/components/ui/Button';
import { Dropdown, DropdownOption } from '@/components/ui/Dropdown';
import { LuPlus, LuTrash2 } from 'react-icons/lu';

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

const SuccessMessage = styled.div`
  color: #059669;
  font-size: 14px;
  margin-top: 4px;
  display: flex;
  align-items: center;
  gap: 4px;
`;

const DropdownWrap = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: 8px;
  margin-top: 8px;
`;

interface BathroomPodEditorProps {
  moduleId: string;
  onClose: () => void;
  podId?: string;
}

export default function BathroomPodEditor({ moduleId, onClose, podId }: BathroomPodEditorProps) {
  const { modules, bathroomPods } = useCurrentFloorElements();
  const addBathroomPod = useObjectStore(s => s.addBathroomPod);
  const updateBathroomPod = useObjectStore(s => s.updateBathroomPod);
  const deleteBathroomPod = useObjectStore(s => s.deleteBathroomPod);

  const module = useMemo<Module>(() => {
    const m = modules.find(m => m.id === moduleId);
    if (!m) throw new Error(`Module ${moduleId} not found`);
    return m;
  }, [modules, moduleId]);

  const existing = useMemo(() => {
    return podId ? bathroomPods.find(p => p.id === podId) : null;
  }, [bathroomPods, podId]);

  // Canvas refs
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const fabricCanvasRef = useRef<Canvas | null>(null);
  const moduleFloorRef = useRef<Rect | null>(null);
  const podObjectRef = useRef<Rect | null>(null);
  const widthLabelRef = useRef<FabricText | null>(null);
  const heightLabelRef = useRef<FabricText | null>(null);
  const isUpdatingFromCanvas = useRef(false);
  const currentScaleRef = useRef<number>(1);

  // Predefined bathroom pod dimensions based on type
  const getPodDefaults = useCallback(
    (type: string) => {
      const maxWidth = Math.min(Math.round(module.width) - 200, 3000); // Leave 200mm margin
      const maxLength = Math.min(Math.round(module.length) - 200, 3000);

      switch (type) {
        case 'F': // Full Bathroom
          return {
            width: Math.min(2400, maxWidth),
            length: Math.min(2200, maxLength),
          };
        case 'H': // Half Bathroom
          return {
            width: Math.min(1500, maxWidth),
            length: Math.min(1800, maxLength),
          };
        case 'S': // Shower Only
          return {
            width: Math.min(1200, maxWidth),
            length: Math.min(1200, maxLength),
          };
        case 'T': // Toilet Only
          return {
            width: Math.min(900, maxWidth),
            length: Math.min(1400, maxLength),
          };
        default:
          return {
            width: Math.min(1500, maxWidth),
            length: Math.min(1800, maxLength),
          };
      }
    },
    [module.width, module.length]
  );

  // Form state - using bathroom pod field names - ensure integers
  const [podType, setPodType] = useState(existing?.type ?? 'F');
  const [xOffset, setXOffset] = useState(Math.round(existing?.x_offset ?? 100));
  const [yOffset, setYOffset] = useState(Math.round(existing?.y_offset ?? 100));
  const [width, setWidth] = useState(() => {
    if (existing) return Math.round(existing.width);
    const defaults = getPodDefaults('F');
    return Math.round(defaults.width);
  });
  const [length, setLength] = useState(() => {
    if (existing) return Math.round(existing.length);
    const defaults = getPodDefaults('F');
    return Math.round(defaults.length);
  });

  // Validation state
  const [validationErrors, setValidationErrors] = useState<{
    width?: string;
    length?: string;
    xOffset?: string;
    yOffset?: string;
  }>({});

  // Module dimensions for floor area - ensure integers
  const moduleDimensions = useMemo(
    () => ({
      width: Math.round(module.width),
      height: Math.round(module.length), // Using length as height for top-down floor view
    }),
    [module.width, module.length]
  );

  // Validation logic with 1mm precision (no grid requirement)
  useEffect(() => {
    const errors: typeof validationErrors = {};

    if (width <= 0) {
      errors.width = 'Width must be greater than 0';
    } else if (width > moduleDimensions.width) {
      errors.width = `Width must be ≤${moduleDimensions.width} mm`;
    }

    if (length <= 0) {
      errors.length = 'Length must be greater than 0';
    } else if (length > moduleDimensions.height) {
      errors.length = `Length must be ≤${moduleDimensions.height} mm`;
    }

    if (xOffset < 0) {
      errors.xOffset = 'X-position cannot be negative';
    } else if (xOffset + width > moduleDimensions.width) {
      errors.xOffset = `X-position + width must be ≤${moduleDimensions.width} mm`;
    }

    if (yOffset < 0) {
      errors.yOffset = 'Y-position cannot be negative';
    } else if (yOffset + length > moduleDimensions.height) {
      errors.yOffset = `Y-position + length must be ≤${moduleDimensions.height} mm`;
    }

    setValidationErrors(errors);

    // Update pod object color based on validation
    const pod = podObjectRef.current;
    if (pod) {
      const hasErrors = Object.keys(errors).length > 0;
      pod.set({
        fill: hasErrors ? 'rgba(239, 68, 68, 0.6)' : 'rgba(0, 150, 200, 0.6)',
        stroke: hasErrors ? '#dc2626' : '#0096c8',
      });
      fabricCanvasRef.current?.renderAll();
    }
  }, [width, length, xOffset, yOffset, moduleDimensions]);

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

    // Create module floor rectangle
    const moduleRect = new Rect({
      left: 0,
      top: 0,
      width: 100,
      height: 100,
      fill: '#E8F4FD', // Light blue background for floor
      stroke: '#374151',
      strokeWidth: 2,
      selectable: false,
      evented: false,
      strokeUniform: true,
    });
    moduleFloorRef.current = moduleRect;
    canvas.add(moduleRect);

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

    // Create bathroom pod rectangle
    const podRect = new Rect({
      left: 10,
      top: 10,
      width: 40,
      height: 30,
      fill: 'rgba(0, 150, 200, 0.6)',
      stroke: '#0096c8',
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

    // Add origin indicator for bottom-left coordinate system
    const originGroup = new fabric.Group([
      // X-axis arrow (red)
      new fabric.Path('M 0 0 L 20 0 L 17 -2 M 20 0 L 17 2', {
        stroke: '#ef4444',
        strokeWidth: 1.5,
        fill: 'transparent',
      }),
      // Y-axis arrow (green) pointing up
      new fabric.Path('M 0 0 L 0 -20 L -2 -17 M 0 -20 L 2 -17', {
        stroke: '#10b981',
        strokeWidth: 1.5,
        fill: 'transparent',
      }),
      // Origin point
      new fabric.Circle({
        left: -2,
        top: -2,
        radius: 2,
        fill: '#1f2937',
        stroke: '#1f2937',
      }),
    ], {
      left: 5,
      top: container.clientHeight - 25,
      selectable: false,
      evented: false,
    });
    canvas.add(originGroup);

    // Add coordinate labels
    const coordLabel = new FabricText('(0, 0)', {
      left: 5,
      top: container.clientHeight - 10,
      fontSize: 10,
      fill: '#6b7280',
      fontFamily: 'Atkinson Hyperlegible, sans-serif',
      selectable: false,
      evented: false,
    });
    canvas.add(coordLabel);
    podObjectRef.current = podRect;
    canvas.add(podRect);

    // Canvas event handlers with 1mm precision - ensure integers
    const onObjectMoving = (e: any) => {
      const obj = e.target;
      if (obj !== podObjectRef.current) return;

      const moduleFloor = moduleFloorRef.current!;

      // FIX: Apply 1 pixel grid snapping instead of trying to convert mm to pixels
      // This ensures smooth movement without precision loss
      let left = Math.round(obj.left);
      let top = Math.round(obj.top);

      // Constrain to module bounds
      const objWidth = Math.round(obj.getScaledWidth());
      const objHeight = Math.round(obj.getScaledHeight());

      if (left < Math.round(moduleFloor.left)) {
        left = Math.round(moduleFloor.left);
      }
      if (top < Math.round(moduleFloor.top)) {
        top = Math.round(moduleFloor.top);
      }
      if (left + objWidth > Math.round(moduleFloor.left) + Math.round(moduleFloor.width)) {
        left = Math.round(moduleFloor.left) + Math.round(moduleFloor.width) - objWidth;
      }
      if (top + objHeight > Math.round(moduleFloor.top) + Math.round(moduleFloor.height)) {
        top = Math.round(moduleFloor.top) + Math.round(moduleFloor.height) - objHeight;
      }

      obj.set({ left: Math.round(left), top: Math.round(top) });
      obj.setCoords();
    };

    const onObjectScaling = (e: any) => {
      const obj = e.target;
      if (obj !== podObjectRef.current) return;

      const moduleFloor = moduleFloorRef.current!;

      // Calculate current scaled dimensions - ensure integers
      const scaledWidth = Math.round(obj.width * obj.scaleX);
      const scaledHeight = Math.round(obj.height * obj.scaleY);

      // FIX: Apply pixel-level snapping instead of trying to convert mm to pixels
      const snappedWidth = Math.max(1, Math.round(scaledWidth));
      const snappedHeight = Math.max(1, Math.round(scaledHeight));

      // Constrain to module bounds
      const maxWidth = Math.round(moduleFloor.left) + Math.round(moduleFloor.width) - Math.round(obj.left);
      const maxHeight = Math.round(moduleFloor.top) + Math.round(moduleFloor.height) - Math.round(obj.top);

      const finalWidth = Math.min(snappedWidth, maxWidth);
      const finalHeight = Math.min(snappedHeight, maxHeight);

      // Update scale factors
      obj.scaleX = finalWidth / obj.width;
      obj.scaleY = finalHeight / obj.height;
      obj.setCoords();
    };

    const onObjectModified = (e: any) => {
      const obj = e.target;
      if (obj !== podObjectRef.current || isUpdatingFromCanvas.current) return;

      isUpdatingFromCanvas.current = true;

      const moduleFloor = moduleFloorRef.current!;

      // Calculate the scale factors to convert canvas coordinates to real dimensions
      const scaleX = moduleDimensions.width / Math.round(moduleFloor.width);
      const scaleY = moduleDimensions.height / Math.round(moduleFloor.height);

      // Get final dimensions - ensure integers
      const finalWidth = Math.round(obj.getScaledWidth());
      const finalHeight = Math.round(obj.getScaledHeight());

      // Convert to real coordinates with bottom-left origin
      const newXOffset = Math.round((Math.round(obj.left) - Math.round(moduleFloor.left)) * scaleX);
      // For Y, we need to invert because canvas Y increases downward
      const canvasYOffset = Math.round(obj.top) - Math.round(moduleFloor.top);
      const bottomYOffset = Math.round((Math.round(moduleFloor.height) - canvasYOffset - finalHeight) * scaleY);
      const newWidth = Math.round(finalWidth * scaleX);
      const newLength = Math.round(finalHeight * scaleY);

      // Update form state - ensure integers
      setXOffset(Math.max(0, Math.round(newXOffset)));
      setYOffset(Math.max(0, Math.round(bottomYOffset)));
      setWidth(Math.max(1, Math.round(newWidth)));
      setLength(Math.max(1, Math.round(newLength)));

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
      moduleFloorRef.current = null;
      podObjectRef.current = null;
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
  }, [moduleDimensions, xOffset, yOffset, width, length]);

  // Update canvas objects based on current state
  const updateCanvasObjects = useCallback(() => {
    const canvas = fabricCanvasRef.current;
    const moduleFloor = moduleFloorRef.current;
    const pod = podObjectRef.current;
    const widthLabel = widthLabelRef.current;
    const heightLabel = heightLabelRef.current;
    if (!canvas || !moduleFloor || !pod || !widthLabel || !heightLabel || isUpdatingFromCanvas.current) return;

    const containerWidth = Math.round(canvas.width!);
    const containerHeight = Math.round(canvas.height!);

    // Calculate scale to fit module in container with padding
    const padding = 60;
    const availableWidth = containerWidth - 2 * padding;
    const availableHeight = containerHeight - 2 * padding;

    const scaleX = availableWidth / moduleDimensions.width;
    const scaleY = availableHeight / moduleDimensions.height;
    const scale = Math.min(scaleX, scaleY, 0.5); // Max scale of 0.5 for better visibility

    // Store current scale for grid snapping
    currentScaleRef.current = scale;

    // Update module floor size and position - ensure integers
    const moduleWidth = Math.round(moduleDimensions.width * scale);
    const moduleHeight = Math.round(moduleDimensions.height * scale);
    const moduleLeft = Math.round((containerWidth - moduleWidth) / 2);
    const moduleTop = Math.round((containerHeight - moduleHeight) / 2);

    moduleFloor.set({
      left: Math.round(moduleLeft),
      top: Math.round(moduleTop),
      width: Math.round(moduleWidth),
      height: Math.round(moduleHeight),
    });

    // Update pod size and position with bottom-left coordinates
    const podWidth = Math.round(width * scale);
    const podHeight = Math.round(length * scale);
    const podLeft = Math.round(moduleLeft + xOffset * scale);
    // Convert Y from bottom-left to top-left for canvas rendering
    const podTop = Math.round(moduleTop + moduleHeight - (yOffset + length) * scale);

    pod.set({
      left: Math.round(podLeft),
      top: Math.round(podTop),
      width: Math.round(podWidth),
      height: Math.round(podHeight),
      scaleX: 1,
      scaleY: 1,
    });

    // Update dimension labels
    widthLabel.set({
      text: `${moduleDimensions.width} mm`,
      left: Math.round(moduleLeft + moduleWidth / 2),
      top: Math.round(moduleTop + moduleHeight + 15),
    });

    heightLabel.set({
      text: `${moduleDimensions.height} mm`,
      left: Math.round(moduleLeft - 25),
      top: Math.round(moduleTop + moduleHeight / 2),
    });

    moduleFloor.setCoords();
    pod.setCoords();
    canvas.renderAll();
  }, [moduleDimensions, xOffset, yOffset, width, length]);

  // Update canvas when dimensions change
  useEffect(() => {
    updateCanvasObjects();
  }, [updateCanvasObjects]);

  // Apply predefined dimensions when pod type changes (only for new pods)
  useEffect(() => {
    if (!existing) {
      // Only apply defaults for new pods, not when editing
      const defaults = getPodDefaults(podType);
      setWidth(Math.round(defaults.width));
      setLength(Math.round(defaults.length));
    }
  }, [podType, existing, getPodDefaults]);

  const onSubmit = () => {
    if (Object.keys(validationErrors).length > 0) return;

    if (existing) {
      updateBathroomPod(existing.id, {
        type: podType,
        x_offset: Math.round(xOffset),
        y_offset: Math.round(yOffset),
        width: Math.round(width),
        length: Math.round(length),
      });
    } else {
      const id = `BP${Date.now()}`;
      addBathroomPod({
        id,
        moduleId,
        name: id,
        type: podType,
        x_offset: Math.round(xOffset),
        y_offset: Math.round(yOffset),
        width: Math.round(width),
        length: Math.round(length),
      });
    }
    onClose();
  };

  const hasValidationErrors = Object.keys(validationErrors).length > 0;

  // Pod type dropdown options
  const podTypeOptions: DropdownOption[] = [
    { value: 'F', label: 'Full Bathroom' },
    { value: 'H', label: 'Half Bathroom' },
    { value: 'S', label: 'Shower Only' },
    { value: 'T', label: 'Toilet Only' },
  ];

  return (
    <Overlay>
      <Box>
        <MenuWrap>
          <MenuHeader>
            <Text weight={700} size={32}>
              {existing ? 'Edit bathroom pod' : 'Add bathroom pod'}
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
                Drag and resize the bathroom pod. Origin (0,0) is at bottom-left corner.
              </Text>
              <Preview ref={canvasContainerRef}>
                <canvas id="preview-canvas" />
              </Preview>
            </MenuItem>
          </LeftPanel>

          <RightPanel>
            <ScrollContent>
              {/* Pod Type */}
              <MenuItem>
                <Text weight={700} size={20}>
                  Pod Type
                </Text>
                <DropdownWrap>
                  <InputLabel>Select bathroom type</InputLabel>
                  <Dropdown
                    options={podTypeOptions}
                    value={podType}
                    onChange={value => setPodType(String(value))}
                    placeholder="Select type"
                  />
                </DropdownWrap>
                <Text size={14} color="#64748b">
                  Module dimensions: {moduleDimensions.width} × {moduleDimensions.height} mm
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
                    {!validationErrors.width && <SuccessMessage>Maximum: {moduleDimensions.width} mm</SuccessMessage>}
                  </div>
                  <div style={{ width: '50%' }}>
                    <Input
                      label="Length"
                      suffix="mm"
                      type="number"
                      step="1"
                      min="1"
                      value={length}
                      onChange={e => setLength(Math.max(1, Math.round(parseInt(e.target.value) || 1)))}
                      error={validationErrors.length}
                    />
                    {!validationErrors.length && <SuccessMessage>Maximum: {moduleDimensions.height} mm</SuccessMessage>}
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
                      value={xOffset}
                      onChange={e => setXOffset(Math.max(0, Math.round(parseInt(e.target.value) || 0)))}
                      error={validationErrors.xOffset}
                    />
                    {!validationErrors.xOffset && (
                      <SuccessMessage>Available: {Math.max(0, moduleDimensions.width - width)} mm</SuccessMessage>
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
                      <SuccessMessage>Available: {Math.max(0, moduleDimensions.height - length)} mm</SuccessMessage>
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
                      deleteBathroomPod(existing.id);
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
                  {existing ? 'Save' : 'Add Pod'}
                </HalfWidthButton>
              </ButtonRow>
            </Footer>
          </RightPanel>
        </ContentWrapper>
      </Box>
    </Overlay>
  );
}
