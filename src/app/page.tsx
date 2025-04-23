import React from 'react';
import Ribbon from '@/components/Ribbon/Ribbon';
import ClientCanvas from '@/components/ClientCanvas';

export default function Home() {
  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Ribbon />
      <main style={{ overflow: 'hidden', flex: 1 }}>
        <ClientCanvas />
      </main>
    </div>
  );
}
