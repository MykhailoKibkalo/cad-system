import './globals.css';
import React from 'react';

export const metadata = {
  title: 'Web CAD Application',
  description: '2D web CAD application for building design',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
