// src/context/HistoryContext.tsx
import React, { createContext, ReactNode, useContext, useReducer } from 'react';
import { ActionType, HistoryAction, HistoryState } from '@/types';
import { useCad } from './CadContext';

interface HistoryContextType {
  history: HistoryState;
  addAction: (action: Omit<HistoryAction, 'id'>) => void;
  undo: () => HistoryAction | undefined;
  redo: () => HistoryAction | undefined;
  canUndo: boolean;
  canRedo: boolean;
}

const MAX_HISTORY_SIZE = 20;

const initialHistoryState: HistoryState = {
  past: [],
  future: [],
};

type HistoryReducerAction = { type: 'ADD_ACTION'; payload: HistoryAction } | { type: 'UNDO' } | { type: 'REDO' };

const historyReducer = (state: HistoryState, action: HistoryReducerAction): HistoryState => {
  switch (action.type) {
    case 'ADD_ACTION': {
      const newPast = [...state.past, action.payload];
      if (newPast.length > MAX_HISTORY_SIZE) {
        newPast.shift(); // Remove oldest action if we exceed the limit
      }
      return {
        past: newPast,
        future: [], // Clear the future when a new action is added
      };
    }
    case 'UNDO': {
      if (state.past.length === 0) return state;
      const lastAction = state.past[state.past.length - 1];
      return {
        past: state.past.slice(0, -1),
        future: [lastAction, ...state.future],
      };
    }
    case 'REDO': {
      if (state.future.length === 0) return state;
      const nextAction = state.future[0];
      return {
        past: [...state.past, nextAction],
        future: state.future.slice(1),
      };
    }
    default:
      return state;
  }
};

const HistoryContext = createContext<HistoryContextType | undefined>(undefined);

export const HistoryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [history, dispatch] = useReducer(historyReducer, initialHistoryState);
  const {
    updateModule,
    deleteModule,
    addModule,
    updateBalcony,
    deleteBalcony,
    addBalcony,
    updateFloor,
    deleteFloor,
    addFloor,
    setActiveFloorId,
    getActiveFloor,
    moduleColors,
    fabricCanvasRef, // Add fabricCanvasRef to access the canvas
    floors,
  } = useCad();

  // Helper function to recreate a module directly on the canvas
  const recreateModuleOnCanvas = (moduleData, floorId) => {
    if (!fabricCanvasRef.current) return;

    const canvas = fabricCanvasRef.current;

    // Create the visual object for the module
    const rect = new fabric.Rect({
      left: moduleData.position.x,
      top: moduleData.position.y,
      width: moduleData.width,
      height: moduleData.height,
      fill: moduleColors[moduleData.category],
      stroke: '#333333',
      strokeWidth: 1,
      angle: moduleData.rotation,
      transparentCorners: false,
      cornerColor: '#333333',
      cornerSize: 8,
      cornerStyle: 'circle',
      hasControls: true,
      lockScalingFlip: true,
    });

    rect.data = {
      type: 'module',
      id: moduleData.id,
      floorId: floorId,
      category: moduleData.category,
    };

    canvas.add(rect);
    canvas.renderAll();
  };

  // Helper function to recreate a balcony directly on the canvas
  const recreateBalconyOnCanvas = (balconyData, floorId) => {
    if (!fabricCanvasRef.current) return;

    const canvas = fabricCanvasRef.current;

    // Create the visual object for the balcony
    const rect = new fabric.Rect({
      left: balconyData.position.x,
      top: balconyData.position.y,
      width: balconyData.width,
      height: balconyData.height,
      fill: '#FFDEAD',
      stroke: '#333333',
      strokeWidth: 1,
      angle: balconyData.rotation,
      transparentCorners: false,
      cornerColor: '#333333',
      cornerSize: 8,
      cornerStyle: 'circle',
      hasControls: true,
      lockScalingFlip: true,
    });

    rect.data = {
      type: 'balcony',
      id: balconyData.id,
      floorId: floorId,
    };

    canvas.add(rect);
    canvas.renderAll();
  };

  // Helper function for full canvas refresh
  const refreshCanvas = () => {
    if (!fabricCanvasRef.current) return;

    const canvas = fabricCanvasRef.current;
    const activeFloor = getActiveFloor();

    if (!activeFloor) return;

    // Clear canvas objects except grid
    const nonGridObjects = canvas.getObjects().filter(obj => obj.data?.type !== 'grid');
    nonGridObjects.forEach(obj => canvas.remove(obj));

    // Add modules
    activeFloor.modules.forEach(module => {
      recreateModuleOnCanvas(module, activeFloor.id);
    });

    // Add balconies
    activeFloor.balconies.forEach(balcony => {
      recreateBalconyOnCanvas(balcony, activeFloor.id);
    });

    canvas.renderAll();
  };

  const applyUndoRedoAction = (action: HistoryAction, isUndo: boolean) => {
    const { type, payload } = action;
    const data = isUndo ? payload.before : payload.after;

    console.log(`${isUndo ? 'UNDO' : 'REDO'} action:`, type, data);

    // Always make sure we're on the right floor
    if (payload.floorId) {
      setActiveFloorId(payload.floorId);
    }

    switch (type) {
      case ActionType.ADD_MODULE:
        if (isUndo) {
          // Undo an add by deleting
          if (payload.id) {
            console.log('Undoing module add, deleting module:', payload.id);
            deleteModule(payload.id);

            // Also remove from canvas
            if (fabricCanvasRef.current) {
              const canvas = fabricCanvasRef.current;
              const moduleObject = canvas.getObjects().find(obj => obj.data?.id === payload.id);
              if (moduleObject) {
                canvas.remove(moduleObject);
                canvas.renderAll();
              }
            }
          }
        } else {
          // Redo an add by adding again with SAME ID
          if (data.module) {
            console.log('Redoing module add:', data.module);

            // IMPORTANT: We need to preserve the original ID when redoing
            const moduleToAdd = {
              ...data.module,
              // Ensure module has all required properties
              openings: data.module.openings || [],
            };

            // First add to data model
            addModule(moduleToAdd);

            // Then recreate on canvas
            recreateModuleOnCanvas(moduleToAdd, payload.floorId);
          }
        }
        break;

      case ActionType.UPDATE_MODULE:
        // Apply the correct version of the module
        if (data.module && payload.id) {
          console.log(`${isUndo ? 'Undoing' : 'Redoing'} module update:`, data.module);

          // Update data model
          updateModule(payload.id, data.module);

          // Update canvas object
          if (fabricCanvasRef.current) {
            const canvas = fabricCanvasRef.current;
            const moduleObject = canvas.getObjects().find(obj => obj.data?.id === payload.id) as fabric.Rect;

            if (moduleObject) {
              // Update all visual properties
              moduleObject.set({
                left: data.module.position.x,
                top: data.module.position.y,
                width: data.module.width,
                height: data.module.height,
                angle: data.module.rotation,
                fill: moduleColors[data.module.category], // Ensure color is updated
              });

              // Update data properties
              moduleObject.data = {
                ...moduleObject.data,
                category: data.module.category,
              };

              canvas.renderAll();
            } else {
              // Module not found on canvas, recreate it
              recreateModuleOnCanvas(data.module, payload.floorId);
            }
          }
        }
        break;

      case ActionType.DELETE_MODULE:
        if (isUndo) {
          // Undo a delete by adding back
          if (data.module) {
            console.log('Undoing module delete, restoring:', data.module);

            // Add back to data model
            addModule(data.module);

            // Recreate on canvas
            recreateModuleOnCanvas(data.module, payload.floorId);
          }
        } else {
          // Redo a delete
          if (payload.id) {
            console.log('Redoing module delete:', payload.id);

            // Remove from data model
            deleteModule(payload.id);

            // Remove from canvas
            if (fabricCanvasRef.current) {
              const canvas = fabricCanvasRef.current;
              const moduleObject = canvas.getObjects().find(obj => obj.data?.id === payload.id);
              if (moduleObject) {
                canvas.remove(moduleObject);
                canvas.renderAll();
              }
            }
          }
        }
        break;

      case ActionType.ADD_BALCONY:
        if (isUndo) {
          // Undo an add by deleting
          if (payload.id) {
            console.log('Undoing balcony add, deleting balcony:', payload.id);
            deleteBalcony(payload.id);

            // Also remove from canvas
            if (fabricCanvasRef.current) {
              const canvas = fabricCanvasRef.current;
              const balconyObject = canvas.getObjects().find(obj => obj.data?.id === payload.id);
              if (balconyObject) {
                canvas.remove(balconyObject);
                canvas.renderAll();
              }
            }
          }
        } else {
          // Redo an add by adding again with SAME ID
          if (data.balcony) {
            console.log('Redoing balcony add:', data.balcony);

            // IMPORTANT: We need to preserve the original ID when redoing
            const balconyToAdd = {
              ...data.balcony,
            };

            // First add to data model
            addBalcony(balconyToAdd);

            // Then recreate on canvas
            recreateBalconyOnCanvas(balconyToAdd, payload.floorId);
          }
        }
        break;

      case ActionType.UPDATE_BALCONY:
        // Apply the correct version of the balcony
        if (data.balcony && payload.id) {
          console.log(`${isUndo ? 'Undoing' : 'Redoing'} balcony update:`, data.balcony);

          // Update data model
          updateBalcony(payload.id, data.balcony);

          // Update canvas object
          if (fabricCanvasRef.current) {
            const canvas = fabricCanvasRef.current;
            const balconyObject = canvas.getObjects().find(obj => obj.data?.id === payload.id) as fabric.Rect;

            if (balconyObject) {
              // Update all visual properties
              balconyObject.set({
                left: data.balcony.position.x,
                top: data.balcony.position.y,
                width: data.balcony.width,
                height: data.balcony.height,
                angle: data.balcony.rotation,
              });

              canvas.renderAll();
            } else {
              // Balcony not found on canvas, recreate it
              recreateBalconyOnCanvas(data.balcony, payload.floorId);
            }
          }
        }
        break;

      case ActionType.DELETE_BALCONY:
        if (isUndo) {
          // Undo a delete by adding back
          if (data.balcony) {
            console.log('Undoing balcony delete, restoring:', data.balcony);

            // Add back to data model
            addBalcony(data.balcony);

            // Recreate on canvas
            recreateBalconyOnCanvas(data.balcony, payload.floorId);
          }
        } else {
          // Redo a delete
          if (payload.id) {
            console.log('Redoing balcony delete:', payload.id);

            // Remove from data model
            deleteBalcony(payload.id);

            // Remove from canvas
            if (fabricCanvasRef.current) {
              const canvas = fabricCanvasRef.current;
              const balconyObject = canvas.getObjects().find(obj => obj.data?.id === payload.id);
              if (balconyObject) {
                canvas.remove(balconyObject);
                canvas.renderAll();
              }
            }
          }
        }
        break;

      case ActionType.UPDATE_FLOOR:
        // Apply the correct version of the floor
        if (data.floor && payload.id) {
          updateFloor(payload.id, data.floor);
          setActiveFloorId(payload.id);
          refreshCanvas(); // Full refresh for floor updates
        }
        break;

      case ActionType.ADD_FLOOR:
        if (isUndo) {
          // Undo an add by deleting
          if (payload.id) deleteFloor(payload.id);
        } else {
          // Redo an add by adding again
          if (data.floor) {
            const newId = addFloor(data.floor.name);
            // Copy properties from the original floor
            updateFloor(newId, data.floor);
            setActiveFloorId(newId);
          }
        }
        break;

      case ActionType.DELETE_FLOOR:
        if (isUndo) {
          // Undo a delete by adding back
          if (data.floor) {
            // Need to recreate the floor
            const newFloorId = addFloor(data.floor.name);
            // Copy properties from the original floor
            updateFloor(newFloorId, data.floor);
            setActiveFloorId(newFloorId);
          }
        } else {
          // Redo a delete by deleting again
          if (payload.id) deleteFloor(payload.id);
        }
        break;

      case ActionType.UPDATE_PDF:
        // Handle PDF backdrop updates
        if (payload.id && data.floorId) {
          updateFloor(data.floorId, { backdrop: data.backdrop || undefined });
          setActiveFloorId(data.floorId);
          refreshCanvas(); // Full refresh for PDF updates
        }
        break;

      default:
        console.warn('Unknown action type for undo/redo:', type);
    }

    // Force complete canvas refresh after 50ms to ensure all states are updated
    setTimeout(() => {
      refreshCanvas();
    }, 50);
  };

  const addAction = (action: Omit<HistoryAction, 'id'>) => {
    const actionWithId = { ...action, id: Date.now().toString() };
    console.log('Adding action to history:', actionWithId);
    dispatch({
      type: 'ADD_ACTION',
      payload: actionWithId,
    });
  };

  const undo = () => {
    if (history.past.length === 0) {
      console.log('Nothing to undo');
      return undefined;
    }

    const lastAction = history.past[history.past.length - 1];
    console.log('Undoing action:', lastAction);

    // Apply the undo action first
    applyUndoRedoAction(lastAction, true);

    // Then update the history state
    dispatch({ type: 'UNDO' });

    return lastAction;
  };

  const redo = () => {
    if (history.future.length === 0) {
      console.log('Nothing to redo');
      return undefined;
    }

    const nextAction = history.future[0];
    console.log('Redoing action:', nextAction);

    // Apply the redo action first
    applyUndoRedoAction(nextAction, false);

    // Then update the history state
    dispatch({ type: 'REDO' });

    return nextAction;
  };

  return (
    <HistoryContext.Provider
      value={{
        history,
        addAction,
        undo,
        redo,
        canUndo: history.past.length > 0,
        canRedo: history.future.length > 0,
      }}
    >
      {children}
    </HistoryContext.Provider>
  );
};

export const useHistory = (): HistoryContextType => {
  const context = useContext(HistoryContext);
  if (context === undefined) {
    throw new Error('useHistory must be used within a HistoryProvider');
  }
  return context;
};
