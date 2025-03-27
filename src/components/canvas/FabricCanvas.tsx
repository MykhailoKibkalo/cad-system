// src/components/canvas/FabricCanvas.tsx
import React, { useEffect, useRef } from 'react';
import { fabric } from 'fabric';
import styled from '@emotion/styled';
import { useCad } from '@/context/CadContext';
import { useHistory } from '@/context/HistoryContext';
import { ActionType, ModuleCategory, ToolType } from '@/types';
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
  } = useCad();

  const { addAction, undo, redo } = useHistory();
  const activeFloor = floors.find(floor => floor.id === activeFloorId);

  // This will track the drawing state
  const drawingRef = useRef({
    isDrawing: false,
    startX: 0,
    startY: 0,
    tempObject: null as fabric.Object | null,
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

      // Basic mouse handlers - don't modify these!
      canvas.on('mouse:down', handleMouseDown);
      canvas.on('mouse:move', handleMouseMove);
      canvas.on('mouse:up', handleMouseUp);
      canvas.on('object:modified', handleObjectModified);
      canvas.on('selection:created', handleSelectionCreated);
      canvas.on('selection:updated', handleSelectionCreated);
      canvas.on('selection:cleared', handleSelectionCleared);

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
    if (!fabricCanvasRef.current || !activeFloor) return;

    const canvas = fabricCanvasRef.current;

    // Get the current selected object ID before clearing
    const selectedId = toolState.selectedObjectId;

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

  // FULLY REWRITTEN MOUSE HANDLERS

  const handleMouseDown = (event: fabric.IEvent<MouseEvent>) => {
    if (!fabricCanvasRef.current || !activeFloor) return;

    const canvas = fabricCanvasRef.current;
    const pointer = canvas.getPointer(event.e);

    console.log(`Mouse down with tool: ${toolState.activeTool}`);

    // If we clicked on an object and we're not in drawing mode, just return
    // to allow selection to work normally
    if (event.target && toolState.activeTool === ToolType.SELECT) {
      console.log('Clicked on object in SELECT mode, normal selection');
      return;
    }

    // If we're in a drawing tool mode, start drawing
    if (toolState.activeTool === ToolType.MODULE || toolState.activeTool === ToolType.BALCONY) {
      console.log('Starting to draw:', toolState.activeTool);

      // Prevent fabric's built-in selection behavior
      canvas.selection = false;

      const snapped = snapToGrid(pointer.x, pointer.y);

      // Store drawing state
      drawingRef.current = {
        isDrawing: true,
        startX: snapped.x,
        startY: snapped.y,
        tempObject: null,
      };

      // Prevent default to avoid issues
      event.e.preventDefault();
    }
  };

  const handleMouseMove = (event: fabric.IEvent<MouseEvent>) => {
    console.log('here');
    if (!fabricCanvasRef.current || !activeFloor || !drawingRef.current.isDrawing) return;

    const canvas = fabricCanvasRef.current;
    const pointer = canvas.getPointer(event.e);

    const snapped = snapToGrid(pointer.x, pointer.y);

    // Calculate dimensions for the object
    let width = Math.abs(snapped.x - drawingRef.current.startX);
    let height = Math.abs(snapped.y - drawingRef.current.startY);

    // Calculate top-left position
    let left = Math.min(drawingRef.current.startX, snapped.x);
    let top = Math.min(drawingRef.current.startY, snapped.y);

    console.log(width, height, left, top);

    // Remove previous temp object if it exists
    if (drawingRef.current.tempObject) {
      canvas.remove(drawingRef.current.tempObject);
    }

    // Create a new temp object based on the active tool
    if (toolState.activeTool === ToolType.MODULE) {
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

      drawingRef.current.tempObject = rect;
      canvas.add(rect);
    } else if (toolState.activeTool === ToolType.BALCONY) {
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

      drawingRef.current.tempObject = rect;
      canvas.add(rect);
    }

    canvas.renderAll();
  };

  const handleMouseUp = (event: fabric.IEvent<MouseEvent>) => {
    if (!fabricCanvasRef.current || !activeFloor || !drawingRef.current.isDrawing) return;

    const canvas = fabricCanvasRef.current;
    const pointer = canvas.getPointer(event.e);

    console.log('Mouse up - finishing drawing');

    // Re-enable selection
    canvas.selection = true;

    // Get final dimensions
    const snapped = snapToGrid(pointer.x, pointer.y);

    let width = Math.abs(snapped.x - drawingRef.current.startX);
    let height = Math.abs(snapped.y - drawingRef.current.startY);
    let left = Math.min(drawingRef.current.startX, snapped.x);
    let top = Math.min(drawingRef.current.startY, snapped.y);

    // Remove the temporary object
    if (drawingRef.current.tempObject) {
      canvas.remove(drawingRef.current.tempObject);
    }

    // Only create if the size is meaningful
    if (width > 10 && height > 10) {
      let newId = '';

      if (toolState.activeTool === ToolType.MODULE) {
        // Create a real module
        console.log('Creating a module:', width, 'x', height);

        // Add to data model first
        const newModule = {
          category: ModuleCategory.A1,
          width,
          height,
          position: { x: left, y: top },
          rotation: 0,
          openings: [],
        };

        // Get the new ID (either returned or generated)
        newId = addModule(newModule);

        // Create visual representation
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
      } else if (toolState.activeTool === ToolType.BALCONY) {
        // Create a real balcony
        console.log('Creating a balcony:', width, 'x', height);

        // Add to data model first
        const newBalcony = {
          width,
          height,
          position: { x: left, y: top },
          rotation: 0,
        };

        // Get the new ID (either returned or generated)
        newId = addBalcony(newBalcony);

        // Create visual representation
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

      // After creating, switch to select mode and select the new object
      setToolState({
        activeTool: ToolType.SELECT,
        selectedObjectId: newId,
      });
    }

    // Reset drawing state
    drawingRef.current = {
      isDrawing: false,
      startX: 0,
      startY: 0,
      tempObject: null,
    };

    canvas.renderAll();
  };

  const handleObjectModified = (event: fabric.IEvent) => {
    if (!fabricCanvasRef.current || !activeFloor || !event.target) return;

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
  };

  const handleSelectionCreated = (event: fabric.IEvent) => {
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
  };

  const handleSelectionCleared = () => {
    setToolState({
      selectedObjectId: null,
      activeTool: toolState.activeTool,
    });
  };

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
      if (e.key === 'Delete' && toolState.selectedObjectId) {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;

        const activeObject = canvas.getActiveObject();
        if (!activeObject || !activeObject.data) return;

        const objectData = activeObject.data;

        if (objectData.type === 'module') {
          const originalModule = activeFloor?.modules.find(m => m.id === objectData.id);
          if (!originalModule || !activeFloor) return;

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
          const originalBalcony = activeFloor?.balconies.find(b => b.id === objectData.id);
          if (!originalBalcony || !activeFloor) return;

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
  }, [toolState, activeFloor]);

  return (
    <CanvasContainer>
      <canvas ref={canvasRef} />
    </CanvasContainer>
  );
};

export default FabricCanvas;
