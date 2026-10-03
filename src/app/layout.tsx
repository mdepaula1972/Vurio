import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Vurio | Detecta Divergências e Incoerências em Atestados Médicos',
  description: 'Auditoria forense e triagem pericial de atestados médicos com inteligência artificial, validação ICP-Brasil e detecção de inconsistências.',
  icons: {
    icon: '/favicon.png',
    apple: '/icon-192.png',
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="scroll-smooth">
      <head>
        <link rel="icon" href="/favicon.png" type="image/png" />
      </head>
      <body className="min-h-screen bg-[#040c18] text-slate-100 antialiased selection:bg-[#02c1db] selection:text-[#001c4e]">
        {children}
      </body>
    </html>
  );
}
