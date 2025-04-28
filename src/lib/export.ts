import useCadStore from '@/store/cadStore';

/**
 * Exports the current CAD state to a JSON string
 */
export const exportCad = (): string => {
    const { floors, activeFloorIndex, snappingEnabled, pixelsPerMm } = useCadStore.getState();

    // Prepare floors data without circular references
    const floorsData = floors.map(floor => {
        // Convert backdrop to serializable format if it exists
        let backdropData = null;
        if (floor.backdrop) {
            backdropData = {
                // Save only essential properties
                left: floor.backdrop.left,
                top: floor.backdrop.top,
                width: floor.backdrop.width,
                height: floor.backdrop.height,
                scaleX: floor.backdrop.scaleX,
                scaleY: floor.backdrop.scaleY,
                angle: floor.backdrop.angle,
                // The actual image data would be stored separately or as a URL reference
                // For now, we'll just store a placeholder
                src: 'image_placeholder',
            };
        }

        return {
            id: floor.id,
            name: floor.name,
            backdropData,
            gridResolution: floor.gridResolution,
            showLowerFloor: floor.showLowerFloor,
        };
    });

    // Construct the export data
    const exportData = {
        version: '1.0.0', // Include a version for future compatibility
        activeFloorIndex,
        snappingEnabled,
        pixelsPerMm,
        floors: floorsData,
        // Additional metadata could be added here
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
