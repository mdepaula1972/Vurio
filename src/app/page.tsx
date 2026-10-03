'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  ShieldCheck, 
  CheckCircle2, 
  XCircle,
  MessageSquare, 
  Activity, 
  Check, 
  HelpCircle,
  QrCode,
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
  Copy,
  AlertTriangle,
  Fingerprint,
  FileSpreadsheet,
  Smartphone,
  PhoneCall,
  Flame,
  Award
} from 'lucide-react';

export default function LandingHomePage() {
  // Estado do formulário de 15 consultas gratuitas (Seção 5)
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formCompany, setFormCompany] = useState('');
  const [formCnpj, setFormCnpj] = useState('');
  const [formRange, setFormRange] = useState('100 a 500 colaboradores');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [trialData, setTrialData] = useState<{ whatsappUrl: string; dashboardUrl: string } | null>(null);
  
  // Modal de Simulação Interativa de Laudo
  const [demoModalOpen, setDemoModalOpen] = useState(false);

  // Ação de Conversão Inteligente do Formulário (Seção 5)
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

        // Automação sem atrito: abre o WhatsApp com mensagem parametrizada imediatamente
        if (data.whatsappUrl) {
          window.open(data.whatsappUrl, '_blank');
        }
      } else {
        setFormError(data.error || 'Não foi possível concluir o registro. Verifique os dados e tente novamente.');
      }
    } catch (err) {
      console.error('Erro ao enviar trial:', err);
      setFormError('Falha na conexão com o servidor. Tente novamente em instantes.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen text-slate-100 flex flex-col font-sans selection:bg-sky-500/30 selection:text-sky-200 bg-slate-950">
      
      {/* 1. TOPBAR ELEGANTE & CORPORATIVA */}
      <header className="border-b border-slate-800/60 bg-slate-900/90 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Logo & Slogan Oficial Vurio */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="relative w-11 h-11 rounded-full p-0.5 bg-gradient-to-tr from-[#0077d1] via-[#02c1db] to-[#01cf9e] shadow-lg shadow-[#02c1db]/20 group-hover:scale-105 transition-transform duration-300 flex-shrink-0">
              <img
                src="/logo.png"
                alt="Vurio Logo"
                className="w-full h-full object-contain rounded-full bg-white"
              />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center space-x-2">
                <span className="font-black text-2xl tracking-tight bg-gradient-to-r from-white via-slate-100 to-[#02c1db] bg-clip-text text-transparent">
                  Vurio
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#02c1db]/10 text-[#02c1db] border border-[#02c1db]/30">
                  Perícia Forense
                </span>
              </div>
              <span className="text-[10px] font-medium text-slate-400 leading-tight hidden sm:block">
                Detecta divergências e incoerências em atestados médicos
              </span>
            </div>
          </Link>

          {/* Links de Navegação Institucional */}
          <nav className="hidden lg:flex items-center space-x-6 text-xs text-slate-300 font-medium">
            <a href="#o-abismo" className="hover:text-white transition-colors">O Ponto Cego do CFM</a>
            <a href="#pilares-defesa" className="hover:text-white transition-colors">5 Pilares de Defesa</a>
            <a href="#compliance-lgpd" className="hover:text-white transition-colors">Compliance & LGPD</a>
            <a href="#ativar-trial" className="hover:text-white transition-colors">15 Consultas Free</a>
          </nav>

          {/* Ações de Conversão & Login DP */}
          <div className="flex items-center space-x-3">
            <Link
              href="/dashboard"
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold border border-slate-700 transition-all flex items-center gap-1.5"
            >
              <Briefcase className="w-3.5 h-3.5 text-sky-400" />
              <span className="hidden sm:inline">Acessar Painel DP</span>
              <span className="sm:hidden">Entrar</span>
            </Link>

            <a
              href="#ativar-trial"
              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-[#0077d1] via-[#02c1db] to-[#01cf9e] hover:from-[#02c1db] hover:to-[#0077d1] text-[#001c4e] text-xs font-black shadow-md shadow-[#02c1db]/20 transition-all flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Testar 15 Atestados Free</span>
            </a>
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION (DOBRA PRINCIPAL) */}
      <section className="relative pt-14 pb-20 px-4 sm:px-6 lg:px-8 border-b border-slate-800/60 overflow-hidden">
        {/* Glow de fundo */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-sky-600/10 rounded-full blur-3xl pointer-events-none -z-10"></div>
        <div className="absolute top-1/3 right-1/4 w-[400px] h-[250px] bg-emerald-600/10 rounded-full blur-3xl pointer-events-none -z-10"></div>

        <div className="max-w-7xl mx-auto space-y-12">
          
          <div className="text-center space-y-6 max-w-4xl mx-auto">
            {/* Emblema Oficial & Slogan Vurio */}
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-full p-1 bg-gradient-to-tr from-[#0077d1] via-[#02c1db] to-[#01cf9e] shadow-2xl shadow-[#02c1db]/25 animate-soft-pulse">
                <img
                  src="/logo.png"
                  alt="Vurio - Detecta divergências e incoerências em atestados médicos"
                  className="w-full h-full object-contain rounded-full bg-white shadow-inner"
                />
              </div>
              <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-[#052d6b]/40 border border-[#02c1db]/35 text-[#02c1db] text-xs font-semibold shadow-inner">
                <span className="w-2 h-2 rounded-full bg-[#01cf9e] animate-pulse"></span>
                <span>Detecta divergências e incoerências em atestados médicos</span>
              </div>
            </div>

            {/* Headline de Alto Impacto */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.15]">
              Validar se o médico existe{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-amber-300 to-rose-400">
                não protege
              </span>{' '}
              a sua folha de pagamento.
            </h1>

            {/* Subheadline Precisa em 2 Frases */}
            <p className="text-sm sm:text-base lg:text-lg text-slate-300 max-w-3xl mx-auto leading-relaxed font-normal">
              O Vurio recepciona atestados autonomamente pelo <strong>WhatsApp corporativo</strong> da sua empresa e executa a <strong>triagem pericial de metadados em 3 segundos</strong>. Detecte incompatibilidades geográficas, adulterações de PDF e reusos de atestados antigos sem instalar programas ou sobrecarregar o RH.
            </p>

            {/* CTAs de Conversão */}
            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              <a
                href="#ativar-trial"
                className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-[#0077d1] via-[#02c1db] to-[#01cf9e] hover:from-[#02c1db] hover:to-[#0077d1] text-[#001c4e] text-sm font-extrabold shadow-xl shadow-[#02c1db]/25 transition-all flex items-center gap-2 transform hover:-translate-y-0.5"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Solicitar Demonstração Gratuita (15 Consultas Free)</span>
                <ArrowRight className="w-4 h-4" />
              </a>

              <button
                onClick={() => setDemoModalOpen(true)}
                className="px-5 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 text-sm font-semibold border border-slate-700/80 transition-all flex items-center gap-2"
              >
                <Eye className="w-4 h-4 text-sky-400" />
                <span>Ver Simulação de Laudo Live</span>
              </button>
            </div>

            {/* Badges de Confiança */}
            <div className="pt-4 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
              <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-emerald-400" /> Criptografia PAdES / ICP-Brasil</span>
              <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-emerald-400" /> 100% em conformidade com LGPD</span>
              <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-emerald-400" /> Sem termos acusatórios (Laudo Neutro)</span>
            </div>
          </div>

          {/* Mockup Split Live: WhatsApp Chat + Painel Vurio */}
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
                    <p className="text-[10px] text-[#02c1db] font-medium">Robô Pericial Ativo</p>
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
                    <ShieldCheck className="w-3.5 h-3.5" /> Vurio Compliance Bot:
                  </p>
                  <p className="text-[11px] text-slate-300">
                    Documento recebido e auditado com sucesso. Protocolo: <span className="font-mono text-emerald-300 font-bold">#VUR-8942</span> gerado e registrado no DP.
                  </p>
                </div>
              </div>
            </div>

            {/* Lado Direito: Laudo Gerado no Painel do DP */}
            <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-sky-500/20 text-sky-400">
                    <Activity className="w-4 h-4" />
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">Laudo Pericial de Triagem Instantânea</h4>
                    <p className="text-[10px] text-slate-400">Processado em tempo real em 0.18s</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  AVERIGUAÇÃO RECOMENDADA
                </span>
              </div>

              {/* Grid de Metadados Forenses */}
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
                  <span className="text-slate-400 text-[10px] block">RELAÇÃO CCT</span>
                  <span className="font-bold text-sky-400">No Prazo (24h)</span>
                </div>
              </div>

              {/* Alerta Forense de Incompatibilidade Geográfica */}
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-amber-400">
                  <MapPin className="w-4 h-4 text-amber-400" />
                  Alerta Geo-Shield: Incompatibilidade Geográfica de 412 km
                </div>
                <p className="text-[11px] text-slate-300">
                  O colaborador atua presencialmente na unidade de <strong>Santos/SP</strong>, mas a consulta presencial foi registrada às 14:15 em <strong>Ribeirão Preto/SP</strong> durante sua jornada.
                </p>
              </div>

              <div className="flex items-center justify-between pt-1 text-xs">
                <span className="font-mono text-slate-500 text-[10px]">Hash SHA-256: 7f8a9b2c... (Único)</span>
                <span className="text-sky-400 font-bold text-[11px] hover:underline cursor-pointer" onClick={() => setDemoModalOpen(true)}>
                  Exportar Certidão Pericial PDF →
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
              <span className="text-2xl lg:text-3xl font-black text-emerald-400 block">&lt; 3 segundos</span>
              <span className="text-xs text-slate-400">Tempo Médio de Laudo Pericial</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/60">
              <span className="text-2xl lg:text-3xl font-black text-sky-400 block">100% PAdES</span>
              <span className="text-xs text-slate-400">Verificação Criptográfica ICP</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/60">
              <span className="text-2xl lg:text-3xl font-black text-indigo-300 block">Zero CID</span>
              <span className="text-xs text-slate-400">Sigilo Médico Resguardado</span>
            </div>
          </div>

        </div>
      </section>

      {/* 3. O ABISMO DO MERCADO (A DOR CRÍTICA & PONTO CEGO DO CFM) */}
      <section id="o-abismo" className="py-20 px-4 sm:px-6 lg:px-8 border-b border-slate-800/60 bg-slate-950/60">
        <div className="max-w-7xl mx-auto space-y-12">
          
          <div className="text-center space-y-3 max-w-3xl mx-auto">
            <span className="text-[11px] font-bold text-amber-400 uppercase tracking-widest bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
              O PONTO CEGO DO DEPARTAMENTO PESSOAL
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Por que os validadores tradicionais de conselho não impedem as fraudes que sangram seu caixa?
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Muitas empresas acreditam que o simples ato de conferir se o médico está cadastrado no Conselho Federal de Medicina (CFM) é suficiente. Na vida real, <strong>as maiores fraudes contra a folha de pagamento utilizam médicos reais em contextos operacionais impossíveis</strong>:
            </p>
          </div>

          {/* Tabela Comparativa de Impacto */}
          <div className="rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden shadow-2xl max-w-5xl mx-auto">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-4 px-6 font-bold text-slate-300 w-2/5">Cenário Real de Fraude no seu DP</th>
                    <th className="py-4 px-6 font-bold text-rose-400 w-3/10">Validador Tradicional do Conselho</th>
                    <th className="py-4 px-6 font-bold text-emerald-400 w-3/10 bg-emerald-950/20">Proteção Ativa do Vurio</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70">
                  <tr className="hover:bg-slate-800/30 transition-all">
                    <td className="py-4 px-6">
                      <p className="font-bold text-white text-sm">Incompatibilidade de Deslocamento</p>
                      <p className="text-slate-400 text-[11px] mt-0.5">Colaborador escala presencialmente em Santos e apresenta atestado de consulta às 14h em Ribeirão Preto (420 km).</p>
                    </td>
                    <td className="py-4 px-6 text-slate-300">
                      <span className="text-rose-400 font-bold flex items-center gap-1.5"><XCircle className="w-4 h-4 flex-shrink-0" /> Aprova cegamente</span>
                      <p className="text-[10px] text-slate-500 mt-1">O médico tem CRM ativo e o portal não sabe onde a sua empresa opera.</p>
                    </td>
                    <td className="py-4 px-6 bg-emerald-950/20 text-slate-300">
                      <span className="text-emerald-400 font-bold flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 flex-shrink-0" /> Alerta Geo-Shield</span>
                      <p className="text-[10px] text-slate-400 mt-1">Identifica a rota impossível e calcula o tempo inviável de viagem.</p>
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-800/30 transition-all">
                    <td className="py-4 px-6">
                      <p className="font-bold text-white text-sm">Reuso do Mesmo PDF em Sextas-feiras</p>
                      <p className="text-slate-400 text-[11px] mt-0.5">O colaborador reutiliza o arquivo de um atestado legítimo de 3 meses atrás para justificar uma falta na véspera de feriado.</p>
                    </td>
                    <td className="py-4 px-6 text-slate-300">
                      <span className="text-rose-400 font-bold flex items-center gap-1.5"><XCircle className="w-4 h-4 flex-shrink-0" /> Aprova novamente</span>
                      <p className="text-[10px] text-slate-500 mt-1">O arquivo original tem assinatura válida, então o site do conselho dá "OK".</p>
                    </td>
                    <td className="py-4 px-6 bg-emerald-950/20 text-slate-300">
                      <span className="text-emerald-400 font-bold flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 flex-shrink-0" /> Trava SHA-256</span>
                      <p className="text-[10px] text-slate-400 mt-1">Acusa que o arquivo já foi abonado no passado e bloqueia a duplicidade.</p>
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-800/30 transition-all">
                    <td className="py-4 px-6">
                      <p className="font-bold text-white text-sm">Prazos de Convenção Coletiva (CCT)</p>
                      <p className="text-slate-400 text-[11px] mt-0.5">O acordo sindical estabelece entrega em até 48 horas úteis. O funcionário envia o documento 7 dias depois.</p>
                    </td>
                    <td className="py-4 px-6 text-slate-300">
                      <span className="text-rose-400 font-bold flex items-center gap-1.5"><XCircle className="w-4 h-4 flex-shrink-0" /> Desconhece a regra</span>
                      <p className="text-[10px] text-slate-500 mt-1">Conselhos médicos não fiscalizam prazos de leis trabalhistas da CLT.</p>
                    </td>
                    <td className="py-4 px-6 bg-emerald-950/20 text-slate-300">
                      <span className="text-emerald-400 font-bold flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 flex-shrink-0" /> Guardião CCT</span>
                      <p className="text-[10px] text-slate-400 mt-1">Calcula dias úteis sindicais e aponta perda do direito ao abono remunerado.</p>
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-800/30 transition-all">
                    <td className="py-4 px-6">
                      <p className="font-bold text-white text-sm">Falsificações Criadas em Editores Virtuais</p>
                      <p className="text-slate-400 text-[11px] mt-0.5">Atestados comprados em grupos de mensagens com carimbos clonados de médicos reais e texto adulterado.</p>
                    </td>
                    <td className="py-4 px-6 text-slate-300">
                      <span className="text-rose-400 font-bold flex items-center gap-1.5"><XCircle className="w-4 h-4 flex-shrink-0" /> Confunde o DP</span>
                      <p className="text-[10px] text-slate-500 mt-1">Analista gasta horas telefonando para secretarias de clínicas sem retorno.</p>
                    </td>
                    <td className="py-4 px-6 bg-emerald-950/20 text-slate-300">
                      <span className="text-emerald-400 font-bold flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 flex-shrink-0" /> Perícia PAdES</span>
                      <p className="text-[10px] text-slate-400 mt-1">Identifica em 120ms se a assinatura digital foi corrompida ou inexistente.</p>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </section>

      {/* 4. OS 5 PILARES DE DEFESA DO VURIO (BENEFÍCIOS TÉCNICOS EM UI/UX) */}
      <section id="pilares-defesa" className="py-20 px-4 sm:px-6 lg:px-8 border-b border-slate-800/60 bg-slate-900/40">
        <div className="max-w-7xl mx-auto space-y-12">
          
          <div className="text-center space-y-3 max-w-3xl mx-auto">
            <span className="text-[11px] font-bold text-sky-400 uppercase tracking-widest bg-sky-500/10 px-3 py-1 rounded-full border border-sky-500/20">
              ARQUITETURA DE BLINDAGEM CORPORATIVA
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Os 5 Pilares de Defesa do Vurio
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Cada camada foi projetada para fechar as brechas operacionais da rotina de Departamento Pessoal sem criar atrito com os colaboradores honestos.
            </p>
          </div>

          {/* Bento Grid de 5 Pilares */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            
            {/* Pilar 1: Geo-Shield */}
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-amber-500/50 transition-all flex flex-col justify-between space-y-4 group">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <MapPin className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  Auditoria de Deslocamento
                </span>
                <h3 className="text-base font-bold text-white">Vurio Geo-Shield™</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Cruza a cidade da sede da empresa com a geolocalização do consultório médico emissor. Identifica atestados de consultas rotineiras emitidos a centenas de quilômetros durante o expediente de trabalho presencial do colaborador.
                </p>
              </div>
              <div className="pt-2 border-t border-slate-800 text-[11px] text-amber-300/80 font-mono">
                ✓ Amparado no Art. 482 da CLT
              </div>
            </div>

            {/* Pilar 2: Hash SHA-256 */}
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-sky-500/50 transition-all flex flex-col justify-between space-y-4 group">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Fingerprint className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
                  Trava de Duplicidade
                </span>
                <h3 className="text-base font-bold text-white">Antifraude por Hash SHA-256</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Cada atestado processado gera uma impressão digital criptográfica única. Se o mesmo PDF for reapresentado meses depois pelo mesmo funcionário ou compartilhado entre colegas para justificar ausências em lote, o sistema bloqueia na hora.
                </p>
              </div>
              <div className="pt-2 border-t border-slate-800 text-[11px] text-sky-300/80 font-mono">
                ✓ Zero risco de duplo abono financeiro
              </div>
            </div>

            {/* Pilar 3: Janela Temporal CCT */}
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-indigo-500/50 transition-all flex flex-col justify-between space-y-4 group">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Clock className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                  Regras Sindicais
                </span>
                <h3 className="text-base font-bold text-white">Guardião Temporal de CCT</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Configure a tolerância em horas da Convenção Coletiva de Trabalho da sua categoria (ex: 48h úteis). O sistema calcula automaticamente o tempo decorrido desde a alta médica até o envio no WhatsApp, indicando se a falta deve ser abonada ou descontada.
                </p>
              </div>
              <div className="pt-2 border-t border-slate-800 text-[11px] text-indigo-300/80 font-mono">
                ✓ Fechamento de folha padronizado
              </div>
            </div>

            {/* Pilar 4: Triagem Autônoma via WhatsApp */}
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/50 transition-all flex flex-col justify-between space-y-4 group md:col-span-2 lg:col-span-2">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  Zero Fricção de TI
                </span>
                <h3 className="text-base font-bold text-white">Triagem Autônoma via WhatsApp</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Seus colaboradores já usam o WhatsApp no dia a dia. Eles enviam o PDF ou foto do atestado para o número corporativo da empresa, o robô pericial do Vurio faz o download, executa a perícia e responde o colaborador com protocolo formal em 3 segundos. O DP não perde tempo abrindo arquivos manualmente.
                </p>
              </div>
              <div className="pt-2 border-t border-slate-800 text-[11px] text-emerald-300/80 font-mono">
                ✓ Integração via Evolution API com número exclusivo por empresa
              </div>
            </div>

            {/* Pilar 5: Auditoria Retroativa de Passivo (5 Anos) */}
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-rose-500/50 transition-all flex flex-col justify-between space-y-4 group">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <TrendingDown className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                  Inteligência Financeira
                </span>
                <h3 className="text-base font-bold text-white">Auditoria de Passivo (5 Anos)</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Suba o acervo histórico de atestados dos últimos 5 anos da sua empresa. O motor varre milhares de arquivos em lote, localiza padrões de falsificação e calcula o valor financeiro exato passível de cobrança e saneamento antes de ações trabalhistas.
                </p>
              </div>
              <div className="pt-2 border-t border-slate-800 text-[11px] text-rose-300/80 font-mono">
                ✓ Conforme prazo prescricional trabalhista (Art. 7º, XXIX CF)
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 5. COMPLIANCE E PRIVACIDADE (A OBJEÇÃO DA LGPD DERRUBADA) */}
      <section id="compliance-lgpd" className="py-20 px-4 sm:px-6 lg:px-8 border-b border-slate-800/60 bg-slate-950/60">
        <div className="max-w-7xl mx-auto space-y-12">
          
          <div className="text-center space-y-3 max-w-3xl mx-auto">
            <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
              SEGURANÇA JURÍDICA E DE DADOS
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Desenvolvido para atender às exigências mais rigorosas do seu DPO e Jurídico
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              O Vurio opera sob os mais estritos princípios de <em>Privacy by Design</em> e minimização de dados, blindando sua empresa contra multas da ANPD e contestações sindicais.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            
            {/* Bloco 1: Base Legal da LGPD */}
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Scale className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white">Base Legal Expressa na LGPD</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                O tratamento de atestados médicos é 100% legalizado sob os <strong>Artigos 7º, II e 11, II, "a" da Lei 13.709/2018</strong>, que autorizam o processamento para cumprimento de obrigação legal ou regulatória da empresa (CLT e Lei 8.213/91).
              </p>
            </div>

            {/* Bloco 2: Operador de Dados */}
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white">Papel Estrito de Operador (Processor)</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Sua empresa é a única Controladora dos dados. O Vurio processa a integridade pericial sob estrito mandato técnico, sem comercialização, compartilhamento ou monetização de metadados com terceiros.
              </p>
            </div>

            {/* Bloco 3: Zero Exigência de CID */}
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white">Sem Exigência ou Guarda de CID</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Em total harmonia com a <strong>Resolução CFM nº 1.658/2002</strong> e a <strong>Súmula do TST</strong>, o Vurio não exige o diagnóstico de doença (CID). O motor analisa apenas a autenticidade da assinatura médica, dados do emissor e prazo legal de afastamento.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* 6. OFERTA DE ENTRADA & FORMULÁRIO DE CONVERSÃO INTELIGENTE (SEÇÃO 5) */}
      <section id="ativar-trial" className="py-20 px-4 sm:px-6 lg:px-8 border-b border-slate-800/60 bg-gradient-to-b from-slate-950 to-slate-900">
        <div className="max-w-4xl mx-auto space-y-8">
          
          <div className="text-center space-y-3">
            <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/30">
              TESTE PILOTO SEM COMPROMISSO
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Coloque à prova o motor pericial do Vurio na sua empresa
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Ative suas <strong>15 Consultas Gratuitas de Auditoria Forense</strong> e teste com atestados reais que geraram dúvidas no seu Departamento Pessoal no último mês.
            </p>
          </div>

          {/* Card do Formulário de Conversão Inteligente */}
          <div className="p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>

            {submitted ? (
              <div className="text-center py-8 space-y-6 animate-fadeIn">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-white">Suas 15 Consultas Gratuitas Foram Ativadas!</h3>
                  <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto">
                    Seus dados foram registrados com sucesso. O WhatsApp do robô do Vurio foi aberto no seu dispositivo para você enviar seu primeiro atestado para auditoria em 3 segundos.
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  {trialData?.whatsappUrl && (
                    <a
                      href={trialData.whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-2"
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
                  Caso o WhatsApp não tenha aberto automaticamente, clique no botão verde acima.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitTrial} className="space-y-4 text-xs">
                {formError && (
                  <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-start gap-3 animate-shake">
                    <AlertTriangle className="w-5 h-5 flex-shrink-0 text-rose-400 mt-0.5" />
                    <div>
                      <p className="font-bold text-xs">Não foi possível liberar as consultas gratuitas:</p>
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
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1.5">
                      E-mail Corporativo Institucional:
                      <span className="text-emerald-400 text-[10px] ml-1 font-normal">(Exclusivo B2B)</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      placeholder="carlos@suaempresa.com.br"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 text-xs"
                    />
                    {formEmail.includes('@gmail') || formEmail.includes('@hotmail') || formEmail.includes('@outlook') || formEmail.includes('@yahoo') ? (
                      <span className="text-[10px] text-amber-400 mt-1 block">
                        ⚠️ Cadastros com @gmail/@hotmail não são autorizados para o piloto corporativo. Use seu e-mail da empresa.
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
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1.5">CNPJ da Empresa (Matriz ou Filial):</label>
                    <input
                      type="text"
                      required
                      value={formCnpj}
                      onChange={(e) => {
                        // Aplica máscara automática de CNPJ
                        const raw = e.target.value.replace(/\D/g, '').slice(0, 14);
                        const masked = raw.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
                        setFormCnpj(raw.length === 14 ? masked : e.target.value);
                      }}
                      placeholder="00.000.000/0001-00"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1.5">Razão Social / Nome da Empresa:</label>
                    <input
                      type="text"
                      required
                      value={formCompany}
                      onChange={(e) => setFormCompany(e.target.value)}
                      placeholder="Ex: Grupo Industrial Paulista S/A"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1.5">Faixa de Colaboradores CLT:</label>
                    <select
                      value={formRange}
                      onChange={(e) => setFormRange(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-500 text-xs"
                    >
                      <option value="50 a 100 colaboradores">50 a 100 colaboradores</option>
                      <option value="100 a 500 colaboradores">100 a 500 colaboradores</option>
                      <option value="500 a 2.000 colaboradores">500 a 2.000 colaboradores</option>
                      <option value="Mais de 2.000 colaboradores">Mais de 2.000 colaboradores</option>
                    </select>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>
                    <strong>Blindagem Antifraude:</strong> Piloto exclusivo para pessoas jurídicas ativas. Válido 1 vez por grupo empresarial (raiz de CNPJ).
                  </span>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-sm rounded-xl shadow-xl shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 transform hover:-translate-y-0.5"
                  >
                    {submitting ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        <span>Ativando 15 Consultas e Abrindo WhatsApp...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-amber-300" />
                        <span>ATIVAR MINHAS 15 CONSULTAS GRATUITAS AGORA</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] text-slate-400 pt-2">
                  <span className="flex items-center gap-1"><Check className="w-3.5 h-3.5 text-emerald-400" /> Sem cartão de crédito</span>
                  <span className="flex items-center gap-1"><Check className="w-3.5 h-3.5 text-emerald-400" /> Ativação e resposta em segundos</span>
                  <span className="flex items-center gap-1"><Check className="w-3.5 h-3.5 text-emerald-400" /> Sem reuniões de vendas obrigatórias</span>
                </div>
              </form>
            )}

          </div>

        </div>
      </section>

      {/* 7. PERGUNTAS FREQUENTES (FAQ) */}
      <section id="perguntas-frequentes" className="py-16 px-4 sm:px-6 lg:px-8 border-b border-slate-800/60 bg-slate-950/40">
        <div className="max-w-4xl mx-auto space-y-8">
          
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-white">Dúvidas Frequentes</h2>
            <p className="text-xs sm:text-sm text-slate-400">Respostas diretas de conformidade técnica e operacional:</p>
          </div>

          <div className="space-y-4 text-xs sm:text-sm">
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
              <h4 className="font-bold text-white flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-sky-400" />
                Como o funcionário envia o atestado sem criar constrangimentos?
              </h4>
              <p className="text-slate-300 leading-relaxed pl-6">
                O colaborador simplesmente anexa o PDF ou a foto legível no WhatsApp oficial da empresa. O robô emite uma mensagem neutra e protocolada confirmando a recepção formal. O analista de DP não precisa fazer perguntas constrangedoras.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
              <h4 className="font-bold text-white flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-sky-400" />
                O que o Vurio faz quando um atestado é adulterado?
              </h4>
              <p className="text-slate-300 leading-relaxed pl-6">
                O Vurio não faz juízos morais nem acusa ninguém. O sistema emite um laudo técnico apontando objetivamente as divergências criptográficas (como SHA-256 alterado ou ausência de cadeia ICP-Brasil), fornecendo respaldo documental incontestável para o Departamento Jurídico da sua empresa.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
              <h4 className="font-bold text-white flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-sky-400" />
                Preciso integrar ao meu software de folha ou ERP?
              </h4>
              <p className="text-slate-300 leading-relaxed pl-6">
                Não é obrigatório! O Vurio funciona de forma 100% autônoma desde o primeiro minuto via WhatsApp e Painel Web. Caso sua equipe de TI deseje, fornecemos webhooks para sincronização de dados.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* 8. FOOTER CORPORATIVO */}
      <footer className="bg-slate-950 py-12 px-4 sm:px-6 lg:px-8 border-t border-slate-900 text-center text-xs text-slate-500 space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 text-slate-200 font-semibold">
          <div className="w-8 h-8 rounded-full p-0.5 bg-gradient-to-tr from-[#0077d1] via-[#02c1db] to-[#01cf9e]">
            <img src="/logo.png" alt="Vurio" className="w-full h-full object-contain rounded-full bg-white" />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
            <span className="text-sm font-bold text-white">Vurio Compliance & Perícia Digital</span>
            <span className="hidden sm:inline text-slate-600">•</span>
            <span className="text-xs text-[#02c1db] font-medium">Detecta divergências e incoerências em atestados médicos</span>
          </div>
        </div>
        <p className="max-w-2xl mx-auto text-[11px] leading-relaxed text-slate-500">
          Amparado na MP nº 2.200-2/2001 (ICP-Brasil), Resolução CFM 1.658/2002, Art. 482 da CLT, Lei 14.510/2023 (Telemedicina) e LGPD (Lei 13.709/2018).
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-400 pt-1">
          <Link href="/termos" className="hover:text-[#02c1db] underline transition-colors">
            Termos de Uso & Segurança Jurídica
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
          © 2026 Vurio. Todos os direitos reservados. CNPJ: 42.189.542/0001-90.
        </p>
      </footer>

      {/* MODAL: SIMULAÇÃO LIVE DE LAUDO PERICIAL */}
      {demoModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-sky-400" />
                Simulação Interativa de Laudo Pericial Vurio
              </h3>
              <button onClick={() => setDemoModalOpen(false)} className="text-slate-400 hover:text-white">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">Documento Auditado:</span>
                <span className="font-mono text-white">Atestado_Exemplo_Fraude_PAdES.pdf</span>
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
                  O arquivo PDF sofreu edição após a assinatura digital do médico. O hash original (Digest) não corresponde aos bytes atuais do arquivo, configurando quebra de integridade jurídica (PAdES Tampered).
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

            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={() => setDemoModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs transition-all"
              >
                Fechar Simulação
              </button>
              <a
                href="#ativar-trial"
                onClick={() => setDemoModalOpen(false)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs transition-all shadow"
              >
                Ativar 15 Consultas Gratuitas →
              </a>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
