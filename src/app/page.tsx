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
  Sparkles,
  TrendingDown,
  Building2,
  Stethoscope,
  Send,
  MapPin,
  Sliders,
  Zap,
  ArrowRight,
  Eye,
  Scale,
  UserCheck,
  Briefcase,
  Clock,
  ChevronDown,
  FileText,
  Lock,
  ExternalLink,
  AlertTriangle,
  Fingerprint,
  Smartphone,
  PhoneCall,
  AlertCircle
} from 'lucide-react';

// ==========================================
// FLAGS DE CONTROLE DE EXIBIÇÃO EM PRODUÇÃO
// ==========================================
// 1. Prova social permanece oculta até aprovação de clientes reais
const SHOW_PROVA_SOCIAL = false;
// 2. Seção de planos oculta por padrão para não expor marcadores [PREENCHER] em produção
const SHOW_PLANOS = false;
// 3. Tópicos complementares de LGPD com marcadores jurídicos [PREENCHER] (modo preview apenas)
const SHOW_LGPD_EXTENDED = false;

// Número corporativo de atendimento/robô do Vurio
const WHATSAPP_NUMBER = '551331500987';

export default function LandingHomePage() {
  // Estado do formulário de 15 consultas gratuitas (Seção de Teste Grátis)
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

  // Link de WhatsApp dinâmico com preservação de parâmetros UTM
  const [waLinkTrial, setWaLinkTrial] = useState(
    `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Quero testar o Vurio com 15 consultas grátis')}`
  );
  const [waLinkPlans, setWaLinkPlans] = useState(
    `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Quero entender os planos do Vurio')}`
  );

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const params = new URLSearchParams(window.location.search);
        const utmSource = params.get('utm_source');
        const utmCampaign = params.get('utm_campaign');
        const utmMedium = params.get('utm_medium');
        
        let extra = '';
        if (utmSource || utmCampaign) {
          const parts = [];
          if (utmSource) parts.push(`Origem: ${utmSource}`);
          if (utmCampaign) parts.push(`Campanha: ${utmCampaign}`);
          if (utmMedium) parts.push(`Mídia: ${utmMedium}`);
          extra = ` [${parts.join(' | ')}]`;
        }

        const msgTrial = `Quero testar o Vurio com 15 consultas grátis${extra}`;
        const msgPlans = `Quero entender os planos do Vurio${extra}`;

        setWaLinkTrial(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msgTrial)}`);
        setWaLinkPlans(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msgPlans)}`);
      } catch (e) {
        // Fallback para os links padrão já inicializados
      }
    }
  }, []);

  // Ação de Conversão Inteligente do Formulário
  const handleSubmitTrial = async (e: React.FormEvent) => {
    e.preventDefault();
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

        // Abre o WhatsApp com a mensagem parametrizada
        if (data.whatsappUrl) {
          window.open(data.whatsappUrl, '_blank');
        }
      } else {
        setFormError(data.error || 'Não foi possível concluir o registro. Verifique os dados e tente novamente.');
      }
    } catch (err: any) {
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
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'BRL',
      description: '15 consultas gratuitas para teste corporativo'
    },
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

          {/* Links de Navegação com Nomenclatura Direcionada */}
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
              href={waLinkTrial}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#0077d1] via-[#02c1db] to-[#01cf9e] text-white text-xs font-bold shadow-lg shadow-[#0077d1]/25 hover:opacity-95 transition-all flex items-center space-x-2 transform hover:-translate-y-0.5"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Teste grátis</span>
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
              O Vurio analisa metadados de PDFs e fotos de receitas em 3 segundos, checa assinaturas ICP-Brasil e CFM em 27 estados, e sinaliza indícios de divergência para que seu RH decida com segurança.
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
                href={waLinkTrial}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-[#0077d1] via-[#02c1db] to-[#01cf9e] hover:opacity-95 text-white font-bold text-sm shadow-xl shadow-[#0077d1]/25 transition-all flex items-center justify-center space-x-2.5 transform hover:-translate-y-0.5 cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Testar 15 consultas grátis</span>
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
                <Check className="w-4 h-4 text-[#01cf9e]" /> Sem cartão de crédito
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-[#01cf9e]" /> Triagem em 3 segundos
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-[#01cf9e]" /> Em conformidade com a LGPD
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

                {/* Resposta do Vurio em 3 segundos */}
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
            <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/60">
              <span className="text-2xl lg:text-3xl font-black text-white block">33 Milhões+</span>
              <span className="text-xs text-slate-400">Trabalhadores CLT no Brasil</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/60">
              <span className="text-2xl lg:text-3xl font-black text-[#01cf9e] block">&lt; 3 segundos</span>
              <span className="text-xs text-slate-400">Tempo Médio de Resposta da Triagem</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/60">
              <span className="text-2xl lg:text-3xl font-black text-[#02c1db] block">100% PAdES</span>
              <span className="text-xs text-slate-400">Verificação Criptográfica ICP</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/60">
              <span className="text-2xl lg:text-3xl font-black text-indigo-300 block">Zero CID</span>
              <span className="text-xs text-slate-400">Sigilo Médico Resguardado</span>
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
                  
                  {/* Linha 1 */}
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

                  {/* Linha 2 */}
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

                  {/* Linha 3 */}
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

                  {/* Linha 4 */}
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
                        <CheckCircle2 className="w-3.5 h-3.5" /> Varredura nos 27 estados
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
              Uma esteira de análise em 3 camadas que processa documentos técnicos e fotos em até 3 segundos, sinalizando indícios para a decisão humana do RH.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Pilar 1: Criptografia ICP-Brasil */}
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

            {/* Pilar 2: Regularidade Cadastral no CFM */}
            <div className="p-7 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4 hover:border-[#02c1db]/40 transition-all shadow-xl group">
              <div className="w-12 h-12 rounded-2xl bg-sky-500/20 text-sky-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Stethoscope className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">2. Regularidade Cadastral no CFM (27 estados)</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Cruza automaticamente o nome do médico, número do CRM e UF emissora com os registros públicos oficiais, conferindo a situação cadastral ativa e se o profissional possui inscrição correspondente.
              </p>
              <div className="pt-2 border-t border-slate-800/80 flex items-center gap-2 text-[11px] text-slate-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span>Cobertura nacional em 27 estados</span>
              </div>
            </div>

            {/* Pilar 3: Consistência Geo-Temporal */}
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
      {/* Ativar quando tivermos os primeiros depoimentos e logos autorizados */}
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 text-left">
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <p className="text-xs text-slate-300 italic">
                "[Depoimento de demonstração: Reduzimos em 90% o tempo gasto na checagem manual de atestados e passamos a agir com segurança jurídica amparada em relatórios técnicos objetivos.]"
              </p>
              <div className="pt-2 border-t border-slate-800">
                <p className="text-xs font-bold text-white">[Gerente de RH - Setor Varejo]</p>
                <p className="text-[11px] text-slate-500">[Empresa com 1.200 colaboradores]</p>
              </div>
            </div>
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <p className="text-xs text-slate-300 italic">
                "[Depoimento de demonstração: O fluxo pelo WhatsApp corporativo organizou os prazos da CCT e eliminou o atrito entre DP e colaboradores.]"
              </p>
              <div className="pt-2 border-t border-slate-800">
                <p className="text-xs font-bold text-white">[Coordenador de DP - Indústria]</p>
                <p className="text-[11px] text-slate-500">[Empresa com 850 colaboradores]</p>
              </div>
            </div>
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <p className="text-xs text-slate-300 italic">
                "[Depoimento de demonstração: A triagem técnica dos metadados nos deu tranquilidade para tomar decisões assertivas em conformidade com a LGPD.]"
              </p>
              <div className="pt-2 border-t border-slate-800">
                <p className="text-xs font-bold text-white">[Diretora de Compliance e Gente]</p>
                <p className="text-[11px] text-slate-500">[Empresa de Logística]</p>
              </div>
            </div>
          </div>
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
              O Vurio opera sob os mais estritos princípios de <em>Privacy by Design</em>, minimização de dados e processamento efêmero, assegurando conformidade estrita com a Lei 13.709/2018.
            </p>
          </div>

          {/* Cards de Tópicos Factuais de LGPD */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Tópico 1: Base Legal Expressa */}
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Scale className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-white">1. Base Legal na LGPD</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  O tratamento de atestados médicos é legalizado sob os <strong>Artigos 7º, II e 11, II, "a" da Lei 13.709/2018</strong>, para cumprimento de obrigação legal ou regulatória da empresa empregadora (CLT e Lei 8.213/91).
                </p>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">Art. 7º e 11 LGPD</span>
            </div>

            {/* Tópico 2: Papel de Operador */}
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

            {/* Tópico 3: Não Exigência de CID */}
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

            {/* Tópico 4: Processamento Efêmero & Zero Retenção */}
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-white">4. Processamento Efêmero</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  O arquivo original é processado em memória volátil e <strong>definitivamente expurgado</strong> logo após a emissão do relatório de alertas. A guarda documental legal compete exclusivamente à empresa contratante.
                </p>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">Zero Retenção de Binários</span>
            </div>

          </div>

          {/* Tópicos Complementares com Marcadores Jurídicos (Ocultos em produção via flag) */}
          {SHOW_LGPD_EXTENDED && (
            <div className="p-6 rounded-2xl bg-slate-900/40 border border-dashed border-slate-700 space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                <AlertCircle className="w-4 h-4" />
                <span>Tópicos Complementares de LGPD (Apenas Preview):</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <h4 className="font-bold text-white">O que o Vurio guarda e por quanto tempo:</h4>
                  <p className="text-slate-400 leading-relaxed">
                    Armazenamos unicamente logs técnicos (Hash SHA-256, dados públicos do médico no CFM e carimbo de tempo) para trava de duplicidade. Prazo contratual de guarda de logs: [PREENCHER COM TEXTO JURÍDICO REVISADO].
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <h4 className="font-bold text-white">Segurança da infraestrutura e salvaguardas técnicas:</h4>
                  <p className="text-slate-400 leading-relaxed">
                    Comunicação criptografada em trânsito (TLS 1.3) e em repouso. Salvaguardas técnicas e controles de acesso: [PREENCHER COM TEXTO JURÍDICO REVISADO].
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>
      </section>

      {/* 7. SEÇÃO 6: TESTE GRÁTIS / PILOTO CORPORATIVO */}
      <section id="ativar-trial" className="py-20 px-4 sm:px-6 lg:px-8 border-b border-slate-800/60 bg-gradient-to-b from-slate-950 to-slate-900">
        <div className="max-w-4xl mx-auto space-y-8">
          
          <div className="text-center space-y-3">
            <span className="text-[11px] font-bold text-[#01cf9e] uppercase tracking-widest bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/30">
              AVALIAÇÃO CORPORATIVA SEM COMPROMISSO
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Coloque à prova a triagem automatizada do Vurio na sua empresa
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Ative <strong>15 Consultas Gratuitas de Triagem Técnica</strong> e teste com atestados que geraram dúvidas no seu Departamento Pessoal no último mês.
            </p>
          </div>

          {/* Card Principal de Teste Grátis */}
          <div className="p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl relative overflow-hidden space-y-8">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#0077d1]/10 rounded-full blur-2xl pointer-events-none"></div>

            {/* OPÇÃO 1: INÍCIO IMEDIATO VIA WHATSAPP (CTA PRINCIPAL) */}
            <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-950 to-slate-900 border border-slate-700/80 text-center space-y-4">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-[#02c1db] uppercase tracking-wider">
                  OPÇÃO MAIS RÁPIDA (SEM FORMULÁRIOS)
                </span>
                <h3 className="text-lg font-bold text-white">
                  Iniciar Teste de 15 Consultas Direto no WhatsApp
                </h3>
                <p className="text-xs text-slate-300 max-w-md mx-auto">
                  Clique no botão abaixo para abrir a conversa no WhatsApp oficial do Vurio com mensagem pré-preenchida.
                </p>
              </div>

              <div className="flex justify-center">
                <a
                  href={waLinkTrial}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-[#0077d1] via-[#02c1db] to-[#01cf9e] hover:opacity-95 text-white text-xs sm:text-sm font-bold shadow-lg shadow-[#0077d1]/25 transition-all flex items-center gap-2 transform hover:-translate-y-0.5 cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Testar 15 consultas grátis via WhatsApp</span>
                </a>
              </div>
            </div>

            {/* DIVISOR */}
            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-slate-800"></div>
              <span className="flex-shrink mx-4 text-[11px] text-slate-500 uppercase font-semibold">
                Ou cadastre sua empresa para liberar o painel web corporativo
              </span>
              <div className="flex-grow border-t border-slate-800"></div>
            </div>

            {/* OPÇÃO 2: FORMULÁRIO COMPLETO B2B (Com backend funcional) */}
            {submitted ? (
              <div className="text-center py-6 space-y-6 animate-fadeIn">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-white">Suas 15 Consultas Gratuitas Foram Ativadas!</h3>
                  <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto">
                    Seus dados corporativos foram registrados com sucesso. O WhatsApp do Vurio foi aberto para você enviar seu primeiro atestado para triagem técnica em 3 segundos.
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  {trialData?.whatsappUrl && (
                    <a
                      href={trialData.whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#0077d1] via-[#02c1db] to-[#01cf9e] hover:opacity-95 text-white text-xs font-bold shadow-lg transition-all flex items-center gap-2"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>Abrir Conversa no WhatsApp do Robô</span>
                    </a>
                  )}

                  <Link
                    href={trialData?.dashboardUrl || '/dashboard'}
                    className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700 transition-all flex items-center gap-2"
                  >
                    <Briefcase className="w-4 h-4 text-sky-400" />
                    <span>Acessar Painel Web da Empresa</span>
                  </Link>
                </div>

                <p className="text-[11px] text-slate-500">
                  Caso o WhatsApp não tenha aberto automaticamente, clique no botão acima.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitTrial} className="space-y-4 text-xs">
                {formError && (
                  <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 flex-shrink-0 text-rose-400 mt-0.5" />
                    <div>
                      <p className="font-bold text-xs">Não foi possível liberar as consultas:</p>
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
                      placeholder="Ex: Carlos Eduardo Mendes"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-[#02c1db] text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1.5">
                      E-mail Corporativo Institucional:
                      <span className="text-[#02c1db] text-[10px] ml-1 font-normal">(Exclusivo B2B)</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      placeholder="carlos@suaempresa.com.br"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-[#02c1db] text-xs"
                    />
                    {formEmail.includes('@gmail') || formEmail.includes('@hotmail') || formEmail.includes('@outlook') || formEmail.includes('@yahoo') ? (
                      <span className="text-[10px] text-amber-400 mt-1 block">
                        ⚠️ Cadastros com provedores públicos (@gmail/@hotmail) não são autorizados para o piloto corporativo. Use seu e-mail institucional.
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1.5">WhatsApp Corporativo com DDD:</label>
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
                    <label className="block text-slate-300 font-semibold mb-1.5">CNPJ da Empresa (Matriz ou Filial):</label>
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1.5">Nome / Razão Social da Empresa:</label>
                    <input
                      type="text"
                      required
                      value={formCompany}
                      onChange={(e) => setFormCompany(e.target.value)}
                      placeholder="Ex: Indústria Brasileira de Peças Ltda"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-[#02c1db] text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1.5">Faixa de Colaboradores CLT:</label>
                    <select
                      value={formRange}
                      onChange={(e) => setFormRange(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#02c1db] text-xs"
                    >
                      <option value="50 a 100">50 a 100 colaboradores</option>
                      <option value="100 a 500">100 a 500 colaboradores</option>
                      <option value="500 a 2000">500 a 2.000 colaboradores</option>
                      <option value="Acima de 2000">Acima de 2.000 colaboradores</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs shadow-lg transition-all flex items-center justify-center space-x-2 border border-slate-700"
                  >
                    {submitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Provisionando Conta de Teste...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4 text-[#02c1db]" />
                        <span>Cadastrar Empresa e Ativar 15 Consultas no Painel</span>
                      </>
                    )}
                  </button>
                </div>

                <p className="text-[11px] text-slate-500 text-center pt-1">
                  🔒 Dados protegidos sob a LGPD. Processamento efêmero sem armazenamento de diagnósticos (CID).
                </p>
              </form>
            )}

          </div>

        </div>
      </section>

      {/* 8. SEÇÃO 7: PLANOS COMERCIAIS (OCULTA EM PRODUÇÃO VIA FLAG SHOW_PLANOS) */}
      {SHOW_PLANOS && (
        <section id="planos" className="py-20 px-4 sm:px-6 lg:px-8 border-b border-slate-800/60 bg-slate-950">
          <div className="max-w-6xl mx-auto space-y-12">
            <div className="text-center space-y-3 max-w-3xl mx-auto">
              <span className="text-[11px] font-bold text-[#02c1db] uppercase tracking-widest bg-[#0077d1]/10 px-3 py-1 rounded-full border border-[#0077d1]/30">
                PLANOS E CONTRATAÇÃO
              </span>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                Planos sob medida para o tamanho da sua operação
              </h2>
              <p className="text-xs sm:text-sm text-slate-400">
                Escolha o pacote de consultas adequado ao volume mensal de atestados do seu Departamento Pessoal.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Plano Starter */}
              <div className="p-7 rounded-3xl bg-slate-900 border border-slate-800 space-y-6 flex flex-col justify-between">
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-white">Starter</h3>
                  <p className="text-xs text-slate-400">Para empresas de 50 a 200 colaboradores.</p>
                  <div className="text-2xl font-black text-white">
                    [PREENCHER COM VALORES/PLANOS COMERCIAIS REVISADOS]
                  </div>
                  <ul className="space-y-2 text-xs text-slate-300">
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Até 50 consultas/mês</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> WhatsApp oficial e Painel Web</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Validação ICP-Brasil e CFM</li>
                  </ul>
                </div>
                <a
                  href={waLinkPlans}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs text-center border border-slate-700 transition-all block"
                >
                  Falar sobre planos
                </a>
              </div>

              {/* Plano Pro */}
              <div className="p-7 rounded-3xl bg-slate-900 border-2 border-[#02c1db] space-y-6 flex flex-col justify-between relative shadow-2xl">
                <div className="space-y-4">
                  <span className="text-[10px] font-bold text-[#02c1db] uppercase tracking-wider bg-[#02c1db]/10 px-2.5 py-0.5 rounded-full">
                    MAIS POPULAR
                  </span>
                  <h3 className="text-lg font-bold text-white">Pro</h3>
                  <p className="text-xs text-slate-400">Para empresas de 200 a 1.000 colaboradores.</p>
                  <div className="text-2xl font-black text-white">
                    [PREENCHER COM VALORES/PLANOS COMERCIAIS REVISADOS]
                  </div>
                  <ul className="space-y-2 text-xs text-slate-300">
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Até 250 consultas/mês</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Múltiplas filiais e CCTs</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Alertas Geo-Shield de distância</li>
                  </ul>
                </div>
                <a
                  href={waLinkPlans}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-[#0077d1] via-[#02c1db] to-[#01cf9e] text-white font-bold text-xs text-center shadow-lg transition-all block"
                >
                  Falar sobre planos
                </a>
              </div>

              {/* Plano Enterprise */}
              <div className="p-7 rounded-3xl bg-slate-900 border border-slate-800 space-y-6 flex flex-col justify-between">
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-white">Enterprise</h3>
                  <p className="text-xs text-slate-400">Para grandes operações acima de 1.000 vidas.</p>
                  <div className="text-2xl font-black text-white">
                    [PREENCHER COM VALORES/PLANOS COMERCIAIS REVISADOS]
                  </div>
                  <ul className="space-y-2 text-xs text-slate-300">
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Volume sob medida</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Webhooks e integração dedicada</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Suporte e SLA prioritário</li>
                  </ul>
                </div>
                <a
                  href={waLinkPlans}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs text-center border border-slate-700 transition-all block"
                >
                  Falar sobre planos
                </a>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 9. FAQ */}
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

      {/* 10. FOOTER CORPORATIVO */}
      <footer className="bg-slate-950 py-12 px-4 sm:px-6 lg:px-8 border-t border-slate-900 text-center text-xs text-slate-500 space-y-4">
        
        {/* Aviso Legal Obrigatório no Rodapé */}
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
          Amparado na MP nº 2.200-2/2001 (ICP-Brasil), Resolução CFM 1.658/2002, Art. 482 da CLT, Lei 14.510/2023 (Telemedicina) e LGPD (Lei 13.709/2018).
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-400 pt-1">
          <Link href="/termos" className="hover:text-[#02c1db] underline transition-colors">
            Termos de Uso
          </Link>
          <span>•</span>
          <Link href="/termos" className="hover:text-[#02c1db] underline transition-colors">
            Política de Privacidade & LGPD
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

      {/* 11. MODAL: SIMULAÇÃO LIVE DE RELATÓRIO DE ALERTAS */}
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

              {/* Alerta Criptográfico */}
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 space-y-1">
                <p className="font-bold flex items-center gap-1.5 text-rose-400">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  Alerta Criptográfico: Assinatura Digital ICP-Brasil Rompida
                </p>
                <p className="text-[11px] text-slate-300">
                  O arquivo PDF sofreu edição gráfica após a assinatura digital do médico. O hash original (Digest) não corresponde aos bytes atuais do arquivo, indicando alteração posterior no conteúdo.
                </p>
              </div>

              {/* Alerta Geo-Shield */}
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
                href={waLinkTrial}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setDemoModalOpen(false)}
                className="px-4 py-2.5 bg-gradient-to-r from-[#0077d1] via-[#02c1db] to-[#01cf9e] text-white rounded-xl font-bold text-xs transition-all shadow flex items-center justify-center gap-1.5"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Testar 15 consultas grátis via WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
