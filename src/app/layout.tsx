import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Vurio | Triagem Automatizada de Atestados Médicos pelo WhatsApp',
  description: 'Triagem automatizada de atestados médicos para RH e DP. Análise de metadados, validação de assinaturas ICP-Brasil e checagem no CFM para apoiar a revisão humana.',
  keywords: [
    'triagem de atestados',
    'atestados médicos whatsapp',
    'validação de atestado médico',
    'assinatura digital atestado',
    'gestão de absenteísmo rh',
    'compliance dp',
    'cfm 27 estados',
    'icp-brasil atestado'
  ],
  authors: [{ name: 'Vurio Tecnologia' }],
  openGraph: {
    title: 'Vurio | Triagem Automatizada de Atestados Médicos',
    description: 'Receba e faça a triagem automatizada de atestados médicos pelo WhatsApp corporativo em 3 segundos. Apoio técnico para o RH decidir com segurança.',
    url: 'https://www.vurio.com.br',
    siteName: 'Vurio',
    locale: 'pt_BR',
    type: 'website',
    images: [
      {
        url: 'https://www.vurio.com.br/logo.png',
        width: 512,
        height: 512,
        alt: 'Vurio - Triagem Automatizada de Atestados Médicos'
      }
    ]
  },
  twitter: {
    card: 'summary',
    title: 'Vurio | Triagem Automatizada de Atestados Médicos',
    description: 'Triagem de metadados e validação de atestados médicos via WhatsApp corporativo para apoiar a decisão do RH.',
    images: ['https://www.vurio.com.br/logo.png']
  },
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
