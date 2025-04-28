import { fabric } from 'fabric';

/**
 * Gets data from all module objects on the canvas suitable for export
 */
export const getModulesData = (canvas: fabric.Canvas): any[] => {
    if (!canvas) return [];

    const modules: any[] = [];

    // Get all modules
    canvas.getObjects().forEach(obj => {
        if (obj.data?.type === 'module') {
            // Extract module data according to spec
            const moduleData = {
                name: obj.data.name,
                width: obj.data.width,
                length: obj.data.length,
                height: 3100, // Default height as per spec (could be made configurable)
                x0: obj.left,
                y0: obj.top,
                z_offset: obj.data.z_offset || 0,
                rotation: obj.data.rotation || 0,
                floors: obj.data.floors || 1,
            };

            modules.push(moduleData);
        }
    });

    return modules;
};

/**
 * Gets data from all opening objects on the canvas suitable for export
 */
export const getOpeningsData = (canvas: fabric.Canvas): any[] => {
    if (!canvas) return [];

    const openings: any[] = [];

    // Get all openings
    canvas.getObjects().forEach(obj => {
        if (obj.data?.type === 'opening') {
            // Extract opening data according to spec
            const openingData = {
                moduleId: obj.data.moduleId,
                wallSide: obj.data.wallSide,
                width: obj.data.width,
                height: obj.data.height,
                distance: obj.data.distance,
                y_offset: obj.data.y_offset,
            };

            openings.push(openingData);
        }
    });

    return openings;
};

/**
 * Gets data from all balcony objects on the canvas suitable for export
 */
export const getBalconiesData = (canvas: fabric.Canvas): any[] => {
    if (!canvas) return [];

    const balconies: any[] = [];

    // Get all balconies
    canvas.getObjects().forEach(obj => {
        if (obj.data?.type === 'balcony') {
            // Extract balcony data according to spec
            const balconyData = {
                name: obj.data.name,
                moduleId: obj.data.moduleId,
                wallSide: obj.data.wallSide,
                width: obj.data.width,
                length: obj.data.length,
                distance: obj.data.distance,
            };

            balconies.push(balconyData);
        }
    });

    return balconies;
};

/**
 * Gets data from all bathroom pod objects on the canvas suitable for export
 */
export const getBathroomPodsData = (canvas: fabric.Canvas): any[] => {
    if (!canvas) return [];

    const bathroomPods: any[] = [];

    // Get all bathroom pods
    canvas.getObjects().forEach(obj => {
        if (obj.data?.type === 'bathroom') {
            // Extract bathroom pod data according to spec
            const bathroomData = {
                name: obj.data.id,
                moduleId: obj.data.moduleId,
                width: obj.data.width,
                length: obj.data.length,
                x_offset: obj.data.x_offset,
                y_offset: obj.data.y_offset,
            };

            bathroomPods.push(bathroomData);
        }
    });

    return bathroomPods;
};

/**
 * Gets data from all corridor objects on the canvas suitable for export
 */
export const getCorridorsData = (canvas: fabric.Canvas): any[] => {
    if (!canvas) return [];

    const corridors: any[] = [];

    // Get all corridors
    canvas.getObjects().forEach(obj => {
        if (obj.data?.type === 'corridor') {
            // Extract corridor data according to spec
            const corridorData = {
                name: obj.data.name,
                direction: obj.data.direction,
                floor: obj.data.floor || 1,
                x1: obj.data.x1 || obj.left,
                y1: obj.data.y1 || obj.top,
                x2: obj.data.x2 || (obj.left! + obj.width!),
                y2: obj.data.y2 || (obj.top! + obj.height!),
            };

            corridors.push(corridorData);
        }
    });

    return corridors;
};

/**
 * Creates a complete export dataset with all component types
 */
export const getExportData = (canvas: fabric.Canvas): any => {
    return {
        modules: getModulesData(canvas),
        openings: getOpeningsData(canvas),
        balconies: getBalconiesData(canvas),
        bathroomPods: getBathroomPodsData(canvas),
        corridors: getCorridorsData(canvas),
    };
};
