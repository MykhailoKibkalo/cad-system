// src/components/canvas/FabricCanvas.tsx
import React, { useEffect, useRef, useState } from 'react';
import { fabric } from 'fabric';
import styled from '@emotion/styled';
import { useCad } from '@/context/CadContext';
import { useHistory } from '@/context/HistoryContext';
import { ActionType, Module, ModuleCategory, Opening, OpeningType, ToolType } from '@/types';
import { v4 as uuidv4 } from 'uuid';

const CanvasContainer = styled.div`
  position: relative;
  flex-grow: 1;
  overflow: hidden;
  background-color: #f5f5f5;
`;

const FabricCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);

  const {
    floors,
    activeFloorId,
    gridSettings,
    canvasSettings,
    toolState,
    moduleColors,
    addModule,
    updateModule,
    deleteModule,
    addBalcony,
    updateBalcony,
    deleteBalcony,
    setToolState,
  } = useCad();

  const { addAction } = useHistory();
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
  const activeFloor = floors.find(floor => floor.id === activeFloorId);
  const [tempOpening, setTempOpening] = useState<{
    moduleId: string;
    wall: 'top' | 'right' | 'bottom' | 'left';
    position: number;
    type: OpeningType;
  } | null>(null);

  // Initialize Fabric.js canvas on component mount
  useEffect(() => {
    if (canvasRef.current && !fabricCanvasRef.current) {
      const canvas = new fabric.Canvas(canvasRef.current, {
        width: canvasSettings.width,
        height: canvasSettings.height,
        selection: true,
        preserveObjectStacking: true,
      });

      fabricCanvasRef.current = canvas;

      // Set up event listeners
      canvas.on('mouse:down', handleMouseDown);
      canvas.on('mouse:move', handleMouseMove);
      canvas.on('mouse:up', handleMouseUp);
      canvas.on('object:modified', handleObjectModified);
      canvas.on('selection:created', handleSelectionCreated);
      canvas.on('selection:cleared', handleSelectionCleared);

      // Apply initial canvas transformations
      canvas.setZoom(canvasSettings.zoom);
      canvas.absolutePan(new fabric.Point(canvasSettings.panX, canvasSettings.panY));

      return () => {
        canvas.dispose();
        fabricCanvasRef.current = null;
      };
    }
  }, []);

  // Update canvas when settings change
  useEffect(() => {
    if (fabricCanvasRef.current) {
      const canvas = fabricCanvasRef.current;
      canvas.setZoom(canvasSettings.zoom);
      canvas.absolutePan(new fabric.Point(canvasSettings.panX, canvasSettings.panY));
      canvas.renderAll();
    }
  }, [canvasSettings]);

  // Draw or update grid
  useEffect(() => {
    if (fabricCanvasRef.current) {
      drawGrid();
    }
  }, [gridSettings]);

  // Sync modules with canvas
  useEffect(() => {
    if (fabricCanvasRef.current && activeFloor) {
      syncCanvasWithFloor();
    }
  }, [activeFloorId, floors]);

  // Draw grid on canvas
  const drawGrid = () => {
    if (!fabricCanvasRef.current) return;

    const canvas = fabricCanvasRef.current;

    // Remove any existing grid
    const existingGrid = canvas.getObjects().filter(obj => obj.data?.type === 'grid');
    existingGrid.forEach(obj => canvas.remove(obj));

    if (!gridSettings.visible) {
      canvas.renderAll();
      return;
    }

    // Create new grid
    const gridSize = gridSettings.size;
    const width = canvasSettings.width;
    const height = canvasSettings.height;

    // Create horizontal lines
    for (let i = 0; i <= height; i += gridSize) {
      const line = new fabric.Line([0, i, width, i], {
        stroke: gridSettings.color,
        opacity: gridSettings.opacity,
        selectable: false,
        evented: false,
      });
      line.data = { type: 'grid' };
      canvas.add(line);
      canvas.sendToBack(line);
    }

    // Create vertical lines
    for (let i = 0; i <= width; i += gridSize) {
      const line = new fabric.Line([i, 0, i, height], {
        stroke: gridSettings.color,
        opacity: gridSettings.opacity,
        selectable: false,
        evented: false,
      });
      line.data = { type: 'grid' };
      canvas.add(line);
      canvas.sendToBack(line);
    }

    canvas.renderAll();
  };

  // Snap point to grid
  const snapToGrid = (point: { x: number; y: number }): { x: number; y: number } => {
    if (!gridSettings.snapToGrid) return point;

    const gridSize = gridSettings.size;
    return {
      x: Math.round(point.x / gridSize) * gridSize,
      y: Math.round(point.y / gridSize) * gridSize,
    };
  };

  // Create opening on module
  const createOpening = (
    moduleId: string,
    wall: 'top' | 'right' | 'bottom' | 'left',
    position: number,
    type: OpeningType,
    width: number,
    height: number
  ) => {
    if (!activeFloor) return;

    const module = activeFloor.modules.find(m => m.id === moduleId);
    if (!module) return;

    // Calculate position based on wall and relative position (0-1)
    let x = 0;
    let y = 0;
    let rotation = 0;

    switch (wall) {
      case 'top':
        x = module.position.x + module.width * position;
        y = module.position.y;
        rotation = 0;
        break;
      case 'right':
        x = module.position.x + module.width;
        y = module.position.y + module.height * position;
        rotation = 90;
        break;
      case 'bottom':
        x = module.position.x + module.width * position;
        y = module.position.y + module.height;
        rotation = 180;
        break;
      case 'left':
        x = module.position.x;
        y = module.position.y + module.height * position;
        rotation = 270;
        break;
    }

    // Create new opening
    const newOpening: Opening = {
      id: uuidv4(),
      type,
      width,
      height,
      position: { x, y },
      rotation,
      wall,
    };

    // Store the module before updating for history
    const before = {
      module: { ...module },
      floorId: activeFloor.id,
    };

    // Update the module with the new opening
    const updatedOpenings = [...module.openings, newOpening];
    updateModule(moduleId, { openings: updatedOpenings });

    // Get the updated module for history
    const updatedModule = activeFloor.modules.find(m => m.id === moduleId);
    const after = {
      module: updatedModule,
      floorId: activeFloor.id,
    };

    // Add to history
    addAction({
      type: ActionType.ADD_OPENING,
      payload: {
        before,
        after,
        id: newOpening.id,
        floorId: activeFloor.id,
      },
    });
  };

  // Draw opening based on type
  const drawOpening = (module: Module, opening: Opening) => {
    if (!fabricCanvasRef.current) return;

    const canvas = fabricCanvasRef.current;

    let openingObject: fabric.Object;

    if (opening.type === OpeningType.DOOR) {
      // Create door representation
      openingObject = new fabric.Rect({
        left: opening.position.x,
        top: opening.position.y,
        width: opening.width,
        height: opening.height,
        fill: 'brown',
        stroke: '#333333',
        strokeWidth: 1,
        angle: opening.rotation,
      });

      // Add door swing arc
      const arcRadius = opening.width * 0.8;
      const startAngle = opening.rotation * (Math.PI / 180);
      const endAngle = startAngle + Math.PI / 2;

      const arc = new fabric.Circle({
        left: opening.position.x - arcRadius / 2,
        top: opening.position.y - arcRadius / 2,
        radius: arcRadius,
        startAngle: startAngle,
        endAngle: endAngle,
        stroke: '#555555',
        fill: 'transparent',
        strokeWidth: 1,
        selectable: false,
      });

      arc.data = {
        type: 'doorArc',
        openingId: opening.id,
        moduleId: module.id,
        floorId: activeFloor?.id,
      };

      canvas.add(arc);
    } else if (opening.type === OpeningType.WINDOW) {
      // Create window representation
      openingObject = new fabric.Rect({
        left: opening.position.x,
        top: opening.position.y,
        width: opening.width,
        height: opening.height,
        fill: 'lightblue',
        stroke: '#333333',
        strokeWidth: 1,
        angle: opening.rotation,
      });
    } else {
      // Generic opening (floor to ceiling)
      openingObject = new fabric.Rect({
        left: opening.position.x,
        top: opening.position.y,
        width: opening.width,
        height: opening.height,
        fill: 'white',
        stroke: '#333333',
        strokeWidth: 1,
        angle: opening.rotation,
      });
    }

    openingObject.data = {
      type: 'opening',
      openingType: opening.type,
      id: opening.id,
      moduleId: module.id,
      floorId: activeFloor?.id,
    };

    canvas.add(openingObject);
  };

  // Sync canvas objects with floor data
  const syncCanvasWithFloor = () => {
    if (!fabricCanvasRef.current || !activeFloor) return;

    const canvas = fabricCanvasRef.current;

    // Remove all canvas objects except grid
    const nonGridObjects = canvas.getObjects().filter(obj => obj.data?.type !== 'grid');
    nonGridObjects.forEach(obj => canvas.remove(obj));

    // Add PDF backdrop if exists
    if (activeFloor.backdrop) {
      // Implementation for PDF backdrop to be added later
      // For now, add a placeholder
      const backdropRect = new fabric.Rect({
        left: 0,
        top: 0,
        width: canvasSettings.width,
        height: canvasSettings.height,
        fill: '#f8f8f8',
        opacity: activeFloor.backdrop.opacity,
        selectable: false,
        evented: false,
      });
      backdropRect.data = {
        type: 'backdrop',
        id: activeFloor.backdrop.id,
      };
      canvas.add(backdropRect);
      canvas.sendToBack(backdropRect);
    }

    // Add modules
    activeFloor.modules.forEach(module => {
      const rect = new fabric.Rect({
        left: module.position.x,
        top: module.position.y,
        width: module.width,
        height: module.height,
        fill: moduleColors[module.category],
        stroke: '#333333',
        strokeWidth: 1,
        angle: module.rotation,
        transparentCorners: false,
        cornerColor: '#333333',
        cornerSize: 8,
        cornerStyle: 'circle',
        hasControls: true,
        lockScalingFlip: true,
      });

      rect.data = {
        type: 'module',
        id: module.id,
        floorId: activeFloor.id,
      };

      canvas.add(rect);

      // Add openings for the module
      module.openings.forEach(opening => {
        drawOpening(module, opening);
      });
    });

    // Add balconies
    activeFloor.balconies.forEach(balcony => {
      const rect = new fabric.Rect({
        left: balcony.position.x,
        top: balcony.position.y,
        width: balcony.width,
        height: balcony.height,
        fill: '#FFDEAD', // Default color for balconies
        stroke: '#333333',
        strokeWidth: 1,
        angle: balcony.rotation,
        transparentCorners: false,
        cornerColor: '#333333',
        cornerSize: 8,
        cornerStyle: 'circle',
        hasControls: true,
        lockScalingFlip: true,
      });

      rect.data = {
        type: 'balcony',
        id: balcony.id,
        floorId: activeFloor.id,
      };

      canvas.add(rect);
    });

    canvas.renderAll();
  };

  // Event Handlers
  const handleMouseDown = (event: fabric.IEvent) => {
    if (!fabricCanvasRef.current || !activeFloor) return;

    const canvas = fabricCanvasRef.current;
    const pointer = canvas.getPointer(event.e);

    // If we're in an opening creation tool mode and clicked on a module
    if (
      (toolState.activeTool === ToolType.OPENING_DOOR ||
        toolState.activeTool === ToolType.OPENING_WINDOW ||
        toolState.activeTool === ToolType.OPENING_GENERIC) &&
      event.target &&
      event.target.data?.type === 'module'
    ) {
      const moduleId = event.target.data.id;
      const module = activeFloor.modules.find(m => m.id === moduleId);

      if (!module) return;

      // Calculate which wall was clicked and the relative position on that wall
      const moduleLeft = module.position.x;
      const moduleTop = module.position.y;
      const moduleRight = moduleLeft + module.width;
      const moduleBottom = moduleTop + module.height;

      // Calculate distance to each wall
      const distToLeft = Math.abs(pointer.x - moduleLeft);
      const distToRight = Math.abs(pointer.x - moduleRight);
      const distToTop = Math.abs(pointer.y - moduleTop);
      const distToBottom = Math.abs(pointer.y - moduleBottom);

      // Find the closest wall
      const minDist = Math.min(distToLeft, distToRight, distToTop, distToBottom);
      let wall: 'top' | 'right' | 'bottom' | 'left';
      let position = 0;

      if (minDist === distToTop) {
        wall = 'top';
        position = (pointer.x - moduleLeft) / module.width;
      } else if (minDist === distToRight) {
        wall = 'right';
        position = (pointer.y - moduleTop) / module.height;
      } else if (minDist === distToBottom) {
        wall = 'bottom';
        position = (pointer.x - moduleLeft) / module.width;
      } else {
        wall = 'left';
        position = (pointer.y - moduleTop) / module.height;
      }

      // Clamp position between 0 and 1
      position = Math.max(0, Math.min(1, position));

      // Set the current opening creation state
      let openingType: OpeningType;

      if (toolState.activeTool === ToolType.OPENING_DOOR) {
        openingType = OpeningType.DOOR;
      } else if (toolState.activeTool === ToolType.OPENING_WINDOW) {
        openingType = OpeningType.WINDOW;
      } else {
        openingType = OpeningType.OPENING;
      }

      setTempOpening({
        moduleId,
        wall,
        position,
        type: openingType,
      });

      // Create the opening directly
      // Default sizes based on opening type
      let width = 0;
      let height = 0;

      switch (openingType) {
        case OpeningType.DOOR:
          width = 90;
          height = 15;
          break;
        case OpeningType.WINDOW:
          width = 120;
          height = 15;
          break;
        case OpeningType.OPENING:
          width = 120;
          height = 20;
          break;
      }

      createOpening(moduleId, wall, position, openingType, width, height);

      // Switch back to SELECT tool
      setToolState({ activeTool: ToolType.SELECT });

      return;
    }

    if (toolState.activeTool !== ToolType.SELECT) {
      setIsDrawing(true);
      setStartPoint(snapToGrid({ x: pointer.x, y: pointer.y }));
    }
  };

  const handleMouseMove = (event: fabric.IEvent) => {
    if (!fabricCanvasRef.current || !isDrawing || !startPoint) return;

    const canvas = fabricCanvasRef.current;
    const pointer = canvas.getPointer(event.e);
    const endPoint = snapToGrid({ x: pointer.x, y: pointer.y });

    // Remove any temp object
    const tempObjects = canvas.getObjects().filter(obj => obj.data?.temp === true);
    tempObjects.forEach(obj => canvas.remove(obj));

    if (toolState.activeTool === ToolType.MODULE) {
      const width = Math.abs(endPoint.x - startPoint.x);
      const height = Math.abs(endPoint.y - startPoint.y);

      if (width > 0 && height > 0) {
        const left = Math.min(startPoint.x, endPoint.x);
        const top = Math.min(startPoint.y, endPoint.y);

        const rect = new fabric.Rect({
          left,
          top,
          width,
          height,
          fill: moduleColors[ModuleCategory.A1], // Default category
          stroke: '#333333',
          strokeWidth: 1,
          opacity: 0.7,
          selectable: false,
        });

        rect.data = {
          temp: true,
          type: 'module',
        };

        canvas.add(rect);
        canvas.renderAll();
      }
    } else if (toolState.activeTool === ToolType.BALCONY) {
      const width = Math.abs(endPoint.x - startPoint.x);
      const height = Math.abs(endPoint.y - startPoint.y);

      if (width > 0 && height > 0) {
        const left = Math.min(startPoint.x, endPoint.x);
        const top = Math.min(startPoint.y, endPoint.y);

        const rect = new fabric.Rect({
          left,
          top,
          width,
          height,
          fill: '#FFDEAD', // Default color for balconies
          stroke: '#333333',
          strokeWidth: 1,
          opacity: 0.7,
          selectable: false,
        });

        rect.data = {
          temp: true,
          type: 'balcony',
        };

        canvas.add(rect);
        canvas.renderAll();
      }
    }
  };

  const handleMouseUp = (event: fabric.IEvent) => {
    if (!fabricCanvasRef.current || !isDrawing || !startPoint || !activeFloor) return;

    const canvas = fabricCanvasRef.current;
    const pointer = canvas.getPointer(event.e);
    const endPoint = snapToGrid({ x: pointer.x, y: pointer.y });

    // Remove any temp object
    const tempObjects = canvas.getObjects().filter(obj => obj.data?.temp === true);
    tempObjects.forEach(obj => canvas.remove(obj));

    const width = Math.abs(endPoint.x - startPoint.x);
    const height = Math.abs(endPoint.y - startPoint.y);

    // Only create objects if they have a minimum size
    if (width > gridSettings.size && height > gridSettings.size) {
      const left = Math.min(startPoint.x, endPoint.x);
      const top = Math.min(startPoint.y, endPoint.y);

      if (toolState.activeTool === ToolType.MODULE) {
        const newModule: Omit<Module, 'id'> = {
          category: ModuleCategory.A1, // Default category
          width,
          height,
          position: { x: left, y: top },
          rotation: 0,
          openings: [],
        };

        // Track the module state before adding for history
        const before = { floorId: activeFloor.id, module: null };

        // Add the module
        addModule(newModule);

        // Find the newly added module for history
        const updatedFloor = floors.find(f => f.id === activeFloor.id);
        const after = {
          floorId: activeFloor.id,
          module: updatedFloor?.modules[updatedFloor.modules.length - 1],
        };

        // Add to history
        addAction({
          type: ActionType.ADD_MODULE,
          payload: {
            before,
            after,
            id: after.module?.id || '',
            floorId: activeFloor.id,
          },
        });
      } else if (toolState.activeTool === ToolType.BALCONY) {
        const newBalcony = {
          width,
          height,
          position: { x: left, y: top },
          rotation: 0,
        };

        // Track the balcony state before adding for history
        const before = { floorId: activeFloor.id, balcony: null };

        // Add the balcony
        addBalcony(newBalcony);

        // Find the newly added balcony for history
        const updatedFloor = floors.find(f => f.id === activeFloor.id);
        const after = {
          floorId: activeFloor.id,
          balcony: updatedFloor?.balconies[updatedFloor.balconies.length - 1],
        };

        // Add to history
        addAction({
          type: ActionType.ADD_BALCONY,
          payload: {
            before,
            after,
            id: after.balcony?.id || '',
            floorId: activeFloor.id,
          },
        });
      }
    }

    setIsDrawing(false);
    setStartPoint(null);

    // Switch back to SELECT tool after drawing
    setToolState({ activeTool: ToolType.SELECT });

    canvas.renderAll();
  };

  const handleObjectModified = (event: fabric.IEvent) => {
    if (!fabricCanvasRef.current || !activeFloor || !event.target) return;

    const target = event.target;
    const objectData = target.data;

    if (!objectData) return;

    if (objectData.type === 'module' && objectData.id) {
      const moduleId = objectData.id;
      const module = activeFloor.modules.find(m => m.id === moduleId);

      if (!module) return;

      // Store original state for history
      const before = { module: { ...module } };

      // Update module with new position, size, rotation
      const updatedModule = {
        position: {
          x: Math.round(target.left || 0),
          y: Math.round(target.top || 0),
        },
        width: Math.round(target.width ? target.getScaledWidth() : module.width),
        height: Math.round(target.height ? target.getScaledHeight() : module.height),
        rotation: Math.round(target.angle || 0),
      };

      // Apply snapping if enabled
      if (gridSettings.snapToGrid) {
        updatedModule.position = snapToGrid(updatedModule.position);
        updatedModule.width = Math.round(updatedModule.width / gridSettings.size) * gridSettings.size;
        updatedModule.height = Math.round(updatedModule.height / gridSettings.size) * gridSettings.size;
      }

      // Update the module
      updateModule(moduleId, updatedModule);

      // Get updated state for history
      const updatedModuleState = activeFloor.modules.find(m => m.id === moduleId);
      const after = { module: updatedModuleState };

      // Add to history
      addAction({
        type: ActionType.UPDATE_MODULE,
        payload: {
          before,
          after,
          id: moduleId,
          floorId: activeFloor.id,
        },
      });
    } else if (objectData.type === 'balcony' && objectData.id) {
      const balconyId = objectData.id;
      const balcony = activeFloor.balconies.find(b => b.id === balconyId);

      if (!balcony) return;

      // Store original state for history
      const before = { balcony: { ...balcony } };

      // Update balcony with new position, size, rotation
      const updatedBalcony = {
        position: {
          x: Math.round(target.left || 0),
          y: Math.round(target.top || 0),
        },
        width: Math.round(target.width ? target.getScaledWidth() : balcony.width),
        height: Math.round(target.height ? target.getScaledHeight() : balcony.height),
        rotation: Math.round(target.angle || 0),
      };

      // Apply snapping if enabled
      if (gridSettings.snapToGrid) {
        updatedBalcony.position = snapToGrid(updatedBalcony.position);
        updatedBalcony.width = Math.round(updatedBalcony.width / gridSettings.size) * gridSettings.size;
        updatedBalcony.height = Math.round(updatedBalcony.height / gridSettings.size) * gridSettings.size;
      }

      // Update the balcony
      updateBalcony(balconyId, updatedBalcony);

      // Get updated state for history
      const updatedBalconyState = activeFloor.balconies.find(b => b.id === balconyId);
      const after = { balcony: updatedBalconyState };

      // Add to history
      addAction({
        type: ActionType.UPDATE_BALCONY,
        payload: {
          before,
          after,
          id: balconyId,
          floorId: activeFloor.id,
        },
      });
    } else if (objectData.type === 'opening' && objectData.id && objectData.moduleId) {
      // Handle opening modification
      const openingId = objectData.id;
      const moduleId = objectData.moduleId;
      const module = activeFloor.modules.find(m => m.id === moduleId);

      if (!module) return;

      const opening = module.openings.find(o => o.id === openingId);
      if (!opening) return;

      // Store original state for history
      const before = {
        module: { ...module },
        opening: { ...opening },
      };

      // Update opening with new position, size, rotation
      const updatedOpening = {
        ...opening,
        position: {
          x: Math.round(target.left || 0),
          y: Math.round(target.top || 0),
        },
        width: Math.round(target.width ? target.getScaledWidth() : opening.width),
        height: Math.round(target.height ? target.getScaledHeight() : opening.height),
        rotation: Math.round(target.angle || 0),
      };

      // Update the openings array
      const updatedOpenings = module.openings.map(o => (o.id === openingId ? updatedOpening : o));

      // Update the module with the updated openings
      updateModule(moduleId, { openings: updatedOpenings });

      // Get updated state for history
      const updatedModuleState = activeFloor.modules.find(m => m.id === moduleId);
      const updatedOpeningState = updatedModuleState?.openings.find(o => o.id === openingId);

      const after = {
        module: updatedModuleState,
        opening: updatedOpeningState,
      };

      // Add to history
      addAction({
        type: ActionType.UPDATE_OPENING,
        payload: {
          before,
          after,
          id: openingId,
          floorId: activeFloor.id,
        },
      });
    }
  };

  const handleSelectionCreated = (event: fabric.IEvent) => {
    if (!event.selected || event.selected.length === 0) return;

    const selectedObject = event.selected[0];
    const objectData = selectedObject.data;

    if (objectData && objectData.id) {
      setToolState({
        selectedObjectId: objectData.id,
        activeTool: ToolType.SELECT,
      });
    }
  };

  const handleSelectionCleared = (event: fabric.IEvent) => {
    setToolState({
      selectedObjectId: null,
      activeTool: toolState.activeTool,
    });
  };

  // Add keyboard event handlers for shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!fabricCanvasRef.current) return;

      const canvas = fabricCanvasRef.current;

      // Delete key - remove selected object
      if (e.key === 'Delete' && toolState.selectedObjectId) {
        const activeObject = canvas.getActiveObject();
        if (!activeObject) return;

        const objectData = activeObject.data;
        if (!objectData || !objectData.id) return;

        if (objectData.type === 'module') {
          const module = activeFloor?.modules.find(m => m.id === objectData.id);
          if (!module || !activeFloor) return;

          // Store original state for history
          const before = { module, floorId: activeFloor.id };

          // Delete the module
          deleteModule(objectData.id);

          // Add to history
          addAction({
            type: ActionType.DELETE_MODULE,
            payload: {
              before,
              after: { module: null, floorId: activeFloor.id },
              id: objectData.id,
              floorId: activeFloor.id,
            },
          });

          canvas.remove(activeObject);
          canvas.renderAll();

          setToolState({ selectedObjectId: null });
        } else if (objectData.type === 'balcony') {
          const balcony = activeFloor?.balconies.find(b => b.id === objectData.id);
          if (!balcony || !activeFloor) return;

          // Store original state for history
          const before = { balcony, floorId: activeFloor.id };

          // Delete the balcony
          deleteBalcony(objectData.id);

          // Add to history
          addAction({
            type: ActionType.DELETE_BALCONY,
            payload: {
              before,
              after: { balcony: null, floorId: activeFloor.id },
              id: objectData.id,
              floorId: activeFloor.id,
            },
          });

          canvas.remove(activeObject);
          canvas.renderAll();

          setToolState({ selectedObjectId: null });
        } else if (objectData.type === 'opening' && objectData.moduleId) {
          const moduleId = objectData.moduleId;
          const module = activeFloor?.modules.find(m => m.id === moduleId);
          if (!module || !activeFloor) return;

          const opening = module.openings.find(o => o.id === objectData.id);
          if (!opening) return;

          // Store original state for history
          const before = {
            module: { ...module },
            opening,
            floorId: activeFloor.id,
          };

          // Remove the opening from the module
          const updatedOpenings = module.openings.filter(o => o.id !== objectData.id);
          updateModule(moduleId, { openings: updatedOpenings });

          // Add to history
          addAction({
            type: ActionType.DELETE_OPENING,
            payload: {
              before,
              after: {
                module: { ...module, openings: updatedOpenings },
                opening: null,
                floorId: activeFloor.id,
              },
              id: objectData.id,
              floorId: activeFloor.id,
            },
          });

          canvas.remove(activeObject);

          // Also remove any associated objects (like door arcs)
          const associatedObjects = canvas.getObjects().filter(obj => obj.data?.openingId === objectData.id);

          associatedObjects.forEach(obj => canvas.remove(obj));

          canvas.renderAll();

          setToolState({ selectedObjectId: null });
        }
      }

      // Escape key - clear selection and return to select tool
      if (e.key === 'Escape') {
        canvas.discardActiveObject();
        canvas.renderAll();

        setToolState({
          activeTool: ToolType.SELECT,
          selectedObjectId: null,
        });
      }

      // Ctrl+C - copy selected object
      if (e.ctrlKey && e.key === 'c' && toolState.selectedObjectId) {
        const activeObject = canvas.getActiveObject();
        if (!activeObject || !activeObject.data) return;

        // Store the copied object data in sessionStorage
        const objectData = activeObject.data;
        if (objectData.type === 'module') {
          const module = activeFloor?.modules.find(m => m.id === objectData.id);
          if (module) {
            sessionStorage.setItem(
              'copiedObject',
              JSON.stringify({
                type: 'module',
                data: module,
              })
            );
          }
        } else if (objectData.type === 'balcony') {
          const balcony = activeFloor?.balconies.find(b => b.id === objectData.id);
          if (balcony) {
            sessionStorage.setItem(
              'copiedObject',
              JSON.stringify({
                type: 'balcony',
                data: balcony,
              })
            );
          }
        }
      }

      // Ctrl+V - paste copied object
      if (e.ctrlKey && e.key === 'v') {
        const copiedObjectJson = sessionStorage.getItem('copiedObject');
        if (!copiedObjectJson || !activeFloor) return;

        try {
          const copiedObject = JSON.parse(copiedObjectJson);

          if (copiedObject.type === 'module') {
            const module = copiedObject.data;

            // Create a new module with offset position
            const newModule: Omit<Module, 'id'> = {
              category: module.category,
              width: module.width,
              height: module.height,
              position: {
                x: module.position.x + gridSettings.size * 2,
                y: module.position.y + gridSettings.size * 2,
              },
              rotation: module.rotation,
              openings: [], // Don't copy openings for simplicity
            };

            // Add the module
            addModule(newModule);

            // Find the newly added module for history
            const updatedFloor = floors.find(f => f.id === activeFloor.id);
            const newModuleWithId = updatedFloor?.modules[updatedFloor.modules.length - 1];

            // Add to history
            if (newModuleWithId) {
              addAction({
                type: ActionType.ADD_MODULE,
                payload: {
                  before: { floorId: activeFloor.id, module: null },
                  after: { floorId: activeFloor.id, module: newModuleWithId },
                  id: newModuleWithId.id,
                  floorId: activeFloor.id,
                },
              });
            }
          } else if (copiedObject.type === 'balcony') {
            const balcony = copiedObject.data;

            // Create a new balcony with offset position
            const newBalcony = {
              width: balcony.width,
              height: balcony.height,
              position: {
                x: balcony.position.x + gridSettings.size * 2,
                y: balcony.position.y + gridSettings.size * 2,
              },
              rotation: balcony.rotation,
            };

            // Add the balcony
            addBalcony(newBalcony);

            // Find the newly added balcony for history
            const updatedFloor = floors.find(f => f.id === activeFloor.id);
            const newBalconyWithId = updatedFloor?.balconies[updatedFloor.balconies.length - 1];

            // Add to history
            if (newBalconyWithId) {
              addAction({
                type: ActionType.ADD_BALCONY,
                payload: {
                  before: { floorId: activeFloor.id, balcony: null },
                  after: { floorId: activeFloor.id, balcony: newBalconyWithId },
                  id: newBalconyWithId.id,
                  floorId: activeFloor.id,
                },
              });
            }
          }

          // Refresh the canvas
          syncCanvasWithFloor();
        } catch (error) {
          console.error('Error pasting object:', error);
        }
      }

      // Tool shortcuts
      if (e.key === 'v' || e.key === 'V') {
        setToolState({ activeTool: ToolType.SELECT });
      } else if (e.key === 'm' || e.key === 'M') {
        setToolState({ activeTool: ToolType.MODULE });
      } else if (e.key === 'd' || e.key === 'D') {
        setToolState({ activeTool: ToolType.OPENING_DOOR });
      } else if (e.key === 'w' || e.key === 'W') {
        setToolState({ activeTool: ToolType.OPENING_WINDOW });
      } else if (e.key === 'o' || e.key === 'O') {
        setToolState({ activeTool: ToolType.OPENING_GENERIC });
      } else if (e.key === 'b' || e.key === 'B') {
        setToolState({ activeTool: ToolType.BALCONY });
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    activeFloorId,
    floors,
    toolState.selectedObjectId,
    addModule,
    updateModule,
    deleteModule,
    addBalcony,
    updateBalcony,
    deleteBalcony,
    setToolState,
    addAction,
    gridSettings.size,
    gridSettings.snapToGrid,
    activeFloor,
  ]);

  // Handle canvas pan and zoom with mouse
  useEffect(() => {
    if (!fabricCanvasRef.current) return;

    const canvas = fabricCanvasRef.current;
    let isDragging = false;
    let lastPosX = 0;
    let lastPosY = 0;

    const handleMouseWheel = (event: WheelEvent) => {
      if (!fabricCanvasRef.current) return;

      const canvas = fabricCanvasRef.current;
      const delta = event.deltaY;
      let zoom = canvas.getZoom();

      // Adjust zoom factor based on wheel direction
      zoom = delta > 0 ? zoom * 0.9 : zoom * 1.1;

      // Clamp zoom
      zoom = Math.min(Math.max(0.5, zoom), 5);

      // Get mouse position
      const pointer = canvas.getPointer(event);

      // Set zoom with point as center
      canvas.zoomToPoint(new fabric.Point(pointer.x, pointer.y), zoom);

      event.preventDefault();
      event.stopPropagation();
    };

    const handleMouseDown = (event: MouseEvent) => {
      if (!fabricCanvasRef.current) return;

      // Only initiate pan if space key is held down or middle mouse button
      if (event.button === 1 || (event.button === 0 && event.altKey)) {
        const canvas = fabricCanvasRef.current;
        isDragging = true;
        canvas.selection = false;
        lastPosX = event.clientX;
        lastPosY = event.clientY;

        event.preventDefault();
      }
    };

    const handleMouseMove = (event: MouseEvent) => {
      if (!fabricCanvasRef.current || !isDragging) return;

      const canvas = fabricCanvasRef.current;
      const vpt = canvas.viewportTransform;
      if (!vpt) return;

      vpt[4] += event.clientX - lastPosX;
      vpt[5] += event.clientY - lastPosY;

      canvas.requestRenderAll();

      lastPosX = event.clientX;
      lastPosY = event.clientY;
    };

    const handleMouseUp = (event: MouseEvent) => {
      if (!fabricCanvasRef.current) return;

      isDragging = false;
      const canvas = fabricCanvasRef.current;
      canvas.selection = true;
    };

    // Add event listeners
    const canvasElement = canvas.getElement();
    canvasElement.addEventListener('wheel', handleMouseWheel);
    canvasElement.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      canvasElement.removeEventListener('wheel', handleMouseWheel);
      canvasElement.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  return (
    <CanvasContainer>
      <canvas ref={canvasRef} />
    </CanvasContainer>
  );
};

export default FabricCanvas;
