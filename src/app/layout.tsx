// src/app/layout.tsx
import './globals.css';
import Script from 'next/script';

export const metadata = { title: '2D Web CAD | Verida' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <Script src="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.min.js" strategy="beforeInteractive" />
      </head>
      <body>{children}</body>
    </html>
  );
}
