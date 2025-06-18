import { IFloor, IModule } from '../types/floor';

export interface ModuleSummaryRow {
  moduleName: string;       // e.g. "M1", "M2A", "M2B"
  width: number;            // mm
  length: number;           // mm
  height: number;           // mm
  x0: number;               // mm
  y0: number;               // mm
  zOffset: number;          // mm
  rotation: number;         // degrees
  floors: number[];         // list of floorNumbers where this exact configuration appears
  stackedCount: number;     // number of floors in which it is identical
  notes: string;            // short description of any differences per floor
}

interface ModuleWithFloor extends IModule {
  floorNumber: number;
}

// Generate a signature string for a module configuration
function generateModuleSignature(module: IModule): string {
  // Sort openings by side then distanceAlongWall
  const sortedOpenings = [...module.openings].sort((a, b) => {
    if (a.side !== b.side) return a.side - b.side;
    return a.distanceAlongWall - b.distanceAlongWall;
  });

  // Sort balconies by side then distanceAlongWall
  const sortedBalconies = [...module.balconies].sort((a, b) => {
    if (a.side !== b.side) return a.side - b.side;
    return a.distanceAlongWall - b.distanceAlongWall;
  });

  // Sort bathroomPods by xOffset then yOffset
  const sortedBathroomPods = [...module.bathroomPods].sort((a, b) => {
    if (a.xOffset !== b.xOffset) return a.xOffset - b.xOffset;
    return a.yOffset - b.yOffset;
  });

  // Create serialized representations
  const openingsStr = sortedOpenings.map(o =>
    `O:${o.side},${o.width},${o.height},${o.distanceAlongWall},${o.yOffset}`
  ).join('|');

  const balconiesStr = sortedBalconies.map(b =>
    `B:${b.side},${b.width},${b.length},${b.distanceAlongWall}`
  ).join('|');

  const bathroomPodsStr = sortedBathroomPods.map(bp =>
    `BP:${bp.width},${bp.length},${bp.xOffset},${bp.yOffset}`
  ).join('|');

  // Combine all properties into a signature
  return `${module.width},${module.length},${module.height},${module.x0},${module.y0},${module.zOffset},${module.rotation}|${openingsStr}|${balconiesStr}|${bathroomPodsStr}`;
}

// Compare two modules and generate a description of differences
function generateDifferenceNotes(module1: IModule, module2: IModule, floor2Number: number): string {
  const differences: string[] = [];

  // Check basic properties
  if (module1.width !== module2.width || module1.length !== module2.length || module1.height !== module2.height) {
    differences.push(`Floor ${floor2Number}: dimensions changed`);
  }

  if (module1.x0 !== module2.x0 || module1.y0 !== module2.y0) {
    differences.push(`Floor ${floor2Number}: position changed to (${module2.x0}, ${module2.y0})`);
  }

  if (module1.zOffset !== module2.zOffset) {
    differences.push(`Floor ${floor2Number}: zOffset = ${module2.zOffset}`);
  }

  if (module1.rotation !== module2.rotation) {
    differences.push(`Floor ${floor2Number}: rotation = ${module2.rotation}°`);
  }

  // Check openings
  const openings1Map = new Map(module1.openings.map(o => [`${o.side}-${o.distanceAlongWall}`, o]));
  const openings2Map = new Map(module2.openings.map(o => [`${o.side}-${o.distanceAlongWall}`, o]));

  module2.openings.forEach(o => {
    const key = `${o.side}-${o.distanceAlongWall}`;
    const existing = openings1Map.get(key);
    if (!existing) {
      differences.push(`Floor ${floor2Number}: opening added at side ${o.side}`);
    } else if (existing.width !== o.width || existing.height !== o.height || existing.yOffset !== o.yOffset) {
      differences.push(`Floor ${floor2Number}: opening at side ${o.side} modified`);
    }
  });

  module1.openings.forEach(o => {
    const key = `${o.side}-${o.distanceAlongWall}`;
    if (!openings2Map.has(key)) {
      differences.push(`Floor ${floor2Number}: opening at side ${o.side} removed`);
    }
  });

  // Check balconies
  const balconies1Ids = new Set(module1.balconies.map(b => b.id));
  const balconies2Ids = new Set(module2.balconies.map(b => b.id));

  module2.balconies.forEach(b => {
    if (!balconies1Ids.has(b.id)) {
      differences.push(`Floor ${floor2Number}: balcony ${b.id} added`);
    }
  });

  module1.balconies.forEach(b => {
    if (!balconies2Ids.has(b.id)) {
      differences.push(`Floor ${floor2Number}: balcony ${b.id} removed`);
    }
  });

  // Check bathroom pods
  const pods1Ids = new Set(module1.bathroomPods.map(bp => bp.id));
  const pods2Ids = new Set(module2.bathroomPods.map(bp => bp.id));

  module2.bathroomPods.forEach(bp => {
    if (!pods1Ids.has(bp.id)) {
      differences.push(`Floor ${floor2Number}: bathroomPod ${bp.id} added`);
    }
  });

  module1.bathroomPods.forEach(bp => {
    if (!pods2Ids.has(bp.id)) {
      differences.push(`Floor ${floor2Number}: bathroomPod ${bp.id} removed`);
    }
  });

  return differences.join('; ');
}

export function generateModuleSummary(floors: Record<number, IFloor>): ModuleSummaryRow[] {
  // Map from signature to ModuleSummaryRow
  const signatureMap = new Map<string, ModuleSummaryRow>();

  // Map from moduleId to list of different configurations
  const moduleIdToConfigs = new Map<string, Array<{ signature: string; module: IModule; floors: number[] }>>();

  // Track all modules with their floor numbers
  const allModulesWithFloors: ModuleWithFloor[] = [];

  // Step 1: Iterate over all floors and modules
  Object.entries(floors).forEach(([floorNumStr, floor]) => {
    const floorNumber = parseInt(floorNumStr);

    floor.modules.forEach(module => {
      const signature = generateModuleSignature(module);

      // Track this module with its floor
      allModulesWithFloors.push({ ...module, floorNumber });

      // Check if this signature already exists
      if (signatureMap.has(signature)) {
        // Update existing row
        const row = signatureMap.get(signature)!;
        row.floors.push(floorNumber);
        row.stackedCount++;
      } else {
        // Create new row
        const newRow: ModuleSummaryRow = {
          moduleName: module.moduleId,
          width: module.width,
          length: module.length,
          height: module.height,
          x0: module.x0,
          y0: module.y0,
          zOffset: module.zOffset,
          rotation: module.rotation,
          floors: [floorNumber],
          stackedCount: 1,
          notes: ''
        };
        signatureMap.set(signature, newRow);
      }

      // Track configurations by moduleId
      if (!moduleIdToConfigs.has(module.moduleId)) {
        moduleIdToConfigs.set(module.moduleId, []);
      }

      const configs = moduleIdToConfigs.get(module.moduleId)!;
      const existingConfig = configs.find(c => c.signature === signature);

      if (existingConfig) {
        existingConfig.floors.push(floorNumber);
      } else {
        configs.push({
          signature,
          module: { ...module },
          floors: [floorNumber]
        });
      }
    });
  });

  // Step 2: Handle modules with multiple configurations
  moduleIdToConfigs.forEach((configs, baseModuleId) => {
    if (configs.length > 1) {
      // Sort configs by first floor number for consistent naming
      configs.sort((a, b) => Math.min(...a.floors) - Math.min(...b.floors));

      // Rename configurations to M2A, M2B, etc.
      const suffix = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      configs.forEach((config, index) => {
        const row = signatureMap.get(config.signature);
        if (row) {
          row.moduleName = `${baseModuleId}${suffix[index]}`;

          // Generate notes about differences from the first configuration
          if (index > 0) {
            const baseModule = configs[0].module;
            const differences = generateDifferenceNotes(baseModule, config.module, Math.min(...config.floors));
            row.notes = differences;
          }
        }
      });
    }
  });

  // Convert map to array and sort by module name
  const result = Array.from(signatureMap.values()).sort((a, b) => {
    // Extract base name and suffix for natural sorting
    const aMatch = a.moduleName.match(/^([A-Z]+)(\d+)([A-Z]?)$/);
    const bMatch = b.moduleName.match(/^([A-Z]+)(\d+)([A-Z]?)$/);

    if (aMatch && bMatch) {
      // Compare prefix (M, BC, BP, etc.)
      if (aMatch[1] !== bMatch[1]) {
        return aMatch[1].localeCompare(bMatch[1]);
      }

      // Compare number
      const aNum = parseInt(aMatch[2]);
      const bNum = parseInt(bMatch[2]);
      if (aNum !== bNum) {
        return aNum - bNum;
      }

      // Compare suffix (A, B, C, etc.)
      return aMatch[3].localeCompare(bMatch[3]);
    }

    // Fallback to simple string comparison
    return a.moduleName.localeCompare(b.moduleName);
  });

  return result;
}
