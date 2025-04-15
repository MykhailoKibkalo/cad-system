// src/components/canvas/FabricCanvas.tsx
import React, { useEffect, useRef } from 'react';
import { fabric } from 'fabric';
import styled from '@emotion/styled';
import { useCad } from '@/context/CadContext';
import { useHistory } from '@/context/HistoryContext';
import {ActionType, Module, ModuleCategory, ToolState, ToolType} from '@/types';
import { loadPdfToCanvas } from '../pdf/PdfHandler';
import { renderAlignmentGuidelines, clearAlignmentGuidelines, snapToGridAndElements } from '@/utils/snapUtils';
import { WallType, createDefaultWalls } from '@/types/wall';
import { calculateWallPosition } from '@/utils/wallUtils';

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
    getModuleById
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

  // CRITICAL: Add a ref to track alignment guidelines
  const guidelinesRef = useRef<fabric.Line[]>([]);

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

      // Add new event for snapping during dragging
      canvas.on('object:moving', (event) => {
        // If we have a target object and grid settings with snapToElement
        if (event.target && gridSettingsRef.current.snapToElement) {
          const target = event.target;

          // Get current position
          const currentLeft = target.left || 0;
          const currentTop = target.top || 0;

          // Apply snapping
          const { x: snappedX, y: snappedY } = snapToGridAndElementsHandler(target, currentLeft, currentTop);

          // Set the snapped position
          target.set({ left: snappedX, top: snappedY });
        }
      });

      // Add event to clear guidelines when dragging stops
      canvas.on('mouse:up', () => {
        if (fabricCanvasRef.current) {
          clearAlignmentGuidelines(fabricCanvasRef.current);
          guidelinesRef.current = [];
        }
      });

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

  // Snap point to grid and elements
  const snapToGridAndElementsHandler = (target: fabric.Object | null, x: number, y: number): { x: number; y: number } => {
    // Always use the latest grid settings from the ref
    const currentGridSettings = gridSettingsRef.current;

    // If both snapping options are disabled, return original coordinates
    if (!currentGridSettings.snapToGrid && !currentGridSettings.snapToElement) {
      return { x, y };
    }

    // If we don't have a target object or canvas, just do grid snapping
    if (!target || !fabricCanvasRef.current) {
      if (currentGridSettings.snapToGrid) {
        // Just do grid snapping without element snapping
        const gridSize = currentGridSettings.size;
        return {
          x: Math.round(x / gridSize) * gridSize,
          y: Math.round(y / gridSize) * gridSize,
        };
      }
      return { x, y }; // Return original if no grid snapping
    }

    // Apply snapping using the utility function
    const { x: snappedX, y: snappedY, guidelines } = snapToGridAndElements(
        fabricCanvasRef.current,
        target,
        x,
        y,
        {
          snapToGrid: currentGridSettings.snapToGrid,
          snapToElement: currentGridSettings.snapToElement,
          gridSize: currentGridSettings.size,
          snapThreshold: currentGridSettings.snapThreshold || 10, // Default to 10px if not set
        }
    );

    // Render alignment guidelines if we have a canvas reference
    if (fabricCanvasRef.current && guidelines.length > 0) {
      // Clear any existing guidelines first
      clearAlignmentGuidelines(fabricCanvasRef.current);

      // Render new guidelines
      guidelinesRef.current = renderAlignmentGuidelines(fabricCanvasRef.current, guidelines);
    }

    return { x: snappedX, y: snappedY };
  };

  // Render module with walls
  const renderModuleWithWalls = (canvas: fabric.Canvas, module: Module) => {
    // Create the base rectangle for the module
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
      floorId: getActiveFloor()?.id,
      category: module.category,
    };

    canvas.add(rect);

    // If this module has walls defined, render them
    if (module.walls) {
      const walls = module.walls;

      // Calculate wall positions based on module position and rotation
      // For simplicity in this implementation, we'll only handle non-rotated modules for walls
      if (module.rotation === 0) {
        // Top wall
        if (walls.top && walls.top.enabled) {
          const wallThickness = walls.top.thickness;
          const wallColor = walls.top.type === WallType.EXTERNAL ? '#333333' : '#666666';
          const startOffset = walls.top.partialStart || 0;
          const endOffset = walls.top.partialEnd || 0;

          // Calculate wall position using utility function
          const wallPosition = calculateWallPosition(
              module.position,
              { width: module.width, height: module.height },
              'top',
              wallThickness,
              walls.top.placement,
              startOffset,
              endOffset,
              walls.top.extendStart || false,
              walls.top.extendEnd || false,
              walls // Pass all walls to check adjacency
          );

          // For inside walls, use a different style to make them visible through the module
          const visualProperties = wallPosition.isInside ? {
            fill: wallColor,
            opacity: 0.5,
          } : {
            fill: wallColor,
            stroke: undefined,
            strokeWidth: 0,
            opacity: 1
          };

          const topWall = new fabric.Rect({
            left: wallPosition.left,
            top: wallPosition.top,
            width: wallPosition.width,
            height: wallPosition.height,
            ...visualProperties,
            selectable: false,
            evented: false,
          });

          topWall.data = {
            type: 'wall',
            moduleId: module.id,
            edge: 'top',
          };

          canvas.add(topWall);
          // For inside walls, bring to front instead of sending to back
          if (wallPosition.isInside) {
            canvas.bringToFront(topWall);
          } else {
            canvas.sendToBack(topWall);
          }
        }

        // Right wall
        if (walls.right && walls.right.enabled) {
          const wallThickness = walls.right.thickness;
          const wallColor = walls.right.type === WallType.EXTERNAL ? '#333333' : '#666666';
          const startOffset = walls.right.partialStart || 0;
          const endOffset = walls.right.partialEnd || 0;

          // Calculate wall position using utility function
          // Calculate wall position using utility function
          const wallPosition = calculateWallPosition(
              module.position,
              { width: module.width, height: module.height },
              'right',
              wallThickness,
              walls.right.placement,
              startOffset,
              endOffset,
              walls.right.extendStart || false,
              walls.right.extendEnd || false,
              walls // Pass all walls to check adjacency
          );

          // For inside walls, use a different style to make them visible through the module
          const visualProperties = wallPosition.isInside ? {
            fill: wallColor,
            opacity: 0.5,
          } : {
            fill: wallColor,
            stroke: undefined,
            strokeWidth: 0,
            opacity: 1
          };

          const rightWall = new fabric.Rect({
            left: wallPosition.left,
            top: wallPosition.top,
            width: wallPosition.width,
            height: wallPosition.height,
            ...visualProperties,
            selectable: false,
            evented: false,
          });

          rightWall.data = {
            type: 'wall',
            moduleId: module.id,
            edge: 'right',
          };

          canvas.add(rightWall);

          // For inside walls, bring to front instead of sending to back
          if (wallPosition.isInside) {
            canvas.bringToFront(rightWall);
          } else {
            canvas.sendToBack(rightWall);
          }
        }

        // Bottom wall
        if (walls.bottom && walls.bottom.enabled) {
          const wallThickness = walls.bottom.thickness;
          const wallColor = walls.bottom.type === WallType.EXTERNAL ? '#333333' : '#666666';
          const startOffset = walls.bottom.partialStart || 0;
          const endOffset = walls.bottom.partialEnd || 0;

          // Calculate wall position using utility function
          const wallPosition = calculateWallPosition(
              module.position,
              { width: module.width, height: module.height },
              'bottom',
              wallThickness,
              walls.bottom.placement,
              startOffset,
              endOffset,
              walls.bottom.extendStart || false,
              walls.bottom.extendEnd || false,
              walls // Pass all walls to check adjacency
          );
          // For inside walls, use a different style to make them visible through the module
          const visualProperties = wallPosition.isInside ? {
            fill: wallColor,
            opacity: 0.5,
          } : {
            fill: wallColor,
            stroke: undefined,
            strokeWidth: 0,
            opacity: 1
          };

          const bottomWall = new fabric.Rect({
            left: wallPosition.left,
            top: wallPosition.top,
            width: wallPosition.width,
            height: wallPosition.height,
            ...visualProperties,
            selectable: false,
            evented: false,
          });

          bottomWall.data = {
            type: 'wall',
            moduleId: module.id,
            edge: 'bottom',
          };

          canvas.add(bottomWall);

          // For inside walls, bring to front instead of sending to back
          if (wallPosition.isInside) {
            canvas.bringToFront(bottomWall);
          } else {
            canvas.sendToBack(bottomWall);
          }
        }

        // Left wall
        if (walls.left && walls.left.enabled) {
          const wallThickness = walls.left.thickness;
          const wallColor = walls.left.type === WallType.EXTERNAL ? '#333333' : '#666666';
          const startOffset = walls.left.partialStart || 0;
          const endOffset = walls.left.partialEnd || 0;

          // Calculate wall position using utility function
          const wallPosition = calculateWallPosition(
              module.position,
              { width: module.width, height: module.height },
              'left',
              wallThickness,
              walls.left.placement,
              startOffset,
              endOffset,
              walls.left.extendStart || false,
              walls.left.extendEnd || false,
              walls // Pass all walls to check adjacency
          );

          // For inside walls, use a different style to make them visible through the module
          const visualProperties = wallPosition.isInside ? {
            fill: wallColor,
            opacity: 0.5,
          } : {
            fill: wallColor,
            stroke: undefined,
            strokeWidth: 0,
            opacity: 1
          };

          const leftWall = new fabric.Rect({
            left: wallPosition.left,
            top: wallPosition.top,
            width: wallPosition.width,
            height: wallPosition.height,
            ...visualProperties,
            selectable: false,
            evented: false,
          });

          leftWall.data = {
            type: 'wall',
            moduleId: module.id,
            edge: 'left',
          };

          canvas.add(leftWall);

          // For inside walls, bring to front instead of sending to back
          if (wallPosition.isInside) {
            canvas.bringToFront(leftWall);
          } else {
            canvas.sendToBack(leftWall);
          }
        }
      }
    }

    return rect;
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

    // Add modules with walls
    activeFloor.modules.forEach(module => {
      renderModuleWithWalls(canvas, module);
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

      // Get snapped position using new function
      const { x: snappedX, y: snappedY } = snapToGridAndElementsHandler(null, pointer.x, pointer.y);


      // CRITICAL: Set drawing state - this is what was failing before
      drawingStateRef.current = {
        isDrawing: true,
        startX: snappedX,
        startY: snappedY,
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
    if (!drawingStateRef.current.isDrawing) return;

    const pointer = canvas.getPointer(event.e);

    // CRITICAL CHANGE: Get the floor directly from the context
    const activeFloor = getActiveFloor();

    if (!activeFloor) {
      console.error('No active floor during mouse move - unexpected error');
      return;
    }

    // Get snapped position using new function
    const { x: snappedX, y: snappedY } = snapToGridAndElementsHandler(null, pointer.x, pointer.y);

    // Calculate dimensions
    const width = Math.abs(snappedX - drawingStateRef.current.startX);
    const height = Math.abs(snappedY - drawingStateRef.current.startY);

    // Top-left position
    const left = Math.min(drawingStateRef.current.startX, snappedX);
    const top = Math.min(drawingStateRef.current.startY, snappedY);

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

  function onMouseUp(event: fabric.IEvent<MouseEvent>) {
    if (!fabricCanvasRef.current) return;

    const canvas = fabricCanvasRef.current;

    // Clear alignment guidelines
    clearAlignmentGuidelines(canvas);
    guidelinesRef.current = [];

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
    // Use new snapping function
    const { x: snappedX, y: snappedY } = snapToGridAndElementsHandler(null, pointer.x, pointer.y);

    // Re-enable selection
    canvas.selection = true;

    // Calculate final dimensions
    const width = Math.abs(snappedX - drawingStateRef.current.startX);
    const height = Math.abs(snappedY - drawingStateRef.current.startY);
    const left = Math.min(drawingStateRef.current.startX, snappedX);
    const top = Math.min(drawingStateRef.current.startY, snappedY);

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

        // Create module data with default walls
        const newModule = {
          category: ModuleCategory.A1,
          width,
          height,
          position: { x: left, y: top },
          rotation: 0,
          openings: [],
          walls: createDefaultWalls(), // Add default walls
        };

        // Add to data model
        newId = addModule(newModule);
        console.log('New module ID:', newId);

        // Create visual object using wall rendering function
        const moduleWithId = {
          ...newModule,
          id: newId
        };
        renderModuleWithWalls(canvas, moduleWithId);

        // Set as active object
        const moduleObj = canvas.getObjects().find(obj => obj.data?.id === newId);
        if (moduleObj) {
          canvas.setActiveObject(moduleObj);
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
      if (gridSettingsRef.current.snapToGrid || gridSettingsRef.current.snapToElement) {
        const snapped = snapToGridAndElementsHandler(target, updatedModule.position.x, updatedModule.position.y);
        updatedModule.position.x = snapped.x;
        updatedModule.position.y = snapped.y;

        // If grid snapping is enabled, snap dimensions as well
        if (gridSettingsRef.current.snapToGrid) {
          updatedModule.width =
              Math.round(updatedModule.width / gridSettingsRef.current.size) * gridSettingsRef.current.size;
          updatedModule.height =
              Math.round(updatedModule.height / gridSettingsRef.current.size) * gridSettingsRef.current.size;
        }
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

      // Need to update wall positions after module is moved/resized
      // First remove existing walls
      const walls = fabricCanvasRef.current.getObjects().filter(
          obj => obj.data?.type === 'wall' && obj.data?.moduleId === moduleId
      );
      walls.forEach(wall => fabricCanvasRef.current?.remove(wall));

      // Then re-render the module with walls
      const updatedModuleData = getModuleById(moduleId);
      if (updatedModuleData) {
        // Set target properties to match the updated module
        target.set({
          left: updatedModule.position.x,
          top: updatedModule.position.y,
          width: updatedModule.width,
          height: updatedModule.height,
        });

        // Re-render walls
        if (updatedModuleData.walls && updatedModuleData.rotation === 0) {
          // Re-render walls using the same utility function
          const walls = updatedModuleData.walls;

          // Top wall
          if (walls.top && walls.top.enabled) {
            const wallThickness = walls.top.thickness;
            const wallColor = walls.top.type === WallType.EXTERNAL ? '#333333' : '#666666';
            const startOffset = walls.top.partialStart || 0;
            const endOffset = walls.top.partialEnd || 0;

            // Calculate wall position using utility function
            // Calculate wall position using utility function
            const wallPosition = calculateWallPosition(
                updatedModuleData.position,
                { width: updatedModuleData.width, height: updatedModuleData.height },
                'top',
                wallThickness,
                walls.top.placement,
                startOffset,
                endOffset,
                walls.top.extendStart || false,
                walls.top.extendEnd || false,
                walls // Pass all walls to check adjacency
            );

            // For inside walls, use a different style to make them visible through the module
            const visualProperties = wallPosition.isInside ? {
              fill: wallColor,
              opacity: 0.5,
            } : {
              fill: wallColor,
              stroke: undefined,
              strokeWidth: 0,
              opacity: 1
            };

            const topWall = new fabric.Rect({
              left: wallPosition.left,
              top: wallPosition.top,
              width: wallPosition.width,
              height: wallPosition.height,
              ...visualProperties,
              selectable: false,
              evented: false,
            });

            topWall.data = {
              type: 'wall',
              moduleId: updatedModuleData.id,
              edge: 'top',
            };

            fabricCanvasRef.current.add(topWall);

            // For inside walls, bring to front instead of sending to back
            if (wallPosition.isInside) {
              fabricCanvasRef.current.bringToFront(topWall);
            } else {
              fabricCanvasRef.current.sendToBack(topWall);
            }
          }

          // Right wall
          if (walls.right && walls.right.enabled) {
            const wallThickness = walls.right.thickness;
            const wallColor = walls.right.type === WallType.EXTERNAL ? '#333333' : '#666666';
            const startOffset = walls.right.partialStart || 0;
            const endOffset = walls.right.partialEnd || 0;

            // Calculate wall position using utility function
            // Calculate wall position using utility function
            const wallPosition = calculateWallPosition(
                updatedModuleData.position,
                { width: updatedModuleData.width, height: updatedModuleData.height },
                'right',
                wallThickness,
                walls.right.placement,
                startOffset,
                endOffset,
                walls.right.extendStart || false,
                walls.right.extendEnd || false,
                walls // Pass all walls to check adjacency
            );

            // For inside walls, use a different style to make them visible through the module
            const visualProperties = wallPosition.isInside ? {
              fill: wallColor,
              opacity: 0.5,
            } : {
              fill: wallColor,
              stroke: undefined,
              strokeWidth: 0,
              opacity: 1
            };

            const rightWall = new fabric.Rect({
              left: wallPosition.left,
              top: wallPosition.top,
              width: wallPosition.width,
              height: wallPosition.height,
              ...visualProperties,
              selectable: false,
              evented: false,
            });

            rightWall.data = {
              type: 'wall',
              moduleId: updatedModuleData.id,
              edge: 'right',
            };

            fabricCanvasRef.current.add(rightWall);

            // For inside walls, bring to front instead of sending to back
            if (wallPosition.isInside) {
              fabricCanvasRef.current.bringToFront(rightWall);
            } else {
              fabricCanvasRef.current.sendToBack(rightWall);
            }
          }

          // Bottom wall
          if (walls.bottom && walls.bottom.enabled) {
            const wallThickness = walls.bottom.thickness;
            const wallColor = walls.bottom.type === WallType.EXTERNAL ? '#333333' : '#666666';
            const startOffset = walls.bottom.partialStart || 0;
            const endOffset = walls.bottom.partialEnd || 0;

            // Calculate wall position using utility function
            // Calculate wall position using utility function
            const wallPosition = calculateWallPosition(
                updatedModuleData.position,
                { width: updatedModuleData.width, height: updatedModuleData.height },
                'bottom',
                wallThickness,
                walls.bottom.placement,
                startOffset,
                endOffset,
                walls.bottom.extendStart || false,
                walls.bottom.extendEnd || false,
                walls // Pass all walls to check adjacency
            );

            // For inside walls, use a different style to make them visible through the module
            const visualProperties = wallPosition.isInside ? {
              fill: wallColor,
              opacity: 0.5,
            } : {
              fill: wallColor,
              stroke: undefined,
              strokeWidth: 0,
              opacity: 1
            };

            const bottomWall = new fabric.Rect({
              left: wallPosition.left,
              top: wallPosition.top,
              width: wallPosition.width,
              height: wallPosition.height,
              ...visualProperties,
              selectable: false,
              evented: false,
            });

            bottomWall.data = {
              type: 'wall',
              moduleId: updatedModuleData.id,
              edge: 'bottom',
            };

            fabricCanvasRef.current.add(bottomWall);

            // For inside walls, bring to front instead of sending to back
            if (wallPosition.isInside) {
              fabricCanvasRef.current.bringToFront(bottomWall);
            } else {
              fabricCanvasRef.current.sendToBack(bottomWall);
            }
          }

          // Left wall
          if (walls.left && walls.left.enabled) {
            const wallThickness = walls.left.thickness;
            const wallColor = walls.left.type === WallType.EXTERNAL ? '#333333' : '#666666';
            const startOffset = walls.left.partialStart || 0;
            const endOffset = walls.left.partialEnd || 0;

            // Calculate wall position using utility function
            // Calculate wall position using utility function
            const wallPosition = calculateWallPosition(
                updatedModuleData.position,
                { width: updatedModuleData.width, height: updatedModuleData.height },
                'left',
                wallThickness,
                walls.left.placement,
                startOffset,
                endOffset,
                walls.left.extendStart || false,
                walls.left.extendEnd || false,
                walls // Pass all walls to check adjacency
            );
            // For inside walls, use a different style to make them visible through the module
            const visualProperties = wallPosition.isInside ? {
              fill: wallColor,
              opacity: 0.5,
            } : {
              fill: wallColor,
              stroke: undefined,
              strokeWidth: 0,
              opacity: 1
            };

            const leftWall = new fabric.Rect({
              left: wallPosition.left,
              top: wallPosition.top,
              width: wallPosition.width,
              height: wallPosition.height,
              ...visualProperties,
              selectable: false,
              evented: false,
            });

            leftWall.data = {
              type: 'wall',
              moduleId: updatedModuleData.id,
              edge: 'left',
            };

            fabricCanvasRef.current.add(leftWall);

            // For inside walls, bring to front instead of sending to back
            if (wallPosition.isInside) {
              fabricCanvasRef.current.bringToFront(leftWall);
            } else {
              fabricCanvasRef.current.sendToBack(leftWall);
            }
          }
        }
      }
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
      if (gridSettingsRef.current.snapToGrid || gridSettingsRef.current.snapToElement) {
        const snapped = snapToGridAndElementsHandler(target, updatedBalcony.position.x, updatedBalcony.position.y);
        updatedBalcony.position.x = snapped.x;
        updatedBalcony.position.y = snapped.y;

        // If grid snapping is enabled, snap dimensions as well
        if (gridSettingsRef.current.snapToGrid) {
          updatedBalcony.width =
              Math.round(updatedBalcony.width / gridSettingsRef.current.size) * gridSettingsRef.current.size;
          updatedBalcony.height =
              Math.round(updatedBalcony.height / gridSettingsRef.current.size) * gridSettingsRef.current.size;
        }
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

          // Remove module and its walls
          const walls = canvas.getObjects().filter(
              obj => obj.data?.type === 'wall' && obj.data?.moduleId === objectData.id
          );
          walls.forEach(wall => canvas.remove(wall));
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
      moduleId?: string;
      edge?: string;
      [key: string]: any;
    };
  }
}

export default FabricCanvas;
