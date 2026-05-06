import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Átomo Finance',
  description: 'Gestão financeira PJ com IA — Agência Átomo',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
