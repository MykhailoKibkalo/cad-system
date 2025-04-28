// FILE: src/context/CadContext.tsx
import React, { createContext, ReactNode, useContext, useEffect, useRef, useState } from 'react';
import { fabric } from 'fabric';
import { v4 as uuidv4 } from 'uuid';
import {
  Balcony,
  BathroomPod,
  CanvasSettings,
  Corridor,
  createDefaultWalls,
  DisplaySettings,
  Floor,
  GridSettings,
  Module,
  ModuleColors,
  Opening,
  Roof,
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
  addFloor: (name: string) => string;
  duplicateFloor: (id: string) => string;
  deleteFloor: (id: string) => void;
  setActiveFloorId: (id: string) => void;
  updateFloor: (id: string, floor: Partial<Floor>) => void;
  addModule: (module: Omit<Module, 'id'>) => string;
  updateModule: (id: string, module: Partial<Module>) => void;
  deleteModule: (id: string) => void;
  addBalcony: (balcony: Omit<Balcony, 'id'>) => string;
  updateBalcony: (id: string, balcony: Partial<Balcony>) => void;
  deleteBalcony: (id: string) => void;
  addCorridor: (corridor: Omit<Corridor, 'id'>) => string; // New method for corridors
  updateCorridor: (id: string, corridor: Partial<Corridor>) => void; // New method for corridors
  deleteCorridor: (id: string) => void; // New method for corridors
  addRoof: (roof: Omit<Roof, 'id'>) => string; // New method for roofs
  updateRoof: (id: string, roof: Partial<Roof>) => void; // New method for roofs
  deleteRoof: (id: string) => void; // New method for roofs
  addBathroomPod: (moduleId: string, pod: Omit<BathroomPod, 'id'>) => string; // New method for bathroom pods
  updateBathroomPod: (moduleId: string, podId: string, pod: Partial<BathroomPod>) => void; // New method for bathroom pods
  deleteBathroomPod: (moduleId: string, podId: string) => void; // New method for bathroom pods
  addOpening: (moduleId: string, opening: Omit<Opening, 'id'>) => string; // New method for openings
  updateOpening: (moduleId: string, openingId: string, opening: Partial<Opening>) => void; // New method for openings
  deleteOpening: (moduleId: string, openingId: string) => void; // New method for openings
  setGridSettings: (settings: Partial<GridSettings>) => void;
  setCanvasSettings: (settings: Partial<CanvasSettings>) => void;
  setToolState: (state: Partial<ToolState>) => void;
  getActiveFloor: () => Floor | undefined;
  getModuleById: (id: string) => Module | undefined;
  getBalconyById: (id: string) => Balcony | undefined;
  getCorridorById: (id: string) => Corridor | undefined; // New getter
  getRoofById: (id: string) => Roof | undefined; // New getter
  ensureActiveFloor: () => string;
  displaySettings: DisplaySettings;
  setDisplaySettings: (settings: Partial<DisplaySettings>) => void;
  moduleNamePrefix: string; // For configurable naming prefix (spec p.2, line 32)
  setModuleNamePrefix: (prefix: string) => void;
  getNextModuleName: () => string; // For automatic naming (M1, M2, etc.)
  getNextCorridorName: () => string; // For automatic naming (C1, C2, etc.)
  getNextRoofName: () => string; // For automatic naming (R1, R2, etc.)
  getNextBalconyName: () => string; // For automatic naming (BC1, BC2, etc.)
}

const defaultGridSettings: GridSettings = {
  size: 100, // Default: 1 grid = 100 mm (spec p.2, line 3)
  color: '#cccccc',
  opacity: 0.5,
  visible: true,
  snapToGrid: true,
  snapToElement: true,
  snapThreshold: 10,
  elementGap: 50, // Default gap 50mm (spec p.2, line 10)
};

const defaultCanvasSettings: CanvasSettings = {
  width: 10000, // Support for 100m×100m (spec p.2, line 7)
  height: 10000,
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

const defaultDisplaySettings: DisplaySettings = {
  showDimensions: true,
  dimensionUnit: 'mm', // Default to mm for architectural design
  showFloorBeams: true, // Show floor beams CC 600mm (spec p.2, line 26)
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
  const [displaySettings, setDisplaySettings] = useState<DisplaySettings>(defaultDisplaySettings);
  const [moduleNamePrefix, setModuleNamePrefix] = useState<string>('M'); // Default prefix 'M' (spec p.2, line 31)

  // Keep a direct reference to the current floors for access in event handlers
  const floorsRef = useRef<Floor[]>([]);
  const activeFloorIdRef = useRef<string>('');

  // Update the refs whenever the state changes
  useEffect(() => {
    floorsRef.current = floors;
    activeFloorIdRef.current = activeFloorId;
  }, [floors, activeFloorId]);

  // Initialize with a default floor on first render
  useEffect(() => {
    if (floors.length === 0) {
      const firstFloorId = uuidv4();
      const initialFloors = [
        {
          id: firstFloorId,
          name: 'Floor 1',
          modules: [],
          balconies: [],
          corridors: [], // Initialize empty corridors array
          roofs: [], // Initialize empty roofs array
          visible: true,
        },
      ];

      setFloors(initialFloors);
      setActiveFloorId(firstFloorId);
      floorsRef.current = initialFloors;
      activeFloorIdRef.current = firstFloorId;
    }
  }, [floors.length]);

  // Make sure active floor ID is set whenever floors change
  useEffect(() => {
    if (floors.length > 0 && (!activeFloorId || !floors.find(f => f.id === activeFloorId))) {
      const newActiveId = floors[0].id;
      setActiveFloorId(newActiveId);
      activeFloorIdRef.current = newActiveId;
    }
  }, [floors, activeFloorId]);

  // Get active floor using current ref values
  const getActiveFloor = () => {
    const currentFloors = floorsRef.current;
    const currentId = activeFloorIdRef.current;

    if (!currentId) return undefined;

    return currentFloors.find(f => f.id === currentId);
  };

  // Ensure there's an active floor
  const ensureActiveFloor = (): string => {
    const currentFloors = floorsRef.current;
    const currentId = activeFloorIdRef.current;

    if (currentFloors.length > 0 && currentId && currentFloors.find(f => f.id === currentId)) {
      return currentId;
    }

    if (currentFloors.length > 0) {
      const firstFloorId = currentFloors[0].id;
      setActiveFloorId(firstFloorId);
      activeFloorIdRef.current = firstFloorId;
      return firstFloorId;
    }

    const newFloorId = uuidv4();
    const newFloor: Floor = {
      id: newFloorId,
      name: 'Floor 1',
      modules: [],
      balconies: [],
      corridors: [],
      roofs: [],
      visible: true,
    };

    setFloors([newFloor]);
    floorsRef.current = [newFloor];
    setActiveFloorId(newFloorId);
    activeFloorIdRef.current = newFloorId;
    return newFloorId;
  };

  // Auto-generate next module name (M1, M2, etc.)
  const getNextModuleName = (): string => {
    const activeFloor = getActiveFloor();
    if (!activeFloor) return `${moduleNamePrefix}1`;

    // Find the highest number used in module names
    let highestNumber = 0;
    activeFloor.modules.forEach(module => {
      if (module.name.startsWith(moduleNamePrefix)) {
        const numberPart = module.name.substring(moduleNamePrefix.length);
        const number = parseInt(numberPart, 10);
        if (!isNaN(number) && number > highestNumber) {
          highestNumber = number;
        }
      }
    });

    return `${moduleNamePrefix}${highestNumber + 1}`;
  };

  // Auto-generate next corridor name (C1, C2, etc.)
  const getNextCorridorName = (): string => {
    const activeFloor = getActiveFloor();
    if (!activeFloor) return "C1";

    // Find the highest number used in corridor names
    let highestNumber = 0;
    activeFloor.corridors.forEach(corridor => {
      if (corridor.name.startsWith('C')) {
        const numberPart = corridor.name.substring(1);
        const number = parseInt(numberPart, 10);
        if (!isNaN(number) && number > highestNumber) {
          highestNumber = number;
        }
      }
    });

    return `C${highestNumber + 1}`;
  };

  // Auto-generate next roof name (R1, R2, etc.)
  const getNextRoofName = (): string => {
    const activeFloor = getActiveFloor();
    if (!activeFloor) return "R1";

    // Find the highest number used in roof names
    let highestNumber = 0;
    activeFloor.roofs.forEach(roof => {
      if (roof.name.startsWith('R')) {
        const numberPart = roof.name.substring(1);
        const number = parseInt(numberPart, 10);
        if (!isNaN(number) && number > highestNumber) {
          highestNumber = number;
        }
      }
    });

    return `R${highestNumber + 1}`;
  };

  // Auto-generate next balcony name (BC1, BC2, etc.)
  const getNextBalconyName = (): string => {
    const activeFloor = getActiveFloor();
    if (!activeFloor) return "BC1";

    // Find the highest number used in balcony names
    let highestNumber = 0;
    activeFloor.balconies.forEach(balcony => {
      if (balcony.name.startsWith('BC')) {
        const numberPart = balcony.name.substring(2);
        const number = parseInt(numberPart, 10);
        if (!isNaN(number) && number > highestNumber) {
          highestNumber = number;
        }
      }
    });

    return `BC${highestNumber + 1}`;
  };

  const addFloor = (name: string): string => {
    const newFloor: Floor = {
      id: uuidv4(),
      name,
      modules: [],
      balconies: [],
      corridors: [],
      roofs: [],
      visible: true,
    };

    setFloors(prevFloors => {
      const newFloors = [...prevFloors, newFloor];
      floorsRef.current = newFloors;
      return newFloors;
    });

    setActiveFloorId(newFloor.id);
    activeFloorIdRef.current = newFloor.id;
    return newFloor.id;
  };

  const duplicateFloor = (id: string): string => {
    const floorToDuplicate = floorsRef.current.find(floor => floor.id === id);
    if (!floorToDuplicate) return id;

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
        bathroomPods: (module.bathroomPods || []).map(pod => ({
          ...pod,
          id: uuidv4(),
        })),
      })),
      balconies: floorToDuplicate.balconies.map(balcony => ({
        ...balcony,
        id: uuidv4(),
      })),
      corridors: floorToDuplicate.corridors.map(corridor => ({
        ...corridor,
        id: uuidv4(),
      })),
      roofs: floorToDuplicate.roofs.map(roof => ({
        ...roof,
        id: uuidv4(),
      })),
    };

    setFloors(prevFloors => {
      const newFloors = [...prevFloors, newFloor];
      floorsRef.current = newFloors;
      return newFloors;
    });

    setActiveFloorId(newFloor.id);
    activeFloorIdRef.current = newFloor.id;
    return newFloor.id;
  };

  const deleteFloor = (id: string) => {
    if (floorsRef.current.length <= 1) return;

    setFloors(prevFloors => {
      const newFloors = prevFloors.filter(floor => floor.id !== id);
      floorsRef.current = newFloors;
      return newFloors;
    });

    if (activeFloorIdRef.current === id) {
      const newActiveFloor = floorsRef.current.find(floor => floor.id !== id);
      if (newActiveFloor) {
        setActiveFloorId(newActiveFloor.id);
        activeFloorIdRef.current = newActiveFloor.id;
      }
    }
  };

  const updateFloor = (id: string, updatedFloor: Partial<Floor>) => {
    setFloors(prevFloors => {
      const newFloors = prevFloors.map(floor => (floor.id === id ? { ...floor, ...updatedFloor } : floor));
      floorsRef.current = newFloors;
      return newFloors;
    });
  };

  const addModule = (module: Omit<Module, 'id'> | Module): string => {
    const activeId = ensureActiveFloor();

    let newModule: Module;
    if ('id' in module) {
      newModule = module as Module;
      if (!newModule.walls) {
        newModule.walls = createDefaultWalls();
      }
      if (!newModule.bathroomPods) {
        newModule.bathroomPods = [];
      }
    } else {
      newModule = {
        ...module,
        id: uuidv4(),
        name: module.name || getNextModuleName(),
        walls: module.walls || createDefaultWalls(),
        bathroomPods: module.bathroomPods || [],
      };
    }

    setFloors(prevFloors => {
      const newFloors = prevFloors.map(floor =>
          floor.id === activeId
              ? {
                ...floor,
                modules: [...floor.modules, newModule],
              }
              : floor
      );
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
      floorsRef.current = newFloors;
      return newFloors;
    });
  };

  const addBalcony = (balcony: Omit<Balcony, 'id'> | Balcony): string => {
    const activeId = ensureActiveFloor();

    const newBalcony =
        'id' in balcony
            ? (balcony as Balcony)
            : {
              ...balcony,
              id: uuidv4(),
              name: balcony.name || getNextBalconyName(),
            };

    setFloors(prevFloors => {
      const newFloors = prevFloors.map(floor =>
          floor.id === activeId
              ? {
                ...floor,
                balconies: [...floor.balconies, newBalcony],
              }
              : floor
      );
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
      floorsRef.current = newFloors;
      return newFloors;
    });
  };

  // New methods for corridors
  const addCorridor = (corridor: Omit<Corridor, 'id'> | Corridor): string => {
    const activeId = ensureActiveFloor();

    const newCorridor =
        'id' in corridor
            ? (corridor as Corridor)
            : {
              ...corridor,
              id: uuidv4(),
              name: corridor.name || getNextCorridorName(),
            };

    setFloors(prevFloors => {
      const newFloors = prevFloors.map(floor =>
          floor.id === activeId
              ? {
                ...floor,
                corridors: [...floor.corridors, newCorridor],
              }
              : floor
      );
      floorsRef.current = newFloors;
      return newFloors;
    });

    return newCorridor.id;
  };

  const updateCorridor = (id: string, updatedCorridor: Partial<Corridor>) => {
    setFloors(prevFloors => {
      const newFloors = prevFloors.map(floor => ({
        ...floor,
        corridors: floor.corridors.map(corridor =>
            corridor.id === id ? { ...corridor, ...updatedCorridor } : corridor
        ),
      }));
      floorsRef.current = newFloors;
      return newFloors;
    });
  };

  const deleteCorridor = (id: string) => {
    setFloors(prevFloors => {
      const newFloors = prevFloors.map(floor => ({
        ...floor,
        corridors: floor.corridors.filter(corridor => corridor.id !== id),
      }));
      floorsRef.current = newFloors;
      return newFloors;
    });
  };

  // New methods for roofs
  const addRoof = (roof: Omit<Roof, 'id'> | Roof): string => {
    const activeId = ensureActiveFloor();

    const newRoof =
        'id' in roof
            ? (roof as Roof)
            : {
              ...roof,
              id: uuidv4(),
              name: roof.name || getNextRoofName(),
            };

    setFloors(prevFloors => {
      const newFloors = prevFloors.map(floor =>
          floor.id === activeId
              ? {
                ...floor,
                roofs: [...floor.roofs, newRoof],
              }
              : floor
      );
      floorsRef.current = newFloors;
      return newFloors;
    });

    return newRoof.id;
  };

  const updateRoof = (id: string, updatedRoof: Partial<Roof>) => {
    setFloors(prevFloors => {
      const newFloors = prevFloors.map(floor => ({
        ...floor,
        roofs: floor.roofs.map(roof =>
            roof.id === id ? { ...roof, ...updatedRoof } : roof
        ),
      }));
      floorsRef.current = newFloors;
      return newFloors;
    });
  };

  const deleteRoof = (id: string) => {
    setFloors(prevFloors => {
      const newFloors = prevFloors.map(floor => ({
        ...floor,
        roofs: floor.roofs.filter(roof => roof.id !== id),
      }));
      floorsRef.current = newFloors;
      return newFloors;
    });
  };

  // New methods for bathroom pods
  const addBathroomPod = (moduleId: string, pod: Omit<BathroomPod, 'id'>): string => {
    const newPod = { ...pod, id: uuidv4() };

    setFloors(prevFloors => {
      const newFloors = prevFloors.map(floor => ({
        ...floor,
        modules: floor.modules.map(module => {
          if (module.id === moduleId) {
            return {
              ...module,
              bathroomPods: [...(module.bathroomPods || []), newPod]
            };
          }
          return module;
        })
      }));
      floorsRef.current = newFloors;
      return newFloors;
    });

    return newPod.id;
  };

  const updateBathroomPod = (moduleId: string, podId: string, updatedPod: Partial<BathroomPod>) => {
    setFloors(prevFloors => {
      const newFloors = prevFloors.map(floor => ({
        ...floor,
        modules: floor.modules.map(module => {
          if (module.id === moduleId) {
            return {
              ...module,
              bathroomPods: (module.bathroomPods || []).map(pod =>
                  pod.id === podId ? { ...pod, ...updatedPod } : pod
              )
            };
          }
          return module;
        })
      }));
      floorsRef.current = newFloors;
      return newFloors;
    });
  };

  const deleteBathroomPod = (moduleId: string, podId: string) => {
    setFloors(prevFloors => {
      const newFloors = prevFloors.map(floor => ({
        ...floor,
        modules: floor.modules.map(module => {
          if (module.id === moduleId) {
            return {
              ...module,
              bathroomPods: (module.bathroomPods || []).filter(pod => pod.id !== podId)
            };
          }
          return module;
        })
      }));
      floorsRef.current = newFloors;
      return newFloors;
    });
  };

  // New methods for openings
  const addOpening = (moduleId: string, opening: Omit<Opening, 'id'>): string => {
    const newOpening = { ...opening, id: uuidv4() };

    setFloors(prevFloors => {
      const newFloors = prevFloors.map(floor => ({
        ...floor,
        modules: floor.modules.map(module => {
          if (module.id === moduleId) {
            return {
              ...module,
              openings: [...module.openings, newOpening]
            };
          }
          return module;
        })
      }));
      floorsRef.current = newFloors;
      return newFloors;
    });

    return newOpening.id;
  };

  const updateOpening = (moduleId: string, openingId: string, updatedOpening: Partial<Opening>) => {
    setFloors(prevFloors => {
      const newFloors = prevFloors.map(floor => ({
        ...floor,
        modules: floor.modules.map(module => {
          if (module.id === moduleId) {
            return {
              ...module,
              openings: module.openings.map(opening =>
                  opening.id === openingId ? { ...opening, ...updatedOpening } : opening
              )
            };
          }
          return module;
        })
      }));
      floorsRef.current = newFloors;
      return newFloors;
    });
  };

  const deleteOpening = (moduleId: string, openingId: string) => {
    setFloors(prevFloors => {
      const newFloors = prevFloors.map(floor => ({
        ...floor,
        modules: floor.modules.map(module => {
          if (module.id === moduleId) {
            return {
              ...module,
              openings: module.openings.filter(opening => opening.id !== openingId)
            };
          }
          return module;
        })
      }));
      floorsRef.current = newFloors;
      return newFloors;
    });
  };

  const updateGridSettingsHandler = (settings: Partial<GridSettings>) => {
    setGridSettings(prev => {
      const updatedSettings = { ...prev, ...settings };
      return updatedSettings;
    });
  };

  const updateCanvasSettingsHandler = (settings: Partial<CanvasSettings>) => {
    setCanvasSettings(prev => ({ ...prev, ...settings }));
  };

  const updateToolStateHandler = (state: Partial<ToolState>) => {
    setToolState(prev => {
      const newState = { ...prev, ...state };
      return newState;
    });
  };

  const updateDisplaySettingsHandler = (settings: Partial<DisplaySettings>) => {
    setDisplaySettings(prev => ({ ...prev, ...settings }));
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

  const getCorridorById = (id: string) => {
    // Use the current floor ref to avoid stale data
    for (const floor of floorsRef.current) {
      const corridor = floor.corridors.find(c => c.id === id);
      if (corridor) return corridor;
    }
    return undefined;
  };

  const getRoofById = (id: string) => {
    // Use the current floor ref to avoid stale data
    for (const floor of floorsRef.current) {
      const roof = floor.roofs.find(r => r.id === id);
      if (roof) return roof;
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
            addCorridor,
            updateCorridor,
            deleteCorridor,
            addRoof,
            updateRoof,
            deleteRoof,
            addBathroomPod,
            updateBathroomPod,
            deleteBathroomPod,
            addOpening,
            updateOpening,
            deleteOpening,
            setGridSettings: updateGridSettingsHandler,
            setCanvasSettings: updateCanvasSettingsHandler,
            setToolState: updateToolStateHandler,
            getActiveFloor,
            getModuleById,
            getBalconyById,
            getCorridorById,
            getRoofById,
            ensureActiveFloor,
            displaySettings,
            setDisplaySettings: updateDisplaySettingsHandler,
            moduleNamePrefix,
            setModuleNamePrefix,
            getNextModuleName,
            getNextCorridorName,
            getNextRoofName,
            getNextBalconyName,
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
