import type { Metadata } from 'next';
import { Archivo_Black, Noto_Sans } from 'next/font/google';
import './globals.css';
import { Nav } from '@/components/Nav';

const heading = Archivo_Black({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-heading'
});

const bodyFont = Noto_Sans({
  subsets: ['latin'],
  variable: '--font-body'
});

export const metadata: Metadata = {
  title: 'Penca Salados 2026',
  description: 'Penca del Mundial 2026 para Escuela de Música Salados',
  applicationName: 'Penca Salados 2026'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={`${heading.variable} ${bodyFont.variable}`}>
        <Nav />
        <main className="page-shell">{children}</main>
      </body>
    </html>
  );
}
