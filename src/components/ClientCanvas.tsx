'use client';

import dynamic from 'next/dynamic';
import React from 'react';

// Import FabricCanvas with SSR disabled
const FabricCanvas = dynamic(() => import('@/components/Canvas/FabricCanvas'), { ssr: false });

const ClientCanvas: React.FC = () => {
  return <FabricCanvas />;
};

export default ClientCanvas;
