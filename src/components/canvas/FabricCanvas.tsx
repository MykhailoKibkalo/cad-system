// src/components/canvas/FabricCanvas.tsx
import React, { useEffect, useRef } from 'react';
import { fabric } from 'fabric';
import styled from '@emotion/styled';
import { useCad } from '@/context/CadContext';
import { useHistory } from '@/context/HistoryContext';
import { ActionType, ModuleCategory, ToolState, ToolType } from '@/types';
import { loadPdfToCanvas } from '../pdf/PdfHandler';

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
  } = useCad();

  const { addAction, undo, redo } = useHistory();

  // CRITICAL: Add a ref to track the current tool state
  const toolStateRef = useRef<ToolState>({
    activeTool: ToolType.SELECT,
    selectedObjectId: null,
    selectedFloorId: null,
  });

  // Keep the ref updated with the latest toolState
  useEffect(() => {
    toolStateRef.current = toolState;
    console.log('Updated toolStateRef:', toolState);
  }, [toolState]);

  // Define this at component level - not inside any function!
  const drawingStateRef = useRef({
    isDrawing: false,
    startX: 0,
    startY: 0,
    tempObject: null as fabric.Object | null,
    activeTool: ToolType.SELECT, // Track the tool that started the drawing
  });

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
      syncCanvasWithFloor();
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

  // Snap point to grid
  const snapToGrid = (x: number, y: number): { x: number; y: number } => {
    if (!gridSettings.snapToGrid) return { x, y };

    const gridSize = gridSettings.size;
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

  // Mouse Down - Start Drawing
  function onMouseDown(event: fabric.IEvent<MouseEvent>) {
    if (!fabricCanvasRef.current) return;

    const canvas = fabricCanvasRef.current;
    const pointer = canvas.getPointer(event.e);

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

  // Mouse Move - Update Preview
  function onMouseMove(event: fabric.IEvent<MouseEvent>) {
    if (!fabricCanvasRef.current) return;

    // Check if we're in drawing mode - CRITICAL CHECK
    if (!drawingStateRef.current.isDrawing) return;

    const canvas = fabricCanvasRef.current;
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

  // Mouse Up - Finish Drawing and Create Object
  function onMouseUp(event: fabric.IEvent<MouseEvent>) {
    if (!fabricCanvasRef.current) return;

    const canvas = fabricCanvasRef.current;

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
        };

        canvas.add(rect);
        canvas.setActiveObject(rect);

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
      if (gridSettings.snapToGrid) {
        const snapped = snapToGrid(updatedModule.position.x, updatedModule.position.y);
        updatedModule.position.x = snapped.x;
        updatedModule.position.y = snapped.y;
        updatedModule.width = Math.round(updatedModule.width / gridSettings.size) * gridSettings.size;
        updatedModule.height = Math.round(updatedModule.height / gridSettings.size) * gridSettings.size;
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
      if (gridSettings.snapToGrid) {
        const snapped = snapToGrid(updatedBalcony.position.x, updatedBalcony.position.y);
        updatedBalcony.position.x = snapped.x;
        updatedBalcony.position.y = snapped.y;
        updatedBalcony.width = Math.round(updatedBalcony.width / gridSettings.size) * gridSettings.size;
        updatedBalcony.height = Math.round(updatedBalcony.height / gridSettings.size) * gridSettings.size;
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
        activeTool: ToolType.SELECT,
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
      // Tool shortcuts
      if (e.key === 'v' || e.key === 'V') {
        setToolState({ activeTool: ToolType.SELECT });
      } else if (e.key === 'm' || e.key === 'M') {
        setToolState({ activeTool: ToolType.MODULE });
      } else if (e.key === 'b' || e.key === 'B') {
        setToolState({ activeTool: ToolType.BALCONY });
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
          const before = { module: originalModule, floorId: activeFloor.id };

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
          const before = { balcony: originalBalcony, floorId: activeFloor.id };

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
      if (e.ctrlKey && e.key === 'z') {
        console.log('Trying to undo');
        undo();
        e.preventDefault();
      }

      // Redo (Ctrl+Y or Ctrl+Shift+Z)
      if ((e.ctrlKey && e.key === 'y') || (e.ctrlKey && e.shiftKey && e.key === 'z')) {
        console.log('Trying to redo');
        redo();
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <CanvasContainer>
      <canvas ref={canvasRef} />
    </CanvasContainer>
  );
};

export default FabricCanvas;
