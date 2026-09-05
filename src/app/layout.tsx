import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Vurio | Validação Criptográfica de Atestados Médicos (ICP-Brasil)',
  description: 'SaaS WhatsApp-First para triagem preventiva e validação de autenticidade de atestados médicos digitais para PMEs.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-[#070b14] text-slate-100 antialiased selection:bg-emerald-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
