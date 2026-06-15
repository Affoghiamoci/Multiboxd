import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Multiboxd — Stremio Addon with Multilingual Metadata',
  description:
    'Configure your Stremio addon to get Italian (or any language) metadata from TMDB, with optional Letterboxd catalog integration.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
