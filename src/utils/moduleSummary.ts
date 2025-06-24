import { IFloor, IModule } from '../types/floor';

export interface ModuleSummaryRow {
  moduleName: string;
  width: number;
  length: number;
  height: number;
  x0: number;
  y0: number;
  zOffset: number;
  rotation: number;
  floors: number[];
  stackedCount: number;
  notes: string;
}

interface ModuleWithFloor extends IModule {
  floorNumber: number;
}

function generateModuleSignature(module: IModule): string {
  const sortedOpenings = [...module.openings].sort((a, b) => {
    if (a.side !== b.side) return a.side - b.side;
    return a.distanceAlongWall - b.distanceAlongWall;
  });

  const sortedBalconies = [...module.balconies].sort((a, b) => {
    if (a.side !== b.side) return a.side - b.side;
    return a.distanceAlongWall - b.distanceAlongWall;
  });

  const sortedBathroomPods = [...module.bathroomPods].sort((a, b) => {
    if (a.xOffset !== b.xOffset) return a.xOffset - b.xOffset;
    return a.yOffset - b.yOffset;
  });

  const openingsStr = sortedOpenings.map(o =>
    `O:${o.side},${o.width},${o.height},${o.distanceAlongWall},${o.yOffset}`
  ).join('|');

  const balconiesStr = sortedBalconies.map(b =>
    `B:${b.side},${b.width},${b.length},${b.distanceAlongWall}`
  ).join('|');

  const bathroomPodsStr = sortedBathroomPods.map(bp =>
    `BP:${bp.width},${bp.length},${bp.xOffset},${bp.yOffset}`
  ).join('|');

  return `${module.width},${module.length},${module.height},${module.x0},${module.y0},${module.zOffset},${module.rotation}|${openingsStr}|${balconiesStr}|${bathroomPodsStr}`;
}

function generateDifferenceNotes(module1: IModule, module2: IModule, floor2Number: number): string {
  const differences: string[] = [];

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
  const signatureMap = new Map<string, ModuleSummaryRow>();

  const moduleIdToConfigs = new Map<string, Array<{ signature: string; module: IModule; floors: number[] }>>();

  const allModulesWithFloors: ModuleWithFloor[] = [];

  Object.entries(floors).forEach(([floorNumStr, floor]) => {
    const floorNumber = parseInt(floorNumStr);

    floor.modules.forEach(module => {
      const signature = generateModuleSignature(module);

      allModulesWithFloors.push({ ...module, floorNumber });

      if (signatureMap.has(signature)) {
        const row = signatureMap.get(signature)!;
        row.floors.push(floorNumber);
        row.stackedCount++;
      } else {
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

  moduleIdToConfigs.forEach((configs, baseModuleId) => {
    if (configs.length > 1) {
      configs.sort((a, b) => Math.min(...a.floors) - Math.min(...b.floors));

      const suffix = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      configs.forEach((config, index) => {
        const row = signatureMap.get(config.signature);
        if (row) {
          row.moduleName = `${baseModuleId}${suffix[index]}`;

          if (index > 0) {
            const baseModule = configs[0].module;
            const differences = generateDifferenceNotes(baseModule, config.module, Math.min(...config.floors));
            row.notes = differences;
          }
        }
      });
    }
  });

  const result = Array.from(signatureMap.values()).sort((a, b) => {
    const aMatch = a.moduleName.match(/^([A-Z]+)(\d+)([A-Z]?)$/);
    const bMatch = b.moduleName.match(/^([A-Z]+)(\d+)([A-Z]?)$/);

    if (aMatch && bMatch) {
      if (aMatch[1] !== bMatch[1]) {
        return aMatch[1].localeCompare(bMatch[1]);
      }

      const aNum = parseInt(aMatch[2]);
      const bNum = parseInt(bMatch[2]);
      if (aNum !== bNum) {
        return aNum - bNum;
      }

      return aMatch[3].localeCompare(bMatch[3]);
    }

    return a.moduleName.localeCompare(b.moduleName);
  });

  return result;
}
