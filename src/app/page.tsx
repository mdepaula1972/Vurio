'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ShieldCheck, 
  CheckCircle2, 
  XCircle,
  MessageSquare, 
  Activity, 
  Check, 
  HelpCircle,
  Stethoscope,
  MapPin,
  FileText,
  Lock,
  AlertTriangle,
  AlertCircle
} from 'lucide-react';

// ==========================================
// FLAGS DE CONTROLE DE EXIBIÇÃO EM PRODUÇÃO
// ==========================================
// 1. Prova social permanece oculta até aprovação de clientes reais
const SHOW_PROVA_SOCIAL = false;
// 2. Seção de planos oculta por padrão
const SHOW_PLANOS = false;
// 4. FLAG DO TRIAL (Padrão: false). Quando false, o formulário não é renderizado
// e todas as CTAs direcionam para conversa no WhatsApp corporativo
const TRIAL_ENABLED = process.env.NEXT_PUBLIC_TRIAL_ENABLED === 'true';

// Número corporativo oficial de atendimento do Vurio
const WHATSAPP_NUMBER = '551331500987';

export default function LandingHomePage() {
  // Estado do formulário (utilizado somente se TRIAL_ENABLED === true)
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formCompany, setFormCompany] = useState('');
  const [formCnpj, setFormCnpj] = useState('');
  const [formRange, setFormRange] = useState('100 a 500');

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [trialData, setTrialData] = useState<{ whatsappUrl?: string; dashboardUrl?: string } | null>(null);

  // Modal de Simulação Interativa de Relatório
  const [demoModalOpen, setDemoModalOpen] = useState(false);

  // Link de WhatsApp dinâmico com suporte ao código [ref:<utm_campaign>]
  const [waLink, setWaLink] = useState(
    `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Quero saber mais sobre o Vurio')}`
  );

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const params = new URLSearchParams(window.location.search);
        const utmCampaign = params.get('utm_campaign');
        
        let refSuffix = '';
        if (utmCampaign) {
          // Sanitização: minúsculas, apenas a-z, 0-9, hífen e sublinhado; máx 50 chars
          const cleanRef = utmCampaign
            .toLowerCase()
            .replace(/[^a-z0-9_-]/g, '')
            .slice(0, 50);

          if (cleanRef) {
            refSuffix = ` [ref:${cleanRef}]`;
          }
        }

        const baseMsg = 'Quero saber mais sobre o Vurio';
        const finalMsg = `${baseMsg}${refSuffix}`;

        setWaLink(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(finalMsg)}`);
      } catch {
        // Mantém o link padrão
      }
    }
  }, []);

  // Submissão do formulário (apenas se TRIAL_ENABLED === true)
  const handleSubmitTrial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!TRIAL_ENABLED) return;

    setFormError(null);
    if (!formEmail || !formCompany || !formPhone) {
      setFormError('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch('/api/trial/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: formName,
          email: formEmail,
          phone: formPhone,
          companyName: formCompany,
          cnpj: formCnpj,
          employeeRange: formRange
        })
      });

      const data = await res.json();
      if (data.success) {
        setSubmitted(true);
        setTrialData({
          whatsappUrl: data.whatsappUrl,
          dashboardUrl: data.dashboardUrl || '/dashboard'
        });

        if (data.whatsappUrl) {
          window.open(data.whatsappUrl, '_blank');
        }
      } else {
        setFormError(data.error || data.message || 'Não foi possível concluir o registro.');
      }
    } catch {
      setFormError('Erro de conexão ao ativar o teste. Tente novamente em alguns instantes.');
    } finally {
      setSubmitting(false);
    }
  };

  // Dados Estruturados JSON-LD (SEO Seguro)
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Vurio',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web, WhatsApp',
    description: 'Triagem automatizada de atestados médicos pelo WhatsApp corporativo para apoiar a análise do RH e Departamento Pessoal.',
    publisher: {
      '@type': 'Organization',
      name: 'Vurio Tecnologia & Triagem Digital',
      url: 'https://www.vurio.com.br'
    }
  };

  return (
    <div className="min-h-screen text-slate-100 flex flex-col font-sans selection:bg-[#02c1db]/30 selection:text-[#02c1db] bg-[#040c18]">
      
      {/* Script JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      {/* 1. TOP NAVBAR COMERCIAL */}
      <header className="border-b border-slate-800/60 bg-[#040c18]/90 backdrop-blur-xl sticky top-0 z-50 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Logo Circular Oficial Vurio */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-full p-0.5 bg-gradient-to-tr from-[#0077d1] via-[#02c1db] to-[#01cf9e] shadow-lg shadow-[#0077d1]/20 group-hover:scale-105 transition-transform flex items-center justify-center flex-shrink-0">
              <img 
                src="/logo.png" 
                alt="Vurio - Triagem de Atestados" 
                className="w-full h-full object-contain rounded-full bg-white" 
              />
            </div>
            <div>
              <span className="font-black text-xl tracking-tight text-white block leading-none">
                Vurio
              </span>
              <span className="text-[10px] text-[#02c1db] tracking-wider uppercase font-semibold block mt-0.5">
                Triagem de Atestados
              </span>
            </div>
          </Link>

          {/* Links de Navegação */}
          <nav className="hidden lg:flex items-center space-x-8 text-xs font-semibold text-slate-300">
            <a href="#o-abismo" className="hover:text-white transition-colors">
              Por que validar o CRM não basta
            </a>
            <a href="#pilares-defesa" className="hover:text-white transition-colors">
              O que o Vurio verifica
            </a>
            <a href="#compliance-lgpd" className="hover:text-white transition-colors">
              Segurança e LGPD
            </a>
            {SHOW_PLANOS && (
              <a href="#planos" className="hover:text-white transition-colors">
                Planos
              </a>
            )}
          </nav>

          {/* CTAs do Topo */}
          <div className="flex items-center space-x-3">
            <Link
              href="/dashboard"
              className="text-xs text-slate-300 hover:text-white px-3 py-2 rounded-xl hover:bg-slate-800/60 font-medium transition-all hidden sm:inline-flex items-center gap-1.5"
            >
              <span>Painel do DP</span>
            </Link>

            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#0077d1] via-[#02c1db] to-[#01cf9e] text-white text-xs font-bold shadow-lg shadow-[#0077d1]/25 hover:opacity-95 transition-all flex items-center space-x-2 transform hover:-translate-y-0.5"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Falar com o Vurio</span>
            </a>
          </div>

        </div>
      </header>

      {/* 2. HERO SECTION */}
      <section className="relative pt-14 pb-20 px-4 sm:px-6 lg:px-8 border-b border-slate-800/60 overflow-hidden">
        {/* Glows de Fundo */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-[#0077d1]/10 rounded-full blur-[130px] pointer-events-none"></div>
        <div className="absolute top-1/3 right-10 w-[400px] h-[300px] bg-[#02c1db]/10 rounded-full blur-[110px] pointer-events-none"></div>

        <div className="max-w-6xl mx-auto space-y-10 relative">
          
          {/* Tag de Categorização Técnica */}
          <div className="flex flex-col items-center justify-center text-center space-y-4">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-slate-700/60 text-[#02c1db] text-[11px] font-semibold tracking-wide shadow-inner">
              <span className="w-2 h-2 rounded-full bg-[#01cf9e] animate-pulse"></span>
              <span>TRIAGEM AUTOMATIZADA DE ATESTADOS MÉDICOS VIA WHATSAPP B2B</span>
            </div>

            {/* Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.12] max-w-4xl">
              Receba e faça a <span className="bg-gradient-to-r from-[#0077d1] via-[#02c1db] to-[#01cf9e] bg-clip-text text-transparent">triagem automatizada</span> de atestados médicos pelo WhatsApp da sua empresa
            </h1>

            {/* Subheadline Precisa em 2 Frases */}
            <p className="text-sm sm:text-base text-slate-300 max-w-3xl leading-relaxed pt-2">
              O Vurio analisa metadados de PDFs e fotos de atestados em segundos, checa assinaturas ICP-Brasil e registros do conselho profissional, e sinaliza indícios de divergência para que seu RH decida com segurança.
            </p>

            {/* Disclaimer Legal Obrigatório Perto do Hero */}
            <div className="pt-1 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] sm:text-xs text-slate-300 shadow-sm">
                <AlertCircle className="w-4 h-4 text-[#02c1db] flex-shrink-0" />
                <span>
                  O Vurio sinaliza indícios para apoiar a análise do RH. A decisão final é sempre humana e não substitui parecer médico ou jurídico.
                </span>
              </div>
            </div>

            {/* CTAs Principais */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-[#0077d1] via-[#02c1db] to-[#01cf9e] hover:opacity-95 text-white font-bold text-sm shadow-xl shadow-[#0077d1]/25 transition-all flex items-center justify-center space-x-2.5 transform hover:-translate-y-0.5 cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Falar com o Vurio</span>
              </a>

              <button
                onClick={() => setDemoModalOpen(true)}
                className="w-full sm:w-auto px-7 py-4 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700/80 font-bold text-sm shadow-lg transition-all flex items-center justify-center space-x-2.5 group"
              >
                <Activity className="w-4 h-4 text-[#02c1db] group-hover:scale-110 transition-transform" />
                <span>Ver exemplo de relatório</span>
              </button>
            </div>

            {/* Benefícios Rápidos */}
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-slate-400 pt-2 font-medium">
              <span className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-[#01cf9e]" /> Atendimento direto no WhatsApp
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-[#01cf9e]" /> Triagem técnica em segundos
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-[#01cf9e]" /> Princípios de Privacidade da LGPD
              </span>
            </div>
          </div>

          {/* SIMULAÇÃO VISUAL: WHATSAPP DO COLABORADOR + RELATÓRIO DO DP */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center max-w-6xl mx-auto pt-4">
            
            {/* Lado Esquerdo: Mensagem chegando no WhatsApp */}
            <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-2xl relative">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-full p-0.5 bg-gradient-to-tr from-[#0077d1] via-[#02c1db] to-[#01cf9e] flex items-center justify-center flex-shrink-0">
                    <img src="/logo.png" alt="Vurio" className="w-full h-full object-contain rounded-full bg-white" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Vurio - WhatsApp RH</h4>
                    <p className="text-[10px] text-[#02c1db] font-medium">Triagem Automatizada Ativa</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-slate-500">14:22</span>
              </div>

              {/* Mensagem enviada pelo funcionário */}
              <div className="space-y-3 text-xs">
                <div className="bg-slate-800/80 p-3 rounded-2xl rounded-tr-none text-slate-200 ml-6 space-y-1.5 border border-slate-700/50">
                  <p className="text-[11px] text-slate-400">Colaborador João Silva:</p>
                  <div className="flex items-center gap-2 bg-slate-900 p-2 rounded-xl border border-slate-800">
                    <FileText className="w-6 h-6 text-rose-400 flex-shrink-0" />
                    <div className="truncate">
                      <p className="font-bold text-white truncate text-[11px]">Atestado_Medico_SP.pdf</p>
                      <p className="text-[10px] text-slate-400">248 KB • Assinatura Gov.br</p>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-300">"Segue meu atestado médico de 3 dias para justificar a ausência."</p>
                </div>

                {/* Resposta do Vurio em segundos */}
                <div className="bg-emerald-950/40 border border-emerald-500/30 p-3 rounded-2xl rounded-tl-none text-slate-200 mr-6 space-y-1">
                  <p className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> Vurio Triagem Bot:
                  </p>
                  <p className="text-[11px] text-slate-300">
                    Documento recebido e triado com sucesso. Protocolo: <span className="font-mono text-emerald-300 font-bold">#VUR-8942</span> gerado e registrado para o DP.
                  </p>
                </div>
              </div>
            </div>

            {/* Lado Direito: Relatório Gerado no Painel do DP */}
            <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-sky-500/20 text-[#02c1db]">
                    <Activity className="w-4 h-4" />
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">Relatório de Alertas de Triagem</h4>
                    <p className="text-[10px] text-slate-400">Processado em tempo real em 0.18s</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  AVERIGUAÇÃO RECOMENDADA
                </span>
              </div>

              {/* Grid de Metadados Técnicos */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 text-[10px] block">MÉDICO EMISSOR</span>
                  <span className="font-bold text-white truncate block">Dr. Roberto Santos</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 text-[10px] block">CRM / ESTADO</span>
                  <span className="font-bold text-white">123456 / SP</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 text-[10px] block">CERTIFICAÇÃO</span>
                  <span className="font-bold text-emerald-400 flex items-center gap-1">
                    <Check className="w-3 h-3" /> ICP-Brasil
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 text-[10px] block">PRAZO CCT</span>
                  <span className="font-bold text-sky-400">No Prazo (24h)</span>
                </div>
              </div>

              {/* Alerta de Incompatibilidade Geográfica */}
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-amber-400">
                  <MapPin className="w-4 h-4 text-amber-400" />
                  Alerta Geo-Shield: Incompatibilidade Geográfica de 412 km
                </div>
                <p className="text-[11px] text-slate-300">
                  O colaborador atua presencialmente na unidade de <strong>Santos/SP</strong>, mas o atendimento presencial informado ocorreu às 14:15 em <strong>Ribeirão Preto/SP</strong> durante sua jornada.
                </p>
              </div>

              <div className="flex items-center justify-between pt-1 text-xs">
                <span className="font-mono text-slate-500 text-[10px]">Hash SHA-256: 7f8a9b2c... (Trava de duplicidade)</span>
                <span 
                  className="text-[#02c1db] font-bold text-[11px] hover:underline cursor-pointer" 
                  onClick={() => setDemoModalOpen(true)}
                >
                  Ver Exemplo de Relatório em PDF →
                </span>
              </div>
            </div>

          </div>

          {/* Faixa de Indicadores de Impacto */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto pt-6 border-t border-slate-800/60 text-center">
            <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/60 flex flex-col justify-center">
              <span className="text-2xl lg:text-3xl font-black text-white block">48 Milhões+</span>
              <span className="text-xs text-slate-400 block">Vínculos formais de emprego no Brasil</span>
              <a
                href="https://www.gov.br/trabalho-e-emprego/pt-br/noticias-e-conteudo/2026/setembro/novo-caged-emprego-formal-gera-165-8-mil-vagas-em-agosto-e-acumula-1-13-milhao-de-postos-no-ano"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-slate-500 hover:text-[#02c1db] underline transition-colors block mt-1"
              >
                Fonte: Novo Caged/MTE, agosto de 2026
              </a>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/60 flex flex-col justify-center">
              <span className="text-2xl lg:text-3xl font-black text-[#01cf9e] block">Em segundos</span>
              <span className="text-xs text-slate-400 block">Tempo Médio de Resposta da Triagem</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/60 flex flex-col justify-center">
              <span className="text-xl lg:text-2xl font-black text-[#02c1db] block">Assinatura ICP-Brasil</span>
              <span className="text-xs text-slate-400 block">Verificação da assinatura digital do atestado</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/60 flex flex-col justify-center">
              <span className="text-2xl lg:text-3xl font-black text-indigo-300 block">Zero CID</span>
              <span className="text-xs text-slate-400 block">Sigilo Médico Resguardado</span>
            </div>
          </div>

        </div>
      </section>

      {/* 3. SEÇÃO 2: O ABISMO DO MERCADO (POR QUE VALIDAR O CRM NÃO BASTA) */}
      <section id="o-abismo" className="py-20 px-4 sm:px-6 lg:px-8 border-b border-slate-800/60 bg-slate-950/40">
        <div className="max-w-6xl mx-auto space-y-12">
          
          <div className="text-center space-y-3 max-w-3xl mx-auto">
            <span className="text-[11px] font-bold text-rose-400 uppercase tracking-widest bg-rose-500/10 px-3 py-1 rounded-full border border-rose-500/20">
              O PONTO CEGO DA VALIDAÇÃO MANUAL
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Por que validar o CRM não basta: a diferença entre checar o cadastro e validar o documento
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Consultar apenas o CRM confirma que o médico existe e está ativo no conselho. Mas não verifica se o documento foi alterado após a assinatura, se a assinatura digital ICP-Brasil é autêntica ou se há divergência com a localidade do colaborador. Na rotina real do DP, inconsistências que afetam o caixa decorrem de divergências que passam despercebidas na simples checagem de cadastro.
            </p>
          </div>

          {/* Tabela Comparativa de Cenários */}
          <div className="border border-slate-800 rounded-3xl overflow-hidden bg-slate-900/70 shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950">
                    <th className="p-4 sm:p-5 font-bold text-slate-300 w-2/5">Cenário de Inconsistência no seu DP</th>
                    <th className="p-4 sm:p-5 font-bold text-slate-400 w-1/4">Checagem Apenas de CRM</th>
                    <th className="p-4 sm:p-5 font-bold text-[#02c1db] w-1/3 bg-[#0077d1]/10">Triagem Automatizada Vurio</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300 text-xs">
                  
                  <tr className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-4 sm:p-5">
                      <div className="font-bold text-white mb-0.5">PDF alterado após a assinatura digital do médico</div>
                      <p className="text-slate-400 text-[11px]">Número de dias de repouso alterado de "1" para "4" via editor gráfico.</p>
                    </td>
                    <td className="p-4 sm:p-5">
                      <span className="inline-flex items-center gap-1.5 text-rose-400 font-semibold bg-rose-500/10 px-2.5 py-1 rounded-md border border-rose-500/20 text-[11px]">
                        <XCircle className="w-3.5 h-3.5" /> Não detecta (CRM ativo)
                      </span>
                    </td>
                    <td className="p-4 sm:p-5 bg-[#0077d1]/5">
                      <span className="inline-flex items-center gap-1.5 text-emerald-400 font-semibold bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20 text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Alerta de Digest PAdES violado
                      </span>
                      <p className="text-[10px] text-slate-400 mt-1">Sinaliza quebra de integridade matemática do documento.</p>
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-4 sm:p-5">
                      <div className="font-bold text-white mb-0.5">Reenvio do mesmo atestado em períodos diferentes</div>
                      <p className="text-slate-400 text-[11px]">O mesmo documento reutilizado com data reaproveitada.</p>
                    </td>
                    <td className="p-4 sm:p-5">
                      <span className="inline-flex items-center gap-1.5 text-rose-400 font-semibold bg-rose-500/10 px-2.5 py-1 rounded-md border border-rose-500/20 text-[11px]">
                        <XCircle className="w-3.5 h-3.5" /> Não detecta
                      </span>
                    </td>
                    <td className="p-4 sm:p-5 bg-[#0077d1]/5">
                      <span className="inline-flex items-center gap-1.5 text-emerald-400 font-semibold bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20 text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Trava por Hash SHA-256
                      </span>
                      <p className="text-[10px] text-slate-400 mt-1">Identifica duplicidade imediata do arquivo digital.</p>
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-4 sm:p-5">
                      <div className="font-bold text-white mb-0.5">Distância geográfica incompatível com o turno</div>
                      <p className="text-slate-400 text-[11px]">Colaborador cumpriu jornada em Santos/SP e atestado presencial emitido em Ribeirão Preto/SP no mesmo turno.</p>
                    </td>
                    <td className="p-4 sm:p-5">
                      <span className="inline-flex items-center gap-1.5 text-rose-400 font-semibold bg-rose-500/10 px-2.5 py-1 rounded-md border border-rose-500/20 text-[11px]">
                        <XCircle className="w-3.5 h-3.5" /> Não detecta
                      </span>
                    </td>
                    <td className="p-4 sm:p-5 bg-[#0077d1]/5">
                      <span className="inline-flex items-center gap-1.5 text-emerald-400 font-semibold bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20 text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Alerta Geo-Shield em segundos
                      </span>
                      <p className="text-[10px] text-slate-400 mt-1">Calcula raio e sinaliza inconsistência para revisão do DP.</p>
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-4 sm:p-5">
                      <div className="font-bold text-white mb-0.5">CRM em estado diferente sem inscrição secundária</div>
                      <p className="text-slate-400 text-[11px]">Atendimento presencial em estado onde o médico não possui habilitação.</p>
                    </td>
                    <td className="p-4 sm:p-5">
                      <span className="inline-flex items-center gap-1.5 text-amber-400 font-semibold bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/20 text-[11px]">
                        ⚠️ Requer consulta manual demorada
                      </span>
                    </td>
                    <td className="p-4 sm:p-5 bg-[#0077d1]/5">
                      <span className="inline-flex items-center gap-1.5 text-emerald-400 font-semibold bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20 text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Alerta de divergência de UF
                      </span>
                      <p className="text-[10px] text-slate-400 mt-1">Checagem automatizada no cadastro de conselho profissional.</p>
                    </td>
                  </tr>

                </tbody>
              </table>
            </div>
          </div>

        </div>
      </section>

      {/* 4. SEÇÃO 3: O QUE O VURIO VERIFICA (OS 3 PILARES DE TRIAGEM) */}
      <section id="pilares-defesa" className="py-20 px-4 sm:px-6 lg:px-8 border-b border-slate-800/60 bg-slate-900/30">
        <div className="max-w-6xl mx-auto space-y-12">
          
          <div className="text-center space-y-3 max-w-3xl mx-auto">
            <span className="text-[11px] font-bold text-[#02c1db] uppercase tracking-widest bg-[#0077d1]/10 px-3 py-1 rounded-full border border-[#0077d1]/30">
              MOTOR DE ANÁLISE DE METADADOS
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              O que o Vurio verifica: os 3 pilares de triagem de atestados
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Uma esteira de análise em 3 camadas que processa documentos técnicos e fotos em segundos, sinalizando indícios para a decisão humana do RH.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="p-7 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4 hover:border-[#02c1db]/40 transition-all shadow-xl group">
              <div className="w-12 h-12 rounded-2xl bg-[#0077d1]/20 text-[#02c1db] flex items-center justify-center group-hover:scale-110 transition-transform">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">1. Criptografia & Assinatura Digital ICP-Brasil (PAdES)</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Verifica se o documento possui assinatura digital no padrão ICP-Brasil (Gov.br, ITI, Certisign, Soluti, etc.), valida o resumo criptográfico SHA-256 e detecta qualquer modificação realizada após a assinatura médica.
              </p>
              <div className="pt-2 border-t border-slate-800/80 flex items-center gap-2 text-[11px] text-slate-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span>Validação PAdES em tempo real</span>
              </div>
            </div>

            <div className="p-7 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4 hover:border-[#02c1db]/40 transition-all shadow-xl group">
              <div className="w-12 h-12 rounded-2xl bg-sky-500/20 text-sky-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Stethoscope className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">2. Regularidade Cadastral do Conselho Profissional</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Cruza automaticamente o nome do médico, número do CRM e UF emissora com os registros públicos oficiais, conferindo a situação cadastral ativa e se o profissional possui inscrição correspondente.
              </p>
              <div className="pt-2 border-t border-slate-800/80 flex items-center gap-2 text-[11px] text-slate-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span>Verificação cadastral e de UF</span>
              </div>
            </div>

            <div className="p-7 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4 hover:border-[#02c1db]/40 transition-all shadow-xl group">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <MapPin className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">3. Consistência Geo-Temporal & Regras de Negócio</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Calcula o deslocamento geográfico entre o estabelecimento médico emissor e o local da unidade de trabalho do empregado, afere o prazo regulamentar da Convenção Coletiva (CCT) e aplica trava de duplicidade.
              </p>
              <div className="pt-2 border-t border-slate-800/80 flex items-center gap-2 text-[11px] text-slate-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span>Trava por Hash SHA-256 único</span>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 5. BLOCO DE PROVA SOCIAL (OCULTO EM PRODUÇÃO ATÉ AUTORIZAÇÃO) */}
      <section 
        id="prova-social" 
        style={{ display: SHOW_PROVA_SOCIAL ? 'block' : 'none' }}
        className="py-16 px-4 sm:px-6 lg:px-8 border-b border-slate-800/60 bg-slate-950/80"
      >
        <div className="max-w-6xl mx-auto space-y-8 text-center">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest bg-slate-800/60 px-3 py-1 rounded-full border border-slate-700/60">
            EMPRESAS QUE CONFIAM NO VURIO
          </span>
          <h2 className="text-xl sm:text-3xl font-extrabold text-white">
            Resultados comprovados na rotina de RHs e Departamentos Pessoais
          </h2>
        </div>
      </section>

      {/* 6. SEÇÃO 5: SEGURANÇA E LGPD */}
      <section id="compliance-lgpd" className="py-20 px-4 sm:px-6 lg:px-8 border-b border-slate-800/60 bg-slate-950/60">
        <div className="max-w-6xl mx-auto space-y-12">
          
          <div className="text-center space-y-3 max-w-3xl mx-auto">
            <span className="text-[11px] font-bold text-[#01cf9e] uppercase tracking-widest bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
              SEGURANÇA JURÍDICA E DE DADOS
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Segurança e LGPD: Desenvolvido para atender às exigências do seu DPO e Jurídico
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              O Vurio opera sob princípios de <em>Privacy by Design</em>, minimização de dados e processamento em memória volátil, orientado pelas diretrizes da Lei 13.709/2018.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-white">1. Base Legal na LGPD</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  O tratamento de atestados médicos é legalizado sob os <strong>Artigos 7º, II e 11, II, "a" da Lei 13.709/2018</strong>, para cumprimento de obrigação legal ou regulatória da empresa empregadora (CLT e Lei 8.213/91).
                </p>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">Art. 7º e 11 LGPD</span>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-[#02c1db] flex items-center justify-center">
                  <Lock className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-white">2. Papel: Operador de Dados</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Sua empresa figura como única <strong>Controladora</strong> dos dados. O Vurio atua unicamente como <strong>Operador técnico</strong> sob mandato, sem comercialização, compartilhamento ou monetização de metadados.
                </p>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">Controlador x Operador</span>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-white">3. Sem Exigência ou Guarda de CID</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Em harmonia com a <strong>Resolução CFM nº 1.658/2002</strong> e Súmula do TST, o Vurio não exige o diagnóstico clínico (CID). A triagem analisa unicamente a autenticidade técnica da assinatura médica e o prazo de repouso.
                </p>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">Resolução CFM 1.658/02</span>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-white">4. Processamento em Memória</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  O arquivo original é processado temporariamente em memória volátil durante a análise e <strong>não é gravado em disco ou armazenamento persistente</strong>. A guarda documental legal compete exclusivamente à empresa contratante.
                </p>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">Não Armazenamento de Arquivos</span>
            </div>

          </div>



        </div>
      </section>

      {/* 7. SEÇÃO 6: CONTATO E CONVERSAÇÃO (SEM TRIAL ATIVO / COM FLAG DE RENDERIZAÇÃO) */}
      <section id="contato" className="py-20 px-4 sm:px-6 lg:px-8 border-b border-slate-800/60 bg-gradient-to-b from-slate-950 to-slate-900">
        <div className="max-w-4xl mx-auto space-y-8">
          
          <div className="text-center space-y-3">
            <span className="text-[11px] font-bold text-[#01cf9e] uppercase tracking-widest bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/30">
              ATENDIMENTO CORPORATIVO B2B
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Converse com a equipe do Vurio
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Tire dúvidas sobre a triagem automatizada de metadados, privacidade de dados e como integrar o canal de WhatsApp oficial à rotina do seu Departamento Pessoal.
            </p>
          </div>

          {/* Card Principal: Se TRIAL_ENABLED for false, o formulário NÃO é renderizado */}
          {!TRIAL_ENABLED ? (
            <div className="p-8 sm:p-10 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl relative overflow-hidden text-center space-y-6">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#0077d1]/10 rounded-full blur-2xl pointer-events-none"></div>

              <div className="w-16 h-16 rounded-full bg-[#0077d1]/20 text-[#02c1db] mx-auto flex items-center justify-center">
                <MessageSquare className="w-8 h-8" />
              </div>

              <div className="space-y-2 max-w-lg mx-auto">
                <h3 className="text-xl font-bold text-white">
                  Fale diretamente pelo WhatsApp
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Nosso canal oficial está disponível para entender o volume de atestados da sua empresa e apresentar como a triagem de metadados apoia as decisões do seu RH.
                </p>
              </div>

              <div className="flex justify-center pt-2">
                <a
                  href={waLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-8 py-4 rounded-2xl bg-gradient-to-r from-[#0077d1] via-[#02c1db] to-[#01cf9e] hover:opacity-95 text-white text-sm font-bold shadow-xl shadow-[#0077d1]/25 transition-all flex items-center gap-2.5 transform hover:-translate-y-0.5 cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Falar com o Vurio via WhatsApp</span>
                </a>
              </div>

              <p className="text-[11px] text-slate-500 pt-2">
                🔒 Atendimento exclusivo para empresas e profissionais de RH/DP.
              </p>
            </div>
          ) : (
            /* RENDERIZADO SOMENTE QUANDO TRIAL_ENABLED === TRUE */
            <div className="p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl relative overflow-hidden space-y-8">
              <form onSubmit={handleSubmitTrial} className="space-y-4 text-xs">
                {formError && (
                  <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 flex-shrink-0 text-rose-400 mt-0.5" />
                    <div>
                      <p className="font-bold text-xs">Atenção:</p>
                      <p className="text-[11px] text-rose-200/90 mt-0.5 leading-relaxed">{formError}</p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1.5">Seu Nome Completo:</label>
                    <input
                      type="text"
                      required
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="Ex: Carlos Mendes"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-[#02c1db] text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1.5">
                      E-mail Corporativo Institucional:
                    </label>
                    <input
                      type="email"
                      required
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      placeholder="carlos@suaempresa.com.br"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-[#02c1db] text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1.5">WhatsApp Corporativo:</label>
                    <input
                      type="tel"
                      required
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value)}
                      placeholder="(11) 98765-4321"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-[#02c1db] text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1.5">CNPJ da Empresa:</label>
                    <input
                      type="text"
                      required
                      value={formCnpj}
                      onChange={(e) => setFormCnpj(e.target.value)}
                      placeholder="00.000.000/0001-00"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-[#02c1db] text-xs"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs shadow-lg transition-all"
                >
                  {submitting ? 'Processando...' : 'Cadastrar Empresa'}
                </button>
              </form>
            </div>
          )}

        </div>
      </section>

      {/* 8. FAQ */}
      <section id="perguntas-frequentes" className="py-16 px-4 sm:px-6 lg:px-8 border-b border-slate-800/60 bg-slate-950/40">
        <div className="max-w-4xl mx-auto space-y-8">
          
          <div className="text-center space-y-2">
            <h2 className="text-xl sm:text-3xl font-extrabold text-white">Perguntas Frequentes do RH e DP</h2>
            <p className="text-xs text-slate-400">Respostas diretas sobre a operação, segurança e rotina do Vurio.</p>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
              <h4 className="font-bold text-white flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-[#02c1db]" />
                Como o funcionário envia o atestado sem criar constrangimentos?
              </h4>
              <p className="text-slate-300 leading-relaxed pl-6">
                O colaborador simplesmente anexa o PDF ou a foto legível no canal de WhatsApp oficial da sua empresa. O robô emite uma mensagem neutra e protocolada confirmando a recepção formal. O analista de DP não precisa fazer perguntas constrangedoras.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
              <h4 className="font-bold text-white flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-[#02c1db]" />
                O que o Vurio faz quando sinaliza divergências em um atestado?
              </h4>
              <p className="text-slate-300 leading-relaxed pl-6">
                O Vurio não formula juízos morais nem acusa ninguém. O sistema emite um relatório técnico apontando objetivamente indícios de divergência criptográfica (como assinatura digital rompida ou ausência de cadeia ICP-Brasil), fornecendo respaldo documental para a análise e decisão humana do seu Departamento Pessoal e Jurídico.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
              <h4 className="font-bold text-white flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-[#02c1db]" />
                O Vurio substitui a decisão do médico do trabalho ou do RH?
              </h4>
              <p className="text-slate-300 leading-relaxed pl-6">
                Não. O Vurio é uma ferramenta de triagem técnica automatizada que apoia os profissionais de RH e Medicina do Trabalho com informações de metadados e cadastros públicos. A deliberação final é sempre humana.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
              <h4 className="font-bold text-white flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-[#02c1db]" />
                Preciso integrar ao meu software de folha ou ERP?
              </h4>
              <p className="text-slate-300 leading-relaxed pl-6">
                Não é obrigatório! O Vurio funciona de forma autônoma desde o primeiro minuto via WhatsApp e Painel Web. Caso sua equipe de TI deseje, fornecemos webhooks para sincronização de dados.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* 9. FOOTER CORPORATIVO */}
      <footer className="bg-slate-950 py-12 px-4 sm:px-6 lg:px-8 border-t border-slate-900 text-center text-xs text-slate-500 space-y-4">
        
        <div className="max-w-3xl mx-auto p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300 text-[11px] leading-relaxed">
          <strong className="text-white">Aviso Legal: </strong>
          O Vurio sinaliza indícios para apoiar a análise do RH. A decisão final é sempre humana e não substitui parecer médico ou jurídico.
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 text-slate-200 font-semibold pt-2">
          <div className="w-8 h-8 rounded-full p-0.5 bg-gradient-to-tr from-[#0077d1] via-[#02c1db] to-[#01cf9e]">
            <img src="/logo.png" alt="Vurio" className="w-full h-full object-contain rounded-full bg-white" />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
            <span className="text-sm font-bold text-white">Vurio Tecnologia & Triagem Digital</span>
            <span className="hidden sm:inline text-slate-600">•</span>
            <span className="text-xs text-[#02c1db] font-medium">Triagem automatizada de atestados médicos pelo WhatsApp</span>
          </div>
        </div>

        <p className="max-w-2xl mx-auto text-[11px] leading-relaxed text-slate-500">
          Referências legais: MP nº 2.200-2/2001 (ICP-Brasil), Resolução CFM 1.658/2002, Art. 482 da CLT, Lei 14.510/2023 (Telemedicina) e LGPD (Lei 13.709/2018).
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-400 pt-1">
          <Link href="/termos" className="hover:text-[#02c1db] underline transition-colors">
            Termos de Uso e Política de Privacidade (LGPD)
          </Link>
          <span>•</span>
          <Link href="/dashboard" className="hover:text-[#02c1db] transition-colors">
            Painel DP do Cliente
          </Link>
        </div>

        <p className="text-[10px] text-slate-600 pt-2">
          © 2026 Vurio Tecnologia & Triagem Digital LTDA. Todos os direitos reservados. CNPJ: 42.189.542/0001-90.
        </p>
      </footer>

      {/* 10. MODAL: SIMULAÇÃO LIVE DE RELATÓRIO DE ALERTAS */}
      {demoModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#02c1db]" />
                Simulação Interativa de Relatório de Alertas de Triagem
              </h3>
              <button 
                onClick={() => setDemoModalOpen(false)} 
                className="text-slate-400 hover:text-white"
                aria-label="Fechar simulação"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">Documento em Triagem:</span>
                <span className="font-mono text-white text-[11px]">Atestado_Exemplo_Divergencia_PAdES.pdf</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 text-[10px] block">MÉDICO DO CARIMBO</span>
                  <span className="font-bold text-white">Dr. Marcos Silva (CRM 12345/SP)</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 text-[10px] block">STATUS NO CFM</span>
                  <span className="font-bold text-emerald-400">REGULAR / ATIVO</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 space-y-1">
                <p className="font-bold flex items-center gap-1.5 text-rose-400">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  Alerta Criptográfico: Assinatura Digital ICP-Brasil Rompida
                </p>
                <p className="text-[11px] text-slate-300">
                  O arquivo PDF sofreu edição gráfica após a assinatura digital do médico. O hash original (Digest) não corresponde aos bytes atuais do arquivo, indicando alteração posterior no conteúdo.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 space-y-1">
                <p className="font-bold flex items-center gap-1.5 text-amber-400">
                  <MapPin className="w-4 h-4 text-amber-400" />
                  Alerta Geo-Shield: Distância Incompatível
                </p>
                <p className="text-[11px] text-slate-300">
                  Clínica emissora localizada a 380 km da unidade onde o colaborador cumpriu jornada no mesmo turno.
                </p>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row justify-end gap-2">
              <button
                onClick={() => setDemoModalOpen(false)}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs transition-all"
              >
                Fechar Simulação
              </button>
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setDemoModalOpen(false)}
                className="px-4 py-2.5 bg-gradient-to-r from-[#0077d1] via-[#02c1db] to-[#01cf9e] text-white rounded-xl font-bold text-xs transition-all shadow flex items-center justify-center gap-1.5"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Falar com o Vurio via WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
