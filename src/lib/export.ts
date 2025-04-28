import useCadStore from '@/store/cadStore';

/**
 * Exports the current CAD state to a JSON string
 */
export const exportCad = (): string => {
    const { floors, activeFloorIndex, snappingEnabled, pixelsPerMm, snapToElementGap } = useCadStore.getState();

    // Prepare floors data without circular references
    const floorsData = floors.map(floor => {
        // Convert backdrop to serializable format if it exists
        let backdropData = null;
        if (floor.backdrop) {
            backdropData = {
                left: floor.backdrop.left,
                top: floor.backdrop.top,
                width: floor.backdrop.width,
                height: floor.backdrop.height,
                scaleX: floor.backdrop.scaleX,
                scaleY: floor.backdrop.scaleY,
                angle: floor.backdrop.angle,
                src: 'image_placeholder',
            };
        }

        // Return serializable floor data
        return {
            id: floor.id,
            name: floor.name,
            backdropData,
            gridResolution: floor.gridResolution,
            showLowerFloor: floor.showLowerFloor,
            modules: floor.modules.map(module => ({
                id: module.id,
                name: module.name,
                width: module.width,
                length: module.length,
                height: module.height,
                x0: module.x0,
                y0: module.y0,
                rotation: module.rotation,
                floorBeamsDir: module.floorBeamsDir,
            })),
            moduleCounter: floor.moduleCounter,
        };
    });

    // Construct the export data
    const exportData = {
        version: '1.0.0',
        activeFloorIndex,
        snappingEnabled,
        snapToElementGap,
        pixelsPerMm,
        floors: floorsData,
        exportDate: new Date().toISOString(),
    };

    return JSON.stringify(exportData, null, 2);
};

/**
 * Imports CAD data from a JSON string (stub for now)
 */
export const importCad = (jsonData: string): void => {
    // TODO: Implement import functionality
    console.log('Import functionality will be implemented in a future iteration');
};
