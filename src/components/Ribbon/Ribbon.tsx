"use client";

import React from 'react';
import styled from '@emotion/styled';
import FileButtons from '../FileButtons';

// Styled components
const RibbonContainer = styled.div`
    display: flex;
    gap: 24px;
    padding: 8px 16px;
    background: #fafafa;
    border-bottom: 1px solid #ddd;
    align-items: center;
`;

const Ribbon: React.FC = () => {
    return (
        <RibbonContainer>
            <FileButtons />
            {/* Additional tool groups will be added here in future prompts */}
        </RibbonContainer>
    );
};

export default Ribbon;
