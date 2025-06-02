// src/utils/exportImport.ts
import {useObjectStore} from '@/state/objectStore';
import {FloorExport, ImportOptions, ProjectExport} from '@/types/floor';
import {useFloorStore} from '@/state/floorStore';

/**
 * Convert a File/Blob to base64 string
 */
async function fileToBase64(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix if present
      const base64 = result.split(',')[1] || result;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Convert base64 string to blob URL
 */
function base64ToBlob(base64: string, mimeType: string = 'application/pdf'): string {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: mimeType });
  return URL.createObjectURL(blob);
}

/**
 * Get elements for a specific floor
 */
function getFloorElements(floorId: string) {
  const objectStore = useObjectStore.getState();

  // Get floor number from floor store
  const floorStore = useFloorStore.getState();
  const floor = floorStore.getFloorById(floorId);
  if (!floor) return { modules: [], openings: [], balconies: [], bathroomPods: [], corridors: [], roofs: [] };

  // For now, we'll use floor index as floor number (this might need adjustment based on your floor numbering system)
  const floorIndex = floorStore.floors.findIndex(f => f.id === floorId) + 1;

  // Filter elements by floor
  const modules = objectStore.modules.filter(module => {
    // Modules can span multiple floors based on stackedFloors
    const moduleStartFloor = Math.floor(module.zOffset / (module.height || 3100)) + 1;
    const moduleEndFloor = moduleStartFloor + module.stackedFloors - 1;
    return floorIndex >= moduleStartFloor && floorIndex <= moduleEndFloor;
  });

  const moduleIds = new Set(modules.map(m => m.id));

  return {
    modules,
    openings: objectStore.openings.filter(opening => moduleIds.has(opening.moduleId)),
    balconies: objectStore.balconies.filter(balcony => moduleIds.has(balcony.moduleId)),
    bathroomPods: objectStore.bathroomPods.filter(pod => moduleIds.has(pod.moduleId)),
    corridors: objectStore.corridors.filter(corridor => corridor.floor === floorIndex),
    roofs: objectStore.roofs.filter((roof: any) => roof.level === floorIndex),
  };
}

/**
 * Export entire project to JSON
 */
export async function exportProject(): Promise<ProjectExport> {
  const floorStore = useFloorStore.getState();
  const { floors } = floorStore;

  const floorExports: FloorExport[] = [];

  for (const floor of floors) {
    const elements = getFloorElements(floor.id);

    let pdfData: FloorExport['pdfData'] = undefined;

    // If floor has PDF, convert to base64
    if (floor.pdf) {
      try {
        // Try to fetch the PDF blob from the object URL
        const response = await fetch(floor.pdf.url);
        const blob = await response.blob();
        const base64 = await fileToBase64(blob);

        pdfData = {
          filename: `floor_${floor.name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
          base64,
          widthGrid: Math.round(floor.pdf.widthGrid),
          heightGrid: Math.round(floor.pdf.heightGrid),
          opacity: floor.pdf.opacity,
        };
      } catch (error) {
        console.warn(`Failed to export PDF for floor ${floor.name}:`, error);
      }
    }

    const floorExport: FloorExport = {
      id: floor.id,
      name: floor.name,
      height: Math.round(floor.height),
      gridSettings: {
        ...floor.gridSettings,
        gridSize: Math.round(floor.gridSettings.gridSize),
        elementGap: Math.round(floor.gridSettings.elementGap),
      },
      calibrated: floor.pdf?.calibrated || false,
      pdfData,
      elements,
    };

    floorExports.push(floorExport);
  }

  const projectExport: ProjectExport = {
    meta: {
      exportedAt: new Date().toISOString(),
    },
    building: {
      name: 'Untitled Building',
    },
    floors: floorExports,
    globalSettings: {
      defaultGridSize: 100,
    },
  };

  return projectExport;
}

/**
 * Import project from JSON data
 */
export async function importProject(data: ProjectExport, options: ImportOptions): Promise<void> {
  const floorStore = useFloorStore.getState();
  const objectStore = useObjectStore.getState();

  try {
    // Clear existing data if importing floors
    if (options.importFloors) {
      // Clear existing floors
      floorStore.floors.forEach(floor => {
        floorStore.deleteFloor(floor.id);
      });

      // Clear existing objects if importing elements
      if (options.importElements) {
        // Clear all objects
        objectStore.modules.forEach(module => objectStore.deleteModule(module.id));
        objectStore.corridors.forEach(corridor => objectStore.deleteCorridor(corridor.id));
        objectStore.balconies.forEach(balcony => objectStore.deleteBalcony(balcony.id));
        objectStore.bathroomPods.forEach(pod => objectStore.deleteBathroomPod(pod.id));
        objectStore.openings.forEach(opening => objectStore.deleteOpening(opening.id));
      }
    }

    // Import floors
    if (options.importFloors) {
      for (const floorData of data.floors) {
        // Create floor
        const floorId = floorStore.addFloor(floorData.name, Math.round(floorData.height));

        // Update grid settings
        floorStore.updateFloorGridSettings(floorId, {
          ...floorData.gridSettings,
          gridSize: Math.round(floorData.gridSettings.gridSize),
          elementGap: Math.round(floorData.gridSettings.elementGap),
        });

        // Import PDF if enabled
        if (options.importPDFs && floorData.pdfData) {
          try {
            const blobUrl = base64ToBlob(floorData.pdfData.base64);
            floorStore.setFloorPDF(floorId, {
              url: blobUrl,
              widthGrid: Math.round(floorData.pdfData.widthGrid),
              heightGrid: Math.round(floorData.pdfData.heightGrid),
              calibrated: floorData.calibrated,
              opacity: floorData.pdfData.opacity,
            });
          } catch (error) {
            console.warn(`Failed to import PDF for floor ${floorData.name}:`, error);
          }
        }

        // Import elements if enabled
        if (options.importElements) {
          // Import modules
          floorData.elements.modules.forEach(module => {
            objectStore.addModule({
              ...module,
              width: Math.round(module.width),
              length: Math.round(module.length),
              height: Math.round(module.height),
              x0: Math.round(module.x0),
              y0: Math.round(module.y0),
              zOffset: Math.round(module.zOffset),
              rotation: Math.round(module.rotation),
              stackedFloors: Math.round(module.stackedFloors),
            });
          });

          // Import openings
          floorData.elements.openings.forEach(opening => {
            objectStore.addOpening({
              ...opening,
              width: Math.round(opening.width),
              height: Math.round(opening.height),
              distanceAlongWall: Math.round(opening.distanceAlongWall),
              yOffset: Math.round(opening.yOffset),
            });
          });

          // Import balconies
          floorData.elements.balconies.forEach(balcony => {
            objectStore.addBalcony({
              ...balcony,
              width: Math.round(balcony.width),
              length: Math.round(balcony.length),
              distanceAlongWall: Math.round(balcony.distanceAlongWall),
            });
          });

          // Import bathroom pods
          floorData.elements.bathroomPods.forEach(pod => {
            objectStore.addBathroomPod({
              ...pod,
              width: Math.round(pod.width),
              length: Math.round(pod.length),
              x_offset: Math.round(pod.x_offset),
              y_offset: Math.round(pod.y_offset),
            });
          });

          // Import corridors
          floorData.elements.corridors.forEach(corridor => {
            objectStore.addCorridor({
              ...corridor,
              x1: Math.round(corridor.x1),
              y1: Math.round(corridor.y1),
              x2: Math.round(corridor.x2),
              y2: Math.round(corridor.y2),
              floor: Math.round(corridor.floor),
            });
          });
        }
      }

      // Set the first imported floor as current
      if (data.floors.length > 0) {
        floorStore.setCurrentFloor(floorStore.floors[0].id);
      }
    }

    console.log('Project imported successfully');
  } catch (error) {
    console.error('Failed to import project:', error);
    throw error;
  }
}

/**
 * Download data as JSON file
 */
export function downloadJSON(data: any, filename: string): void {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

/**
 * Read JSON file
 */
export function readJSONFile(file: File): Promise<any> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const data = JSON.parse(e.target?.result as string);
        resolve(data);
      } catch (error) {
        reject(new Error('Invalid JSON file'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}
