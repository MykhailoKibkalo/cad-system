// src/context/CadContext.tsx - Fixed floor access
import React, { createContext, ReactNode, useContext, useEffect, useRef, useState } from 'react';
import { fabric } from 'fabric';
import { v4 as uuidv4 } from 'uuid';
import {
  Balcony,
  CanvasSettings,
  createDefaultWalls,
  Floor,
  GridSettings,
  Module,
  ModuleColors,
  ToolState,
  ToolType
} from '@/types';

interface CadContextType {
  floors: Floor[];
  activeFloorId: string;
  gridSettings: GridSettings;
  canvasSettings: CanvasSettings;
  toolState: ToolState;
  moduleColors: ModuleColors;
  fabricCanvasRef: React.MutableRefObject<fabric.Canvas | null>;
  setFloors: (floors: Floor[]) => void;
  addFloor: (name: string) => string; // Return the new floor ID
  duplicateFloor: (id: string) => string; // Return the new floor ID
  deleteFloor: (id: string) => void;
  setActiveFloorId: (id: string) => void;
  updateFloor: (id: string, floor: Partial<Floor>) => void;
  addModule: (module: Omit<Module, 'id'>) => string; // Return the new module ID
  updateModule: (id: string, module: Partial<Module>) => void;
  deleteModule: (id: string) => void;
  addBalcony: (balcony: Omit<Balcony, 'id'>) => string; // Return the new balcony ID
  updateBalcony: (id: string, balcony: Partial<Balcony>) => void;
  deleteBalcony: (id: string) => void;
  setGridSettings: (settings: Partial<GridSettings>) => void;
  setCanvasSettings: (settings: Partial<CanvasSettings>) => void;
  setToolState: (state: Partial<ToolState>) => void;
  getActiveFloor: () => Floor | undefined;
  getModuleById: (id: string) => Module | undefined;
  getBalconyById: (id: string) => Balcony | undefined;
  ensureActiveFloor: () => string; // New function to ensure there's an active floor
}

const defaultGridSettings: GridSettings = {
  size: 20,
  color: '#cccccc',
  opacity: 0.5,
  visible: true,
  snapToGrid: true,
  snapToElement: true, // Enable snap to element by default
  snapThreshold: 10, // 10px threshold for snapping
};

const defaultCanvasSettings: CanvasSettings = {
  width: 1200,
  height: 800,
  zoom: 1,
  panX: 0,
  panY: 0,
};

const defaultToolState: ToolState = {
  activeTool: ToolType.SELECT,
  selectedObjectId: null,
  selectedFloorId: null,
};

const defaultModuleColors: ModuleColors = {
  A1: '#FFB6C1', // Light Pink
  A2: '#FFC0CB', // Pink
  A3: '#FF69B4', // Hot Pink
  B1: '#ADD8E6', // Light Blue
  B2: '#87CEEB', // Sky Blue
  B3: '#1E90FF', // Dodger Blue
  B4: '#0000FF', // Blue
  C1: '#90EE90', // Light Green
  C2: '#32CD32', // Lime Green
  C3: '#008000', // Green
  D1: '#FFD700', // Gold
  D2: '#FFA500', // Orange
};

const CadContext = createContext<CadContextType | undefined>(undefined);

export const CadProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [floors, setFloors] = useState<Floor[]>([]);
  const [activeFloorId, setActiveFloorId] = useState<string>('');
  const [gridSettings, setGridSettings] = useState<GridSettings>(defaultGridSettings);
  const [canvasSettings, setCanvasSettings] = useState<CanvasSettings>(defaultCanvasSettings);
  const [toolState, setToolState] = useState<ToolState>(defaultToolState);
  const [moduleColors, setModuleColors] = useState<ModuleColors>(defaultModuleColors);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);

  // Keep a direct reference to the current floors for access in event handlers
  // This prevents stale closure issues
  const floorsRef = useRef<Floor[]>([]);
  const activeFloorIdRef = useRef<string>('');

  // Update the refs whenever the state changes
  useEffect(() => {
    floorsRef.current = floors;
    activeFloorIdRef.current = activeFloorId;

    console.log('Updated floors ref:', floors.length, 'floors, active ID:', activeFloorId);
  }, [floors, activeFloorId]);

  // Initialize with a default floor on first render
  useEffect(() => {
    console.log('CadProvider: Initializing with default floor');

    if (floors.length === 0) {
      const firstFloorId = uuidv4();
      console.log('Creating first floor with ID:', firstFloorId);

      const initialFloors = [
        {
          id: firstFloorId,
          name: 'Floor 1',
          modules: [],
          balconies: [],
          visible: true,
        },
      ];

      setFloors(initialFloors);
      setActiveFloorId(firstFloorId);

      // Update refs immediately for synchronous access
      floorsRef.current = initialFloors;
      activeFloorIdRef.current = firstFloorId;

      console.log('Initial floors set:', initialFloors);
      console.log('Active floor ID set to:', firstFloorId);
    }
  }, [floors.length]);

  // Make sure active floor ID is set whenever floors change
  useEffect(() => {
    console.log('Floors updated, floors count:', floors.length);
    console.log('Current activeFloorId:', activeFloorId);

    // If we have floors but no active floor ID, set the first floor as active
    if (floors.length > 0 && (!activeFloorId || !floors.find(f => f.id === activeFloorId))) {
      const newActiveId = floors[0].id;
      console.log('Setting new active floor ID:', newActiveId);
      setActiveFloorId(newActiveId);
      // Update ref immediately for synchronous access
      activeFloorIdRef.current = newActiveId;
    }
  }, [floors, activeFloorId]);

  // CRITICAL: Direct access to active floor using current values
  const getActiveFloor = () => {
    // Use the current ref values to avoid stale closures
    const currentFloors = floorsRef.current;
    const currentId = activeFloorIdRef.current;

    if (!currentId) {
      console.log('No active floor ID, creating one');
      return undefined;
    }

    const floor = currentFloors.find(f => f.id === currentId);

    if (!floor) {
      console.log(`No floor found with ID ${currentId}`);
      return undefined;
    }

    return floor;
  };

  // Ensure there's an active floor, creating one if needed
  const ensureActiveFloor = (): string => {
    // Use the current ref values to avoid stale closures
    const currentFloors = floorsRef.current;
    const currentId = activeFloorIdRef.current;

    // Check if we already have an active floor
    if (currentFloors.length > 0 && currentId && currentFloors.find(f => f.id === currentId)) {
      console.log('Active floor already exists:', currentId);
      return currentId;
    }

    // Try to use an existing floor
    if (currentFloors.length > 0) {
      const firstFloorId = currentFloors[0].id;
      console.log('Using first floor as active:', firstFloorId);
      setActiveFloorId(firstFloorId);
      // Update ref immediately for synchronous access
      activeFloorIdRef.current = firstFloorId;
      return firstFloorId;
    }

    // No floors, create one
    const newFloorId = uuidv4();
    console.log('Creating new floor with ID:', newFloorId);

    const newFloor: Floor = {
      id: newFloorId,
      name: 'Floor 1',
      modules: [],
      balconies: [],
      visible: true,
    };

    setFloors([newFloor]);
    // Update refs immediately for synchronous access
    floorsRef.current = [newFloor];

    setActiveFloorId(newFloorId);
    // Update ref immediately
    activeFloorIdRef.current = newFloorId;

    return newFloorId;
  };

  const addFloor = (name: string): string => {
    const newFloor: Floor = {
      id: uuidv4(),
      name,
      modules: [],
      balconies: [],
      visible: true,
    };

    console.log('Adding new floor:', newFloor);
    setFloors(prevFloors => {
      const newFloors = [...prevFloors, newFloor];
      // Update ref immediately for synchronous access
      floorsRef.current = newFloors;
      return newFloors;
    });

    // Set as active floor
    setActiveFloorId(newFloor.id);
    // Update ref immediately
    activeFloorIdRef.current = newFloor.id;

    return newFloor.id;
  };

  const duplicateFloor = (id: string): string => {
    const floorToDuplicate = floorsRef.current.find(floor => floor.id === id);
    if (!floorToDuplicate) return id; // Return the original ID if floor not found

    const newFloor: Floor = {
      ...floorToDuplicate,
      id: uuidv4(),
      name: `${floorToDuplicate.name} (Copy)`,
      modules: floorToDuplicate.modules.map(module => ({
        ...module,
        id: uuidv4(),
        openings: module.openings.map(opening => ({
          ...opening,
          id: uuidv4(),
        })),
      })),
      balconies: floorToDuplicate.balconies.map(balcony => ({
        ...balcony,
        id: uuidv4(),
      })),
    };

    setFloors(prevFloors => {
      const newFloors = [...prevFloors, newFloor];
      // Update ref immediately for synchronous access
      floorsRef.current = newFloors;
      return newFloors;
    });

    setActiveFloorId(newFloor.id);
    // Update ref immediately
    activeFloorIdRef.current = newFloor.id;

    return newFloor.id;
  };

  const deleteFloor = (id: string) => {
    if (floorsRef.current.length <= 1) return; // Always keep at least one floor

    setFloors(prevFloors => {
      const newFloors = prevFloors.filter(floor => floor.id !== id);
      // Update ref immediately
      floorsRef.current = newFloors;
      return newFloors;
    });

    // If the deleted floor was active, set the first available floor as active
    if (activeFloorIdRef.current === id) {
      const newActiveFloor = floorsRef.current.find(floor => floor.id !== id);
      if (newActiveFloor) {
        setActiveFloorId(newActiveFloor.id);
        // Update ref immediately
        activeFloorIdRef.current = newActiveFloor.id;
      }
    }
  };

  const updateFloor = (id: string, updatedFloor: Partial<Floor>) => {
    setFloors(prevFloors => {
      const newFloors = prevFloors.map(floor => (floor.id === id ? { ...floor, ...updatedFloor } : floor));
      // Update ref immediately
      floorsRef.current = newFloors;
      return newFloors;
    });
  };

  const addModule = (module: Omit<Module, 'id'> | Module): string => {
    // Ensure we have an active floor
    const activeId = ensureActiveFloor();

    // Check if the module already has an ID (for redo operations)
    let newModule: Module;

    if ('id' in module) {
      newModule = module as Module;
      // Ensure walls exist
      if (!newModule.walls) {
        newModule.walls = createDefaultWalls();
      }
    } else {
      newModule = {
        ...module,
        id: uuidv4(),
        walls: module.walls || createDefaultWalls() // Add default walls if not provided
      };
    }

    console.log('Adding module:', newModule);

    setFloors(prevFloors => {
      const newFloors = prevFloors.map(floor =>
          floor.id === activeId
              ? {
                ...floor,
                modules: [...floor.modules, newModule],
              }
              : floor
      );

      // Update ref immediately
      floorsRef.current = newFloors;
      return newFloors;
    });

    return newModule.id;
  };

  const updateModule = (id: string, updatedModule: Partial<Module>) => {
    setFloors(prevFloors => {
      const newFloors = prevFloors.map(floor => ({
        ...floor,
        modules: floor.modules.map(module => (module.id === id ? { ...module, ...updatedModule } : module)),
      }));

      // Update ref immediately
      floorsRef.current = newFloors;
      return newFloors;
    });
  };

  const deleteModule = (id: string) => {
    setFloors(prevFloors => {
      const newFloors = prevFloors.map(floor => ({
        ...floor,
        modules: floor.modules.filter(module => module.id !== id),
      }));

      // Update ref immediately
      floorsRef.current = newFloors;
      return newFloors;
    });
  };

  const addBalcony = (balcony: Omit<Balcony, 'id'> | Balcony): string => {
    // Ensure we have an active floor
    const activeId = ensureActiveFloor();

    // Check if the balcony already has an ID (for redo operations)
    const newBalcony =
      'id' in balcony
        ? (balcony as Balcony) // Use the existing balcony with its ID
        : { ...balcony, id: uuidv4() }; // Create a new balcony with a new ID

    console.log('Adding balcony:', newBalcony);

    setFloors(prevFloors => {
      const newFloors = prevFloors.map(floor =>
        floor.id === activeId
          ? {
              ...floor,
              balconies: [...floor.balconies, newBalcony],
            }
          : floor
      );

      // Update ref immediately
      floorsRef.current = newFloors;
      return newFloors;
    });

    return newBalcony.id;
  };

  const updateBalcony = (id: string, updatedBalcony: Partial<Balcony>) => {
    setFloors(prevFloors => {
      const newFloors = prevFloors.map(floor => ({
        ...floor,
        balconies: floor.balconies.map(balcony => (balcony.id === id ? { ...balcony, ...updatedBalcony } : balcony)),
      }));

      // Update ref immediately
      floorsRef.current = newFloors;
      return newFloors;
    });
  };

  const deleteBalcony = (id: string) => {
    setFloors(prevFloors => {
      const newFloors = prevFloors.map(floor => ({
        ...floor,
        balconies: floor.balconies.filter(balcony => balcony.id !== id),
      }));

      // Update ref immediately
      floorsRef.current = newFloors;
      return newFloors;
    });
  };

  const updateGridSettingsHandler = (settings: Partial<GridSettings>) => {
    setGridSettings(prev => {
      const updatedSettings = { ...prev, ...settings };
      console.log('Updated grid settings:', updatedSettings);
      return updatedSettings;
    });
  };

  const updateCanvasSettingsHandler = (settings: Partial<CanvasSettings>) => {
    setCanvasSettings({ ...canvasSettings, ...settings });
  };

  const updateToolStateHandler = (state: Partial<ToolState>) => {
    console.log('Setting tool state:', state, 'from previous:', toolState);
    setToolState(prev => {
      const newState = { ...prev, ...state };
      console.log('New tool state:', newState);
      return newState;
    });
  };

  const getModuleById = (id: string) => {
    // Use the current floor ref to avoid stale data
    for (const floor of floorsRef.current) {
      const module = floor.modules.find(m => m.id === id);
      if (module) return module;
    }
    return undefined;
  };

  const getBalconyById = (id: string) => {
    // Use the current floor ref to avoid stale data
    for (const floor of floorsRef.current) {
      const balcony = floor.balconies.find(b => b.id === id);
      if (balcony) return balcony;
    }
    return undefined;
  };

  return (
    <CadContext.Provider
      value={{
        floors,
        activeFloorId,
        gridSettings,
        canvasSettings,
        toolState,
        moduleColors,
        fabricCanvasRef,
        setFloors,
        addFloor,
        duplicateFloor,
        deleteFloor,
        setActiveFloorId,
        updateFloor,
        addModule,
        updateModule,
        deleteModule,
        addBalcony,
        updateBalcony,
        deleteBalcony,
        setGridSettings: updateGridSettingsHandler,
        setCanvasSettings: updateCanvasSettingsHandler,
        setToolState: updateToolStateHandler,
        getActiveFloor,
        getModuleById,
        getBalconyById,
        ensureActiveFloor,
      }}
    >
      {children}
    </CadContext.Provider>
  );
};

export const useCad = (): CadContextType => {
  const context = useContext(CadContext);
  if (context === undefined) {
    throw new Error('useCad must be used within a CadProvider');
  }
  return context;
};
