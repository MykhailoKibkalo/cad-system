'use client';

import { useEffect, useState } from 'react';
import styled from '@emotion/styled';
import FabricCanvas from '@/components/canvas/FabricCanvas';
import useCadStore from '@/store/cadStore';

const CanvasContainer = styled.div`
  width: 100%;
  height: 100%;
  overflow: hidden;
  background-color: #ffffff;
`;

const CanvasWrapper = () => {
    const { floors, activeFloorIndex, pixelsPerMm } = useCadStore();
    const activeFloor = floors[activeFloorIndex];

    const [dimensions, setDimensions] = useState({
        width: 0,
        height: 0,
    });

    useEffect(() => {
        const updateDimensions = () => {
            setDimensions({
                width: window.innerWidth,
                height: window.innerHeight - 60, // Subtract Ribbon height
            });
        };

        // Set initial dimensions
        updateDimensions();

        // Update dimensions on resize
        window.addEventListener('resize', updateDimensions);
        return () => {
            window.removeEventListener('resize', updateDimensions);
        };
    }, []);

    return (
        <CanvasContainer>
            {dimensions.width > 0 && dimensions.height > 0 && (
                <FabricCanvas
                    width={dimensions.width}
                    height={dimensions.height}
                    gridResolution={activeFloor.gridResolution}
                    pixelsPerMm={pixelsPerMm}
                    showLowerFloor={activeFloor.showLowerFloor}
                    floorIndex={activeFloorIndex}
                />
            )}
        </CanvasContainer>
    );
};

export default CanvasWrapper;
