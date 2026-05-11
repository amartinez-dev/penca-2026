import type { Metadata } from 'next';
import './globals.css';
import { Nav } from '@/components/Nav';

export const metadata: Metadata = {
  title: 'Penca Salados 2026',
  description: 'Penca del Mundial 2026 para Escuela de Música Salados'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <Nav />
        <main className="page-shell">{children}</main>
      </body>
    </html>
  );
}
