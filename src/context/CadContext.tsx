// src/context/CadContext.tsx
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Balcony, CanvasSettings, Floor, GridSettings, Module, ModuleColors, ToolState, ToolType } from '@/types';

interface CadContextType {
  floors: Floor[];
  activeFloorId: string;
  gridSettings: GridSettings;
  canvasSettings: CanvasSettings;
  toolState: ToolState;
  moduleColors: ModuleColors;
  setFloors: (floors: Floor[]) => void;
  addFloor: (name: string) => void;
  duplicateFloor: (id: string) => void;
  deleteFloor: (id: string) => void;
  setActiveFloorId: (id: string) => void;
  updateFloor: (id: string, floor: Partial<Floor>) => void;
  addModule: (module: Omit<Module, 'id'>) => void;
  updateModule: (id: string, module: Partial<Module>) => void;
  deleteModule: (id: string) => void;
  addBalcony: (balcony: Omit<Balcony, 'id'>) => void;
  updateBalcony: (id: string, balcony: Partial<Balcony>) => void;
  deleteBalcony: (id: string) => void;
  setGridSettings: (settings: Partial<GridSettings>) => void;
  setCanvasSettings: (settings: Partial<CanvasSettings>) => void;
  setToolState: (state: Partial<ToolState>) => void;
  getActiveFloor: () => Floor | undefined;
  getModuleById: (id: string) => Module | undefined;
  getBalconyById: (id: string) => Balcony | undefined;
}

const defaultGridSettings: GridSettings = {
  size: 20,
  color: '#cccccc',
  opacity: 0.5,
  visible: true,
  snapToGrid: true,
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

  // Initialize with a default floor on first render
  useEffect(() => {
    if (floors.length === 0) {
      const firstFloorId = uuidv4();
      setFloors([
        {
          id: firstFloorId,
          name: 'Floor 1',
          modules: [],
          balconies: [],
          visible: true,
        },
      ]);
      setActiveFloorId(firstFloorId);
    }
  }, [floors.length]);

  const addFloor = (name: string) => {
    const newFloor: Floor = {
      id: uuidv4(),
      name,
      modules: [],
      balconies: [],
      visible: true,
    };
    setFloors([...floors, newFloor]);
  };

  const duplicateFloor = (id: string) => {
    const floorToDuplicate = floors.find(floor => floor.id === id);
    if (!floorToDuplicate) return;

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

    setFloors([...floors, newFloor]);
  };

  const deleteFloor = (id: string) => {
    if (floors.length <= 1) return; // Always keep at least one floor
    setFloors(floors.filter(floor => floor.id !== id));

    // If the deleted floor was active, set the first available floor as active
    if (activeFloorId === id) {
      const newActiveFloor = floors.find(floor => floor.id !== id);
      if (newActiveFloor) {
        setActiveFloorId(newActiveFloor.id);
      }
    }
  };

  const updateFloor = (id: string, updatedFloor: Partial<Floor>) => {
    setFloors(floors.map(floor => (floor.id === id ? { ...floor, ...updatedFloor } : floor)));
  };

  const addModule = (module: Omit<Module, 'id'>) => {
    const newModule: Module = {
      ...module,
      id: uuidv4(),
    };

    setFloors(
      floors.map(floor =>
        floor.id === activeFloorId
          ? {
              ...floor,
              modules: [...floor.modules, newModule],
            }
          : floor
      )
    );
  };

  const updateModule = (id: string, updatedModule: Partial<Module>) => {
    setFloors(
      floors.map(floor => ({
        ...floor,
        modules: floor.modules.map(module => (module.id === id ? { ...module, ...updatedModule } : module)),
      }))
    );
  };

  const deleteModule = (id: string) => {
    setFloors(
      floors.map(floor => ({
        ...floor,
        modules: floor.modules.filter(module => module.id !== id),
      }))
    );
  };

  const addBalcony = (balcony: Omit<Balcony, 'id'>) => {
    const newBalcony: Balcony = {
      ...balcony,
      id: uuidv4(),
    };

    setFloors(
      floors.map(floor =>
        floor.id === activeFloorId ? { ...floor, balconies: [...floor.balconies, newBalcony] } : floor
      )
    );
  };

  const updateBalcony = (id: string, updatedBalcony: Partial<Balcony>) => {
    setFloors(
      floors.map(floor => ({
        ...floor,
        balconies: floor.balconies.map(balcony => (balcony.id === id ? { ...balcony, ...updatedBalcony } : balcony)),
      }))
    );
  };

  const deleteBalcony = (id: string) => {
    setFloors(
      floors.map(floor => ({
        ...floor,
        balconies: floor.balconies.filter(balcony => balcony.id !== id),
      }))
    );
  };

  const updateGridSettingsHandler = (settings: Partial<GridSettings>) => {
    setGridSettings({ ...gridSettings, ...settings });
  };

  const updateCanvasSettingsHandler = (settings: Partial<CanvasSettings>) => {
    setCanvasSettings({ ...canvasSettings, ...settings });
  };

  const updateToolStateHandler = (state: Partial<ToolState>) => {
    setToolState({ ...toolState, ...state });
  };

  const getActiveFloor = () => {
    return floors.find(floor => floor.id === activeFloorId);
  };

  const getModuleById = (id: string) => {
    for (const floor of floors) {
      const module = floor.modules.find(m => m.id === id);
      if (module) return module;
    }
    return undefined;
  };

  const getBalconyById = (id: string) => {
    for (const floor of floors) {
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
