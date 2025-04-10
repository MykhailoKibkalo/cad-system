// src/components/canvas/FabricCanvas.tsx
import React, { useEffect, useRef } from 'react';
import { fabric } from 'fabric';
import styled from '@emotion/styled';
import { useCad } from '@/context/CadContext';
import { useHistory } from '@/context/HistoryContext';
import { ActionType, Module, ModuleCategory, ToolState, ToolType, WallType } from '@/types';
import { loadPdfToCanvas } from '../pdf/PdfHandler';
import { createAlignmentLines, removeAlignmentLines, snapToElement } from '@/utils/snapUtils';

// Constants for zoom functionality
const MIN_ZOOM = 0.1;
const MAX_ZOOM = 10;
const ZOOM_STEP = 0.1;

// Platform detection
// const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;

const CanvasContainer = styled.div`
  position: relative;
  flex-grow: 1;
  overflow: hidden;
  background-color: #f5f5f5;
`;

const FabricCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const {
    floors,
    activeFloorId,
    gridSettings,
    canvasSettings,
    toolState,
    moduleColors,
    fabricCanvasRef,
    addModule,
    updateModule,
    deleteModule,
    addBalcony,
    updateBalcony,
    deleteBalcony,
    setToolState,
    ensureActiveFloor,
    getActiveFloor,
    setCanvasSettings,
    getModuleById,
  } = useCad();

  const { addAction, undo, redo } = useHistory();

  // CRITICAL: Add a ref to track the current tool state
  const toolStateRef = useRef<ToolState>({
    activeTool: ToolType.SELECT,
    selectedObjectId: null,
    selectedFloorId: null,
  });

  // CRITICAL: Add a ref to track the current grid settings
  const gridSettingsRef = useRef<typeof gridSettings>(gridSettings);

  // Keep the refs updated with the latest states
  useEffect(() => {
    toolStateRef.current = toolState;
    console.log('Updated toolStateRef:', toolState);

    // Update cursor based on active tool
    if (fabricCanvasRef.current) {
      const canvas = fabricCanvasRef.current;
      if (toolState.activeTool === ToolType.HAND) {
        canvas.defaultCursor = 'grab';
        canvas.hoverCursor = 'grab';
        if (canvas.getActiveObjects().length === 0) {
          canvas.setCursor('grab');
        }
      } else if (toolState.activeTool === ToolType.SELECT) {
        canvas.defaultCursor = 'default';
        canvas.hoverCursor = 'move';
        canvas.setCursor('default');
      } else {
        canvas.defaultCursor = 'crosshair';
        canvas.hoverCursor = 'crosshair';
        canvas.setCursor('crosshair');
      }
    }
  }, [toolState]);

  useEffect(() => {
    gridSettingsRef.current = gridSettings;
    console.log('Grid settings updated:', gridSettings);
  }, [gridSettings]);

  // Define this at component level - not inside any function!
  const drawingStateRef = useRef({
    isDrawing: false,
    startX: 0,
    startY: 0,
    tempObject: null as fabric.Object | null,
    activeTool: ToolType.SELECT, // Track the tool that started the drawing
  });

  // Enhanced zoom handler for both wheel and trackpad
  const handleCanvasZoom = (event: WheelEvent) => {
    if (!fabricCanvasRef.current) return;

    const canvas = fabricCanvasRef.current;

    // Detect if this is a pinch/zoom gesture from trackpad
    // Check if event is from a trackpad by looking at deltaMode or if Ctrl key is pressed (pinch to zoom)
    const isPinchZoom = event.ctrlKey || (event.deltaMode === 0 && Math.abs(event.deltaY) < 10);

    // Prevent default to stop page scrolling
    event.preventDefault();

    // Get current zoom level
    const currentZoom = canvas.getZoom();
    let newZoom: number;
    let zoomDelta: number;

    if (isPinchZoom) {
      // For pinch gestures, deltaY represents the pinch amount
      zoomDelta = -event.deltaY / 100; // Adjust sensitivity
    } else {
      // For regular scrolling, use a more controlled zoom step
      zoomDelta = event.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
    }

    // Calculate new zoom level
    newZoom = Math.min(Math.max(currentZoom + zoomDelta, MIN_ZOOM), MAX_ZOOM);

    // Get the mouse position on the canvas
    const pointer = canvas.getPointer({ e: event });

    // Set the zoom center to the mouse position
    canvas.zoomToPoint({ x: pointer.x, y: pointer.y }, newZoom);

    // Update the canvas settings in the context
    setCanvasSettings({
      zoom: newZoom,
      panX: canvas.viewportTransform ? canvas.viewportTransform[4] : 0,
      panY: canvas.viewportTransform ? canvas.viewportTransform[5] : 0,
    });

    // Return false to prevent default scrolling
    return false;
  };

  // Initialize canvas just once
  useEffect(() => {
    if (canvasRef.current && !fabricCanvasRef.current) {
      console.log('Initializing canvas');

      const canvas = new fabric.Canvas(canvasRef.current, {
        width: canvasSettings.width,
        height: canvasSettings.height,
        selection: true,
        preserveObjectStacking: true,
      });

      fabricCanvasRef.current = canvas;

      // Apply initial transformations
      canvas.setZoom(canvasSettings.zoom);
      canvas.absolutePan(new fabric.Point(canvasSettings.panX, canvasSettings.panY));

      // Register event handlers
      canvas.on('mouse:down', onMouseDown);
      canvas.on('mouse:move', onMouseMove);
      canvas.on('mouse:up', onMouseUp);
      canvas.on('object:modified', onObjectModified);
      canvas.on('selection:created', onSelectionCreated);
      canvas.on('selection:updated', onSelectionCreated);
      canvas.on('selection:cleared', onSelectionCleared);

      // Force ensuring we have an active floor
      ensureActiveFloor();

      // Cleanup on unmount
      return () => {
        canvas.dispose();
        fabricCanvasRef.current = null;
      };
    }
  }, []);

  // Add wheel event listener for zooming
  useEffect(() => {
    if (fabricCanvasRef.current) {
      const canvas = fabricCanvasRef.current;
      const canvasEl = canvas.getElement();

      // Add wheel event listener for zooming with passive: false to prevent scrolling
      canvasEl.addEventListener('wheel', handleCanvasZoom, { passive: false });

      // Cleanup
      return () => {
        canvasEl.removeEventListener('wheel', handleCanvasZoom);
      };
    }
  }, [fabricCanvasRef.current]);

  // Draw or update grid when settings change
  useEffect(() => {
    if (fabricCanvasRef.current) {
      drawGrid();
    }
  }, [gridSettings]);

  // Sync modules with canvas when floor changes
  useEffect(() => {
    console.log('Active floor or floors changed, syncing canvas');
    if (fabricCanvasRef.current) {
      // IMPORTANT: Use a slight delay to ensure all state updates are processed
      setTimeout(() => {
        syncCanvasWithFloor();
      }, 0);
    }
  }, [activeFloorId, floors]);

  // Watch for tool state changes
  useEffect(() => {
    console.log('Tool state changed:', toolState);
  }, [toolState]);

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

  const renderModuleWalls = (canvas: fabric.Canvas, module: Module) => {
    if (!module.walls) return;

    const { id, position, width, height, rotation } = module;

    canvas
      .getObjects()
      .filter(obj => obj.data?.type === 'wall' && obj.data?.moduleId === id)
      .forEach(obj => {
        canvas.remove(obj);
      });

    // Render top wall if enabled
    if (module.walls.top.enabled) {
      const { thickness, startOffset, endOffset, type } = module.walls.top;
      const isExternal = type === WallType.EXTERNAL;

      const topWall = new fabric.Rect({
        left: position.x + startOffset,
        top: position.y + (isExternal ? -thickness / 2 : 0),
        width: width - startOffset - endOffset,
        height: thickness,
        fill: isExternal ? '#333333' : '#888888',
        stroke: '#000000',
        strokeWidth: 0.5,
        angle: rotation,
        selectable: false,
        evented: false,
      });

      topWall.data = {
        type: 'wall',
        edge: 'top',
        moduleId: id,
      };

      canvas.add(topWall);
      canvas.sendToBack(topWall);
    }

    // Render right wall if enabled
    if (module.walls.right.enabled) {
      const { thickness, startOffset, endOffset, type } = module.walls.right;
      const isExternal = type === WallType.EXTERNAL;

      const rightWall = new fabric.Rect({
        left: position.x + (isExternal ? width - thickness / 2 : width),
        top: position.y + startOffset,
        width: thickness,
        height: height - startOffset - endOffset,
        fill: isExternal ? '#333333' : '#888888',
        stroke: '#000000',
        strokeWidth: 0.5,
        angle: rotation,
        selectable: false,
        evented: false,
      });

      rightWall.data = {
        type: 'wall',
        edge: 'right',
        moduleId: id,
      };

      canvas.add(rightWall);
      canvas.sendToBack(rightWall);
    }

    // Render bottom wall if enabled
    if (module.walls.bottom.enabled) {
      const { thickness, startOffset, endOffset, type } = module.walls.bottom;
      const isExternal = type === WallType.EXTERNAL;

      const bottomWall = new fabric.Rect({
        left: position.x + startOffset,
        top: position.y + (isExternal ? height - thickness / 2 : height),
        width: width - startOffset - endOffset,
        height: thickness,
        fill: isExternal ? '#333333' : '#888888',
        stroke: '#000000',
        strokeWidth: 0.5,
        angle: rotation,
        selectable: false,
        evented: false,
      });

      bottomWall.data = {
        type: 'wall',
        edge: 'bottom',
        moduleId: id,
      };

      canvas.add(bottomWall);
      canvas.sendToBack(bottomWall);
    }

    // Render left wall if enabled
    if (module.walls.left.enabled) {
      const { thickness, startOffset, endOffset, type } = module.walls.left;
      const isExternal = type === WallType.EXTERNAL;

      const leftWall = new fabric.Rect({
        left: position.x + (isExternal ? -thickness / 2 : 0),
        top: position.y + startOffset,
        width: thickness,
        height: height - startOffset - endOffset,
        fill: isExternal ? '#333333' : '#888888',
        stroke: '#000000',
        strokeWidth: 0.5,
        angle: rotation,
        selectable: false,
        evented: false,
      });

      leftWall.data = {
        type: 'wall',
        edge: 'left',
        moduleId: id,
      };

      canvas.add(leftWall);
      canvas.sendToBack(leftWall);
    }
  };

  // Snap point to grid - FIXED to use ref
  const snapToGrid = (x: number, y: number): { x: number; y: number } => {
    // FIXED: Always use the latest grid settings from the ref
    if (!gridSettingsRef.current.snapToGrid) return { x, y };

    const gridSize = gridSettingsRef.current.size;
    return {
      x: Math.round(x / gridSize) * gridSize,
      y: Math.round(y / gridSize) * gridSize,
    };
  };

  // CORE FUNCTION: Sync canvas objects with floor data
  const syncCanvasWithFloor = () => {
    if (!fabricCanvasRef.current) return;

    // CRITICAL: Always call getActiveFloor() from the context
    // This ensures we get the latest floor directly from the context
    const activeFloor = getActiveFloor();

    if (!activeFloor) {
      console.log('No active floor found, this should not happen after ensureActiveFloor');
      return;
    }

    console.log('Syncing canvas with floor:', activeFloor.id, activeFloor.name);

    const canvas = fabricCanvasRef.current;

    // Get the current selected object ID before clearing
    const selectedId = toolStateRef.current.selectedObjectId;

    // Remove all canvas objects except grid
    const nonGridObjects = canvas.getObjects().filter(obj => obj.data?.type !== 'grid');
    nonGridObjects.forEach(obj => canvas.remove(obj));

    // Add PDF backdrop if exists
    if (activeFloor.backdrop) {
      loadPdfToCanvas(canvas, activeFloor.backdrop.url, {
        scale: activeFloor.backdrop.scale,
        opacity: activeFloor.backdrop.opacity,
        x: activeFloor.backdrop.position.x,
        y: activeFloor.backdrop.position.y,
        selectable: !activeFloor.backdrop.locked,
        preservePosition: true, // Always preserve position
      });
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
        category: module.category, // Store the category for easier access
      };

      canvas.add(rect);
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

    activeFloor.modules.forEach(module => {
      if (module.walls) {
        renderModuleWalls(canvas, module);
      }
    });

    // Try to reselect the previously selected object if it still exists
    if (selectedId) {
      const objects = canvas.getObjects();
      const selectedObject = objects.find(obj => obj.data?.id === selectedId);
      if (selectedObject) {
        canvas.setActiveObject(selectedObject);
      }
    }

    canvas.renderAll();
  };

  // Mouse Down - Start Drawing or Panning
  function onMouseDown(event: fabric.IEvent<MouseEvent>) {
    if (!fabricCanvasRef.current) return;

    const canvas = fabricCanvasRef.current;
    const pointer = canvas.getPointer(event.e);

    // Handle hand tool for panning
    if (toolStateRef.current.activeTool === ToolType.HAND) {
      canvas.isDragging = true;
      canvas.lastPosX = event.e.clientX;
      canvas.lastPosY = event.e.clientY;
      canvas.setCursor('grabbing');

      // Disable selection while panning
      canvas.selection = false;
      event.e.preventDefault();
      return;
    }

    // CRITICAL CHANGE: Always ensure we have an active floor ID first
    const currentFloorId = ensureActiveFloor();
    console.log('Current active floor ID:', currentFloorId);

    // CRITICAL CHANGE: Get the floor directly from the context
    // This will ensure we get the latest state
    const activeFloor = getActiveFloor();

    // Now log both the ID and the actual floor object
    console.log('Active floor from context:', activeFloor);

    if (!activeFloor) {
      console.log('No active floor available, creating one now');
      const newFloorId = ensureActiveFloor();
      console.log('Created new floor with ID:', newFloorId);

      // Try again with the new floor
      const newActiveFloor = getActiveFloor();
      if (!newActiveFloor) {
        console.error('Critical error: Still no active floor after creation');
        return;
      }
      console.log('Successfully created new floor:', newActiveFloor);
    }

    // CRITICAL CHANGE: Use the tool state from the ref instead of the state
    // This ensures we have the most up-to-date tool state
    const currentToolState = toolStateRef.current;
    console.log(`Mouse down with tool from ref: ${currentToolState.activeTool}`);

    // If we clicked on an object in SELECT mode, just do normal selection
    if (event.target && currentToolState.activeTool === ToolType.SELECT) {
      console.log('Clicked on object in SELECT mode, normal selection');
      return;
    }

    // Start drawing if we're in a drawing tool mode (MODULE or BALCONY)
    if (currentToolState.activeTool === ToolType.MODULE || currentToolState.activeTool === ToolType.BALCONY) {
      console.log(`Starting to draw: ${currentToolState.activeTool}`);

      // Get snapped position
      const snapped = snapToGrid(pointer.x, pointer.y);

      // CRITICAL: Set drawing state - this is what was failing before
      drawingStateRef.current = {
        isDrawing: true,
        startX: snapped.x,
        startY: snapped.y,
        tempObject: null,
        activeTool: currentToolState.activeTool, // Save which tool started the drawing
      };

      // Log the state to confirm it's set
      console.log('Drawing state set:', {
        isDrawing: drawingStateRef.current.isDrawing,
        tool: drawingStateRef.current.activeTool,
        start: { x: drawingStateRef.current.startX, y: drawingStateRef.current.startY },
      });

      // Prevent default to avoid issues
      event.e.preventDefault();

      // Disable selection while drawing
      canvas.selection = false;
    }
  }

  // Mouse Move - Update Preview or Pan
  function onMouseMove(event: fabric.IEvent<MouseEvent>) {
    if (!fabricCanvasRef.current) return;

    const canvas = fabricCanvasRef.current;

    // Handle panning with hand tool
    if (canvas.isDragging && toolStateRef.current.activeTool === ToolType.HAND) {
      const e = event.e;
      const vpt = canvas.viewportTransform;
      if (!vpt) return;

      vpt[4] += e.clientX - canvas.lastPosX;
      vpt[5] += e.clientY - canvas.lastPosY;

      canvas.requestRenderAll();

      canvas.lastPosX = e.clientX;
      canvas.lastPosY = e.clientY;

      // Update canvas settings in context
      setCanvasSettings({
        panX: vpt[4],
        panY: vpt[5],
      });

      return;
    }

    // Check if we're in drawing mode - CRITICAL CHECK
    if (!drawingStateRef.current.isDrawing) {
      // Handle object movement and snapping for active objects
      const activeObject = canvas.getActiveObject();
      if (activeObject && (activeObject.data?.type === 'module' || activeObject.data?.type === 'balcony')) {
        // const pointer = canvas.getPointer(event.e);

        // Get current position
        let snappedPoint = {
          x: activeObject.left || 0,
          y: activeObject.top || 0,
        };

        // Apply snapping if enabled
        if (gridSettingsRef.current.snapToGrid) {
          snappedPoint = snapToGrid(snappedPoint.x, snappedPoint.y);
        }

        // Apply element snapping if enabled
        if (gridSettingsRef.current.snapToElement) {
          const threshold = gridSettingsRef.current.snapThreshold || 10;
          const result = snapToElement(canvas, activeObject, snappedPoint.x, snappedPoint.y, threshold);

          // Update position with snapped coordinates
          snappedPoint.x = result.x;
          snappedPoint.y = result.y;

          // Create or remove alignment lines based on snap result
          if (result.alignmentLines.horizontal || result.alignmentLines.vertical) {
            createAlignmentLines(canvas, result.alignmentLines);
          } else {
            removeAlignmentLines(canvas);
          }
        }

        // Update object position with snapped coordinates
        activeObject.set({
          left: snappedPoint.x,
          top: snappedPoint.y,
        });

        canvas.renderAll();
      }
    }

    const pointer = canvas.getPointer(event.e);

    // CRITICAL CHANGE: Get the floor directly from the context
    const activeFloor = getActiveFloor();

    if (!activeFloor) {
      console.error('No active floor during mouse move - unexpected error');
      return;
    }

    // Get snapped position
    const snapped = snapToGrid(pointer.x, pointer.y);

    // Calculate dimensions
    const width = Math.abs(snapped.x - drawingStateRef.current.startX);
    const height = Math.abs(snapped.y - drawingStateRef.current.startY);

    // Top-left position
    const left = Math.min(drawingStateRef.current.startX, snapped.x);
    const top = Math.min(drawingStateRef.current.startY, snapped.y);

    // Remove previous temp object if it exists
    if (drawingStateRef.current.tempObject) {
      canvas.remove(drawingStateRef.current.tempObject);
    }

    // Create preview object based on the active tool when drawing started
    if (drawingStateRef.current.activeTool === ToolType.MODULE) {
      const rect = new fabric.Rect({
        left,
        top,
        width,
        height,
        fill: moduleColors[ModuleCategory.A1],
        stroke: '#333333',
        strokeWidth: 1,
        opacity: 0.7,
        selectable: false,
      });

      drawingStateRef.current.tempObject = rect;
      canvas.add(rect);
    } else if (drawingStateRef.current.activeTool === ToolType.BALCONY) {
      const rect = new fabric.Rect({
        left,
        top,
        width,
        height,
        fill: '#FFDEAD',
        stroke: '#333333',
        strokeWidth: 1,
        opacity: 0.7,
        selectable: false,
      });

      drawingStateRef.current.tempObject = rect;
      canvas.add(rect);
    }

    canvas.renderAll();
  }

  // Mouse Up - Finish Drawing or End Panning
  function onMouseUp(event: fabric.IEvent<MouseEvent>) {
    if (!fabricCanvasRef.current) return;

    const canvas = fabricCanvasRef.current;

    removeAlignmentLines(canvas);

    // Handle end of panning with hand tool
    if (canvas.isDragging && toolStateRef.current.activeTool === ToolType.HAND) {
      canvas.isDragging = false;
      canvas.selection = true;
      canvas.setCursor('grab');
      return;
    }

    // CRITICAL: Log to debug the issue
    console.log('Mouse up called, drawing state:', drawingStateRef.current.isDrawing);

    // If we're not in drawing mode, exit early
    if (!drawingStateRef.current.isDrawing) {
      console.log('Not in drawing mode');
      return;
    }

    // CRITICAL CHANGE: Get the floor directly from the context
    const activeFloor = getActiveFloor();

    if (!activeFloor) {
      console.error('No active floor available during mouse up, unexpected error');
      // Reset drawing state even if we can't complete the drawing
      drawingStateRef.current.isDrawing = false;
      return;
    }

    const pointer = canvas.getPointer(event.e);
    const snapped = snapToGrid(pointer.x, pointer.y);

    // Re-enable selection
    canvas.selection = true;

    // Calculate final dimensions
    const width = Math.abs(snapped.x - drawingStateRef.current.startX);
    const height = Math.abs(snapped.y - drawingStateRef.current.startY);
    const left = Math.min(drawingStateRef.current.startX, snapped.x);
    const top = Math.min(drawingStateRef.current.startY, snapped.y);

    console.log(`Finishing drawing: ${width}x${height} at (${left},${top})`);

    // Remove temp preview object
    if (drawingStateRef.current.tempObject) {
      canvas.remove(drawingStateRef.current.tempObject);
    }

    // Create the actual object if size is meaningful
    if (width > 10 && height > 10) {
      // Which tool are we using to create?
      const activeTool = drawingStateRef.current.activeTool;
      let newId = '';

      if (activeTool === ToolType.MODULE) {
        console.log('Creating module');

        // Create module data
        const newModule = {
          category: ModuleCategory.A1,
          width,
          height,
          position: { x: left, y: top },
          rotation: 0,
          openings: [],
        };

        // Add to data model
        newId = addModule(newModule);
        console.log('New module ID:', newId);

        // Create visual object
        const rect = new fabric.Rect({
          left,
          top,
          width,
          height,
          fill: moduleColors[ModuleCategory.A1],
          stroke: '#333333',
          strokeWidth: 1,
          transparentCorners: false,
          cornerColor: '#333333',
          cornerSize: 8,
          cornerStyle: 'circle',
          hasControls: true,
        });

        rect.data = {
          type: 'module',
          id: newId,
          floorId: activeFloor.id,
          category: ModuleCategory.A1,
        };

        canvas.add(rect);
        canvas.setActiveObject(rect);

        const createdModule = getModuleById(newId);
        if (createdModule && createdModule.walls) {
          // Render the walls for the newly created module
          renderModuleWalls(canvas, createdModule);
        }

        // Add to history
        addAction({
          type: ActionType.ADD_MODULE,
          payload: {
            before: { floorId: activeFloor.id, module: null },
            after: {
              floorId: activeFloor.id,
              module: {
                id: newId,
                ...newModule,
              },
            },
            id: newId,
            floorId: activeFloor.id,
          },
        });
      } else if (activeTool === ToolType.BALCONY) {
        console.log('Creating balcony');

        // Create balcony data
        const newBalcony = {
          width,
          height,
          position: { x: left, y: top },
          rotation: 0,
        };

        // Add to data model
        newId = addBalcony(newBalcony);
        console.log('New balcony ID:', newId);

        // Create visual object
        const rect = new fabric.Rect({
          left,
          top,
          width,
          height,
          fill: '#FFDEAD',
          stroke: '#333333',
          strokeWidth: 1,
          transparentCorners: false,
          cornerColor: '#333333',
          cornerSize: 8,
          cornerStyle: 'circle',
          hasControls: true,
        });

        rect.data = {
          type: 'balcony',
          id: newId,
          floorId: activeFloor.id,
        };

        canvas.add(rect);
        canvas.setActiveObject(rect);

        // Add to history
        addAction({
          type: ActionType.ADD_BALCONY,
          payload: {
            before: { floorId: activeFloor.id, balcony: null },
            after: {
              floorId: activeFloor.id,
              balcony: {
                id: newId,
                ...newBalcony,
              },
            },
            id: newId,
            floorId: activeFloor.id,
          },
        });
      }

      // Switch to select mode and select new object
      if (newId) {
        setToolState({
          activeTool: ToolType.SELECT,
          selectedObjectId: newId,
        });
      }
    }

    // CRITICAL: Reset drawing state
    drawingStateRef.current = {
      isDrawing: false,
      startX: 0,
      startY: 0,
      tempObject: null,
      activeTool: ToolType.SELECT,
    };

    canvas.renderAll();
  }

  function onObjectModified(event: fabric.IEvent) {
    if (!fabricCanvasRef.current || !event.target) return;

    // CRITICAL CHANGE: Get the floor directly from the context
    const activeFloor = getActiveFloor();

    if (!activeFloor) return;

    const target = event.target;
    const objectData = target.data;

    if (!objectData || !objectData.id) return;

    console.log('Object modified:', objectData);

    if (objectData.type === 'module') {
      // Update module properties
      const moduleId = objectData.id;

      const updatedModule = {
        position: {
          x: Math.round(target.left || 0),
          y: Math.round(target.top || 0),
        },
        width: Math.round(target.getScaledWidth ? target.getScaledWidth() : target.width || 0),
        height: Math.round(target.getScaledHeight ? target.getScaledHeight() : target.height || 0),
        rotation: Math.round(target.angle || 0),
      };

      // Apply snapping if enabled
      if (gridSettingsRef.current.snapToGrid) {
        const snapped = snapToGrid(updatedModule.position.x, updatedModule.position.y);
        updatedModule.position.x = snapped.x;
        updatedModule.position.y = snapped.y;
        updatedModule.width =
          Math.round(updatedModule.width / gridSettingsRef.current.size) * gridSettingsRef.current.size;
        updatedModule.height =
          Math.round(updatedModule.height / gridSettingsRef.current.size) * gridSettingsRef.current.size;
      }

      // Store original state for history
      const originalModule = activeFloor.modules.find(m => m.id === moduleId);
      if (!originalModule) return;

      const before = { module: { ...originalModule } };

      // Update the module
      updateModule(moduleId, updatedModule);

      // Get updated module for history
      const afterModule = activeFloor.modules.find(m => m.id === moduleId);

      // Add to history
      addAction({
        type: ActionType.UPDATE_MODULE,
        payload: {
          before,
          after: { module: afterModule },
          id: moduleId,
          floorId: activeFloor.id,
        },
      });

      const canvas = fabricCanvasRef.current;

      canvas
        .getObjects()
        .filter(obj => obj.data?.type === 'wall' && obj.data?.moduleId === moduleId)
        .forEach(obj => {
          canvas.remove(obj);
        });

      // Render walls if the module has wall properties
      setTimeout(() => {
        // Get the updated module with walls
        const updatedModuleWithWalls = activeFloor.modules.find(m => m.id === moduleId);
        if (updatedModuleWithWalls && updatedModuleWithWalls.walls) {
          renderModuleWalls(fabricCanvasRef.current!, updatedModuleWithWalls);
        }
      }, 0);
    } else if (objectData.type === 'balcony') {
      // Update balcony properties
      const balconyId = objectData.id;

      const updatedBalcony = {
        position: {
          x: Math.round(target.left || 0),
          y: Math.round(target.top || 0),
        },
        width: Math.round(target.getScaledWidth ? target.getScaledWidth() : target.width || 0),
        height: Math.round(target.getScaledHeight ? target.getScaledHeight() : target.height || 0),
        rotation: Math.round(target.angle || 0),
      };

      // Apply snapping if enabled
      if (gridSettingsRef.current.snapToGrid) {
        const snapped = snapToGrid(updatedBalcony.position.x, updatedBalcony.position.y);
        updatedBalcony.position.x = snapped.x;
        updatedBalcony.position.y = snapped.y;
        updatedBalcony.width =
          Math.round(updatedBalcony.width / gridSettingsRef.current.size) * gridSettingsRef.current.size;
        updatedBalcony.height =
          Math.round(updatedBalcony.height / gridSettingsRef.current.size) * gridSettingsRef.current.size;
      }

      // Store original state for history
      const originalBalcony = activeFloor.balconies.find(b => b.id === balconyId);
      if (!originalBalcony) return;

      const before = { balcony: { ...originalBalcony } };

      // Update the balcony
      updateBalcony(balconyId, updatedBalcony);

      // Get updated balcony for history
      const afterBalcony = activeFloor.balconies.find(b => b.id === balconyId);

      // Add to history
      addAction({
        type: ActionType.UPDATE_BALCONY,
        payload: {
          before,
          after: { balcony: afterBalcony },
          id: balconyId,
          floorId: activeFloor.id,
        },
      });
    } else if (objectData.type === 'pdfBackdrop') {
      // Handle PDF backdrop modification if needed
      console.log('PDF backdrop modified');
    }
  }

  function onSelectionCreated(event: fabric.IEvent) {
    if (!fabricCanvasRef.current) return;

    const canvas = fabricCanvasRef.current;
    const activeObject = canvas.getActiveObject();

    if (!activeObject || !activeObject.data) return;

    const objectData = activeObject.data;

    if (objectData && objectData.id) {
      console.log('Selection created:', objectData);

      setToolState({
        activeTool: toolStateRef.current.activeTool, // Keep the current tool
        selectedObjectId: objectData.id,
      });
    }
  }

  function onSelectionCleared() {
    setToolState({
      selectedObjectId: null,
      activeTool: toolStateRef.current.activeTool, // Keep the current tool
    });
  }

  // Keyboard shortcuts handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent shortcuts when in input fields
      if (e.target && ['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      // Tool shortcuts
      if (e.key === 'v' || e.key === 'V') {
        setToolState({ activeTool: ToolType.SELECT });
      } else if (e.key === 'm' || e.key === 'M') {
        setToolState({ activeTool: ToolType.MODULE });
      } else if (e.key === 'b' || e.key === 'B') {
        setToolState({ activeTool: ToolType.BALCONY });
      } else if (e.key === 'h' || e.key === 'H') {
        // Add hand tool shortcut
        setToolState({ activeTool: ToolType.HAND });
      }

      // Space bar to temporarily activate hand tool (like Figma)
      if (e.key === ' ' && !e.repeat && toolStateRef.current.activeTool !== ToolType.HAND) {
        e.preventDefault(); // Prevent page scrolling

        // Store the current tool to return to it later
        const currentTool = toolStateRef.current.activeTool;
        fabricCanvasRef.current?.forEachObject(obj => {
          if (obj.data) {
            // Store the current tool in each object's data
            obj.data.previousTool = currentTool;
          }
        });

        // Switch to hand tool
        setToolState({ activeTool: ToolType.HAND });
      }

      // Delete key - remove selected object
      if (e.key === 'Delete' && toolStateRef.current.selectedObjectId) {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;

        const activeObject = canvas.getActiveObject();
        if (!activeObject || !activeObject.data) return;

        const objectData = activeObject.data;
        const activeFloor = getActiveFloor();
        if (!activeFloor) return;

        if (objectData.type === 'module') {
          const originalModule = activeFloor.modules.find(m => m.id === objectData.id);
          if (!originalModule) return;

          // Store for history
          const before = { module: JSON.parse(JSON.stringify(originalModule)), floorId: activeFloor.id };

          deleteModule(objectData.id);
          canvas.remove(activeObject);
          canvas.renderAll();

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

          setToolState({ selectedObjectId: null });
        } else if (objectData.type === 'balcony') {
          const originalBalcony = activeFloor.balconies.find(b => b.id === objectData.id);
          if (!originalBalcony) return;

          // Store for history
          const before = { balcony: JSON.parse(JSON.stringify(originalBalcony)), floorId: activeFloor.id };

          deleteBalcony(objectData.id);
          canvas.remove(activeObject);
          canvas.renderAll();

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

          setToolState({ selectedObjectId: null });
        }
      }

      // Undo (Ctrl+Z)
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        console.log('Executing undo');

        // Perform the undo operation
        const undoneAction = undo();

        if (undoneAction) {
          console.log('Undo completed, syncing canvas');

          // Force canvas sync with a delay to ensure state is updated
          setTimeout(() => {
            syncCanvasWithFloor();
          }, 100);
        }

        e.preventDefault();
      }

      // Redo (Ctrl+Y or Ctrl+Shift+Z)
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) {
        console.log('Executing redo');

        // Perform the redo operation
        const redoneAction = redo();

        if (redoneAction) {
          console.log('Redo completed, syncing canvas');

          // Force canvas sync with a delay to ensure state is updated
          setTimeout(() => {
            syncCanvasWithFloor();
          }, 100);
        }

        e.preventDefault();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      // When space is released, return to the previous tool
      if (e.key === ' ' && toolStateRef.current.activeTool === ToolType.HAND) {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;

        // Get the previous tool from the first object's data
        let previousTool: ToolType = ToolType.SELECT; // Default to SELECT if no previous tool found

        // Get previous tool from canvas objects if available
        canvas.forEachObject(obj => {
          if (obj.data && obj.data.previousTool) {
            previousTool = obj.data.previousTool;
            return false; // Break the loop
          }
        });

        // Switch back to the previous tool
        setToolState({ activeTool: previousTool });

        e.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  return (
    <CanvasContainer>
      <canvas ref={canvasRef} />
    </CanvasContainer>
  );
};

// Add these types to fabric.Canvas
declare module 'fabric' {
  interface Canvas {
    isDragging?: boolean;
    lastPosX?: number;
    lastPosY?: number;
    isMiddleDown?: boolean;
  }

  interface Object {
    data?: {
      type?: string;
      id?: string;
      floorId?: string;
      category?: string;
      previousTool?: ToolType;
      [key: string]: any;
    };
  }
}

export default FabricCanvas;
