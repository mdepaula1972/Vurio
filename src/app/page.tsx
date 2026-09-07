'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  ShieldCheck, 
  CheckCircle2, 
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
  CreditCard,
  MapPin,
  Sliders,
  Compass,
  Zap,
  ArrowRight,
  Eye,
  Scale,
  UserCheck,
  Briefcase,
  Home,
  Info,
  Clock,
  ChevronDown,
  FileText,
  Lock
} from 'lucide-react';

export default function LandingHomePage() {
  const [selectedProfile, setSelectedProfile] = useState<'mei' | 'dp' | 'doctor'>('mei');
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  const [copiedWebhook, setCopiedWebhook] = useState(false);

  // Dicionário de Linguagem Trivial (O que cada termo significa em português simples)
  const terminology = {
    icp: {
      title: 'Assinatura Digital ICP-Brasil',
      simple: 'A identidade eletrônica oficial do médico emitida pelo governo. Ela garante que o atestado é legítimo e que ninguém alterou o número de dias, a data ou o CID no computador.'
    },
    cfm: {
      title: 'Consulta ao CFM dos 27 Estados',
      simple: 'Checamos em tempo real no Conselho Federal de Medicina se o médico que assinou existe, se o registro dele está ativo e se o nome do carimbo bate com o profissional oficial.'
    },
    geo: {
      title: 'Geo-Shield (Distância de Atendimento)',
      simple: 'Verifica se o colaborador foi atendido em uma cidade incompatível com a sua rotina de trabalho (por exemplo: trabalha em Santos e apresentou atestado físico emitido em Ribeirão Preto a 430 km).'
    },
    dates: {
      title: 'Checagem de Datas e Prazo da Empresa',
      simple: 'Avisa se o atestado veio pré-datado (com data futura) ou se foi entregue fora do prazo limite estabelecido pela convenção coletiva ou política interna da sua empresa.'
    },
    dossier: {
      title: 'Dossiê Pericial para B.O. na Polícia',
      simple: 'Se comprovada a falsificação, geramos uma certidão pericial com carimbo oficial e código inalterável pronta para você levar à delegacia ou fundamentar uma demissão com segurança.'
    },
    inquiry: {
      title: 'Diligência com a Clínica em 1-Clique',
      simple: 'Um ofício administrativo formal enviado diretamente para a secretaria do hospital ou consultório confirmar se o colaborador realmente passou por consulta médica lá.'
    }
  };

  return (
    <div className="min-h-screen text-slate-100 flex flex-col font-sans selection:bg-sky-500/30 selection:text-sky-200">
      
      {/* 1. TOP NAVBAR ELEGANTE & LIMPA */}
      <header className="border-b border-slate-800/60 bg-slate-900/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Logo & Slogan */}
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 via-indigo-600 to-emerald-500 flex items-center justify-center shadow-lg shadow-sky-500/10">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-xl tracking-tight text-white">VURIO</span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Compliance & Perícia
                </span>
              </div>
            </div>
          </div>

          {/* Links Centrais Acolhedores */}
          <nav className="hidden md:flex items-center space-x-6 text-xs text-slate-300 font-medium">
            <a href="#como-funciona" className="hover:text-white transition-colors">Como Funciona</a>
            <a href="#para-quem-e" className="hover:text-white transition-colors">Para Quem É</a>
            <a href="#o-que-auditamos" className="hover:text-white transition-colors">O Que Auditamos</a>
            <a href="#precos" className="hover:text-white transition-colors">Preços & Avulso</a>
            <a href="#perguntas-frequentes" className="hover:text-white transition-colors">Dúvidas Comuns</a>
          </nav>

          {/* Ações: Área do Cliente & WhatsApp */}
          <div className="flex items-center space-x-3">
            <Link
              href="/dashboard"
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold border border-slate-700 transition-all flex items-center gap-1.5"
            >
              <Briefcase className="w-3.5 h-3.5 text-sky-400" />
              <span>Área do Cliente (DP)</span>
            </Link>

            <a
              href="#precos"
              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Consulta por R$ 10</span>
            </a>
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION CONVIDATIVO EM PORTUGUÊS CLARO */}
      <section className="relative pt-12 pb-16 px-4 sm:px-6 lg:px-8 border-b border-slate-800/60 overflow-hidden">
        <div className="max-w-4xl mx-auto text-center space-y-5">
          
          <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Auditoria médica técnica, neutra e sem constrangimentos</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Descubra em segundos se o atestado médico recebido é <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-teal-300 to-emerald-400">autêntico e confiável</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed font-normal">
            Elimine as incertezas no fechamento da folha e evite conflitos desnecessários com seus colaboradores. O Vurio checa a assinatura digital, o registro do médico no CFM e a consistência das datas diretamente pelo <strong>WhatsApp</strong> ou pela <strong>Web</strong>.
          </p>

          {/* Botões de Ação Rápida */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
            <a
              href="#degustacao-gratis"
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white text-sm font-bold shadow-xl shadow-sky-500/20 transition-all flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Testar 15 Atestados Gratuitamente</span>
            </a>

            <a
              href="#precos"
              className="px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 text-sm font-semibold border border-slate-700/80 transition-all flex items-center gap-2"
            >
              <span>Consulta Avulsa (R$ 10)</span>
            </a>

            <Link
              href="/dashboard"
              className="px-4 py-3 rounded-xl bg-slate-900/60 hover:bg-slate-800 text-slate-400 hover:text-white text-xs font-semibold transition-all flex items-center gap-1.5"
            >
              <Briefcase className="w-3.5 h-3.5 text-sky-400" />
              <span>Painel do RH</span>
            </Link>
          </div>

          {/* Garantias em Destaque */}
          <div className="pt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
            <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-emerald-400" /> Resposta em 3 segundos</span>
            <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-emerald-400" /> Sem termos acusatórios</span>
            <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-emerald-400" /> 100% amparado na CLT & CFM</span>
          </div>
        </div>
      </section>

      {/* 3. SELETOR DE PERFIL: "PARA QUEM É O VURIO?" (ONBOARDING INTELIGENTE) */}
      <section id="para-quem-e" className="py-14 px-4 sm:px-6 lg:px-8 border-b border-slate-800/60 bg-slate-950/40">
        <div className="max-w-7xl mx-auto space-y-8">
          
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-white">Para quem é o Vurio?</h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Escolha seu perfil para entender como o Vurio atende exatamente a sua necessidade:
            </p>
          </div>

          {/* Seletor de 3 Botões */}
          <div className="flex flex-wrap justify-center gap-3">
            <button
              onClick={() => setSelectedProfile('mei')}
              className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 border ${
                selectedProfile === 'mei'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/60 shadow-lg shadow-emerald-500/10'
                  : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:bg-slate-800'
              }`}
            >
              <Home className="w-4 h-4" />
              <span>MEI / Pequeno Negócio / Doméstica</span>
            </button>

            <button
              onClick={() => setSelectedProfile('dp')}
              className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 border ${
                selectedProfile === 'dp'
                  ? 'bg-sky-500/20 text-sky-300 border-sky-500/60 shadow-lg shadow-sky-500/10'
                  : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:bg-slate-800'
              }`}
            >
              <Briefcase className="w-4 h-4" />
              <span>Recursos Humanos & Departamento Pessoal</span>
            </button>

            <button
              onClick={() => setSelectedProfile('doctor')}
              className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 border ${
                selectedProfile === 'doctor'
                  ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/60 shadow-lg shadow-indigo-500/10'
                  : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:bg-slate-800'
              }`}
            >
              <Stethoscope className="w-4 h-4" />
              <span>Médicos & Consultórios</span>
            </button>
          </div>

          {/* Conteúdo Dinâmico do Perfil Escolhido */}
          <div className="max-w-3xl mx-auto p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
            
            {selectedProfile === 'mei' && (
              <div className="space-y-4 animate-fadeIn">
                <div className="flex items-center space-x-2 text-emerald-400 font-bold text-sm">
                  <Home className="w-5 h-5" />
                  <span>Você tem 1 ou 2 funcionários e recebeu um atestado suspeito?</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Você não precisa pagar mensalidades altas nem assinar contratos longos. Com o Vurio, você pode fazer uma <strong>Consulta Avulsa por apenas R$ 10,00</strong>. Basta mandar a foto ou o PDF do atestado no nosso WhatsApp e pagar via PIX instantâneo. Em 3 segundos você recebe um laudo claro dizendo se o médico existe e se o documento é válido.
                </p>
                <div className="pt-2">
                  <a
                    href="#precos"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all"
                  >
                    <span>Consultar Atestado por R$ 10,00</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            )}

            {selectedProfile === 'dp' && (
              <div className="space-y-4 animate-fadeIn">
                <div className="flex items-center space-x-2 text-sky-400 font-bold text-sm">
                  <Briefcase className="w-5 h-5" />
                  <span>Sua empresa lida com dezenas de atestados todo mês?</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Automatize a recepção de atestados pelo WhatsApp oficial da empresa. O Vurio audita a assinatura eletrônica ICP-Brasil, o registro do CRM nos 27 estados, calcula regras de prazo da CCT e alerta caso o colaborador tenha passado por consulta em cidades muito distantes do trabalho (Geo-Shield). O DP ganha segurança jurídica e reduz o absenteísmo sem estresse.
                </p>
                <div className="pt-2 flex gap-3">
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition-all"
                  >
                    <span>Acessar Painel do Cliente</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                  <a
                    href="#precos"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all"
                  >
                    <span>Ver Planos Mensais</span>
                  </a>
                </div>
              </div>
            )}

            {selectedProfile === 'doctor' && (
              <div className="space-y-4 animate-fadeIn">
                <div className="flex items-center space-x-2 text-indigo-400 font-bold text-sm">
                  <Stethoscope className="w-5 h-5" />
                  <span>Médico: Descubra se criminosos estão usando seu carimbo</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Infelizmente, carimbos médicos são falsificados diariamente para venda de atestados ilegais. No <strong>Doctor Shield</strong>, médicos podem consultar gratuitamente se seu CRM apareceu em documentos questionados por empresas em todo o Brasil e gerar um Dossiê Jurídico com 1 clique para abertura de Notícia-Crime na Polícia Civil.
                </p>
                <div className="pt-2">
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all"
                  >
                    <span>Consultar Exposição do CRM</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            )}

          </div>
        </div>
      </section>

      {/* 4. VITRINE EXPLICATIVA: "O QUE AUDITAMOS?" (COM HOVER EM LINGUAGEM TRIVIAL) */}
      <section id="o-que-auditamos" className="py-14 px-4 sm:px-6 lg:px-8 border-b border-slate-800/60">
        <div className="max-w-7xl mx-auto space-y-8">
          
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <span className="text-xs font-semibold text-sky-400 uppercase tracking-wider">Transparência Total</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">
              O que o Vurio analisa em cada atestado?
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Passe o mouse (ou toque) nos cartões abaixo para entender o que cada checagem significa em linguagem simples, sem termos complicados:
            </p>
          </div>

          {/* Grid de 6 Cartões com Explicação Trivial */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Card 1: ICP-Brasil */}
            <div 
              onMouseEnter={() => setActiveTooltip('icp')}
              onMouseLeave={() => setActiveTooltip(null)}
              onClick={() => setActiveTooltip(activeTooltip === 'icp' ? null : 'icp')}
              className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-sky-500/50 transition-all cursor-pointer space-y-3 relative group"
            >
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center">
                  <Lock className="w-5 h-5" />
                </div>
                <span className="text-[10px] text-sky-400 font-bold uppercase bg-sky-500/10 px-2 py-0.5 rounded-full">
                  Passe o mouse
                </span>
              </div>
              <h3 className="text-sm font-bold text-white">{terminology.icp.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Verifica se o PDF possui certificado digital válido e se o documento foi alterado após a emissão.
              </p>
              
              {/* Balão Explicativo Suave */}
              <div className="p-3 rounded-xl bg-slate-950 border border-sky-500/30 text-xs text-sky-200/90 space-y-1">
                <span className="font-bold flex items-center gap-1 text-[11px] text-sky-300">
                  <Info className="w-3.5 h-3.5" /> Entenda em termos simples:
                </span>
                <p className="text-[11px] text-slate-300 leading-relaxed">{terminology.icp.simple}</p>
              </div>
            </div>

            {/* Card 2: CFM Nacional */}
            <div 
              onMouseEnter={() => setActiveTooltip('cfm')}
              onMouseLeave={() => setActiveTooltip(null)}
              onClick={() => setActiveTooltip(activeTooltip === 'cfm' ? null : 'cfm')}
              className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-emerald-500/50 transition-all cursor-pointer space-y-3 relative group"
            >
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                  <Stethoscope className="w-5 h-5" />
                </div>
                <span className="text-[10px] text-emerald-400 font-bold uppercase bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  27 Estados
                </span>
              </div>
              <h3 className="text-sm font-bold text-white">{terminology.cfm.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Cruza o CRM e a UF do carimbo com os cadastros oficiais do Conselho Federal de Medicina.
              </p>
              
              <div className="p-3 rounded-xl bg-slate-950 border border-emerald-500/30 text-xs text-emerald-200/90 space-y-1">
                <span className="font-bold flex items-center gap-1 text-[11px] text-emerald-300">
                  <Info className="w-3.5 h-3.5" /> Entenda em termos simples:
                </span>
                <p className="text-[11px] text-slate-300 leading-relaxed">{terminology.cfm.simple}</p>
              </div>
            </div>

            {/* Card 3: Geo-Shield */}
            <div 
              onMouseEnter={() => setActiveTooltip('geo')}
              onMouseLeave={() => setActiveTooltip(null)}
              onClick={() => setActiveTooltip(activeTooltip === 'geo' ? null : 'geo')}
              className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-amber-500/50 transition-all cursor-pointer space-y-3 relative group"
            >
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                  <MapPin className="w-5 h-5" />
                </div>
                <span className="text-[10px] text-amber-400 font-bold uppercase bg-amber-500/10 px-2 py-0.5 rounded-full">
                  Add-on Opcional
                </span>
              </div>
              <h3 className="text-sm font-bold text-white">{terminology.geo.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Calcula a distância física entre o posto de trabalho do empregado e a clínica que emitiu o atestado.
              </p>
              
              <div className="p-3 rounded-xl bg-slate-950 border border-amber-500/30 text-xs text-amber-200/90 space-y-1">
                <span className="font-bold flex items-center gap-1 text-[11px] text-amber-300">
                  <Info className="w-3.5 h-3.5" /> Entenda em termos simples:
                </span>
                <p className="text-[11px] text-slate-300 leading-relaxed">{terminology.geo.simple}</p>
              </div>
            </div>

            {/* Card 4: Checagem de Datas */}
            <div 
              onMouseEnter={() => setActiveTooltip('dates')}
              onMouseLeave={() => setActiveTooltip(null)}
              onClick={() => setActiveTooltip(activeTooltip === 'dates' ? null : 'dates')}
              className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-sky-500/50 transition-all cursor-pointer space-y-3 relative group"
            >
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center">
                  <Clock className="w-5 h-5" />
                </div>
                <span className="text-[10px] text-sky-400 font-bold uppercase bg-sky-500/10 px-2 py-0.5 rounded-full">
                  Cronologia & CCT
                </span>
              </div>
              <h3 className="text-sm font-bold text-white">{terminology.dates.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Identifica atestados pré-datados para o futuro e submissões fora do prazo da convenção da categoria.
              </p>
              
              <div className="p-3 rounded-xl bg-slate-950 border border-sky-500/30 text-xs text-sky-200/90 space-y-1">
                <span className="font-bold flex items-center gap-1 text-[11px] text-sky-300">
                  <Info className="w-3.5 h-3.5" /> Entenda em termos simples:
                </span>
                <p className="text-[11px] text-slate-300 leading-relaxed">{terminology.dates.simple}</p>
              </div>
            </div>

            {/* Card 5: Dossiê para B.O. */}
            <div 
              onMouseEnter={() => setActiveTooltip('dossier')}
              onMouseLeave={() => setActiveTooltip(null)}
              onClick={() => setActiveTooltip(activeTooltip === 'dossier' ? null : 'dossier')}
              className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-emerald-500/50 transition-all cursor-pointer space-y-3 relative group"
            >
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <span className="text-[10px] text-emerald-400 font-bold uppercase bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  Add-on Pericial
                </span>
              </div>
              <h3 className="text-sm font-bold text-white">{terminology.dossier.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Laudo pericial com carimbo de tempo ICP-Brasil e hash imutável pronto para delegacia e processo.
              </p>
              
              <div className="p-3 rounded-xl bg-slate-950 border border-emerald-500/30 text-xs text-emerald-200/90 space-y-1">
                <span className="font-bold flex items-center gap-1 text-[11px] text-emerald-300">
                  <Info className="w-3.5 h-3.5" /> Entenda em termos simples:
                </span>
                <p className="text-[11px] text-slate-300 leading-relaxed">{terminology.dossier.simple}</p>
              </div>
            </div>

            {/* Card 6: Diligência Formal CFM */}
            <div 
              onMouseEnter={() => setActiveTooltip('inquiry')}
              onMouseLeave={() => setActiveTooltip(null)}
              onClick={() => setActiveTooltip(activeTooltip === 'inquiry' ? null : 'inquiry')}
              className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-teal-500/50 transition-all cursor-pointer space-y-3 relative group"
            >
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center">
                  <Send className="w-5 h-5" />
                </div>
                <span className="text-[10px] text-teal-400 font-bold uppercase bg-teal-500/10 px-2 py-0.5 rounded-full">
                  Ofício 1-Clique
                </span>
              </div>
              <h3 className="text-sm font-bold text-white">{terminology.inquiry.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Conferência direta com a clínica respaldada pela Resolução CFM 1.658/2002.
              </p>
              
              <div className="p-3 rounded-xl bg-slate-950 border border-teal-500/30 text-xs text-teal-200/90 space-y-1">
                <span className="font-bold flex items-center gap-1 text-[11px] text-teal-300">
                  <Info className="w-3.5 h-3.5" /> Entenda em termos simples:
                </span>
                <p className="text-[11px] text-slate-300 leading-relaxed">{terminology.inquiry.simple}</p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 5. COMO FUNCIONA (PASSO A PASSO DESCOMPLICADO) */}
      <section id="como-funciona" className="py-14 px-4 sm:px-6 lg:px-8 border-b border-slate-800/60 bg-slate-950/40">
        <div className="max-w-7xl mx-auto space-y-10">
          
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Sem Instalar Nada</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">Como Funciona na Prática?</h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Você não precisa baixar programas pesados nem fazer integrações demoradas:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-400 font-black text-lg flex items-center justify-center mx-auto">
                1
              </div>
              <h3 className="text-base font-bold text-white">Envie o Documento</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Basta encaminhar o arquivo em PDF ou a foto do atestado diretamente para o número de WhatsApp do Vurio.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 font-black text-lg flex items-center justify-center mx-auto">
                2
              </div>
              <h3 className="text-base font-bold text-white">Auditoria Instantânea</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Em menos de 3 segundos, nossos motores periciais checam a assinatura do arquivo, o CFM do médico e as regras da empresa.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-teal-500/10 text-teal-400 font-black text-lg flex items-center justify-center mx-auto">
                3
              </div>
              <h3 className="text-base font-bold text-white">Receba o Parecer Técnico</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Você recebe uma mensagem clara dizendo se o documento está em conformidade ou com sugestões amigáveis para averiguação do DP.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5.5. DEGUSTAÇÃO CORPORATIVA: 15 AUDITORIAS GRATUITAS & RESPALDO EXECUTIVO */}
      <section id="degustacao-gratis" className="py-16 px-4 sm:px-6 lg:px-8 border-b border-slate-800/60 bg-gradient-to-b from-slate-900/90 via-slate-950 to-slate-900/60 relative overflow-hidden">
        <div className="max-w-5xl mx-auto space-y-10">
          
          <div className="text-center space-y-3 max-w-3xl mx-auto">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-sky-500/15 border border-sky-500/30 text-sky-300 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Degustação Corporativa Sem Compromisso</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
              Suas primeiras <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-teal-300 to-emerald-400">15 auditorias</span> são por nossa conta
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Teste o Vurio na prática com os atestados reais da sua empresa. Sem pedir cartão de crédito, sem contratos engessados e com resposta imediata.
            </p>
          </div>

          {/* O Diferencial: E se todos os atestados forem 100% autênticos? */}
          <div className="p-8 rounded-3xl bg-slate-950/80 border border-slate-800 space-y-6 shadow-2xl relative">
            <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-800 pb-5 gap-3">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">A Pergunta Mais Inteligente do RH:</span>
                <h3 className="text-lg sm:text-xl font-bold text-white mt-1">
                  "E se todos os meus 15 atestados forem autênticos? Qual o valor disso para a empresa?"
                </h3>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-xs font-semibold whitespace-nowrap self-start md:self-auto">
                ✓ Respaldo & Compliance
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              O objetivo do Vurio não é apenas identificar inconsistências. <strong>Nosso maior valor é gerar o Laudo Pericial de Conformidade que blinda o Departamento Pessoal e a Diretoria:</strong>
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center font-bold">
                  👔
                </div>
                <h4 className="font-bold text-white text-sm">Respaldo perante a Diretoria</h4>
                <p className="text-slate-400 leading-relaxed text-[11px]">
                  O DP apresenta relatórios mensais comprovando que cada dia abonado na folha foi oficialmente checado na ICP-Brasil e no CFM, justificando os salários pagos com governança irretocável.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
                  ⚖️
                </div>
                <h4 className="font-bold text-white text-sm">Blindagem no eSocial e MTE</h4>
                <p className="text-slate-400 leading-relaxed text-[11px]">
                  Em caso de fiscalização trabalhista ou previdenciária, sua empresa possui certidões digitais com código hash SHA-256 inalterável, evitando multas e glosas do eSocial.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold">
                  🤝
                </div>
                <h4 className="font-bold text-white text-sm">Segurança Jurídica para o DP</h4>
                <p className="text-slate-400 leading-relaxed text-[11px]">
                  Elimina o medo e a insegurança do analista de DP na hora de aprovar o abono. O gestor tem respaldo pericial formal para justificar decisões sem desgastes com os colaboradores.
                </p>
              </div>

            </div>

            {/* CTA da Degustação */}
            <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-slate-400">
                <p className="font-medium text-slate-300">Quer testar com sua equipe agora mesmo?</p>
                <p className="text-[11px]">Basta enviar uma mensagem no WhatsApp com a palavra <strong>DEGUSTACAO</strong>.</p>
              </div>

              <button
                onClick={() => alert('Para iniciar seu teste gratuito de 15 atestados, envie a palavra DEGUSTACAO no WhatsApp: (11) 99999-9999')}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-sky-500/20 transition-all flex items-center gap-2 whitespace-nowrap"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Ativar 15 Atestados Gratuitos</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 6. TABELA DE PREÇOS: CONSULTA AVULSA (R$ 10) & PLANOS */}
      <section id="precos" className="py-16 px-4 sm:px-6 lg:px-8 border-b border-slate-800/60">
        <div className="max-w-7xl mx-auto space-y-10">
          
          <div className="text-center space-y-2 max-w-3xl mx-auto">
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Sem Surpresas</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Planos Transparentes para Qualquer Tamanho</h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Escolha entre a Consulta Avulsa sob demanda (sem mensalidade) ou planos mensais para o seu Departamento Pessoal:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-stretch">
            
            {/* CARD 1: CONSULTA AVULSA (R$ 10,00) */}
            <div className="p-6 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-emerald-500/50 flex flex-col justify-between relative shadow-lg shadow-emerald-500/10">
              <span className="absolute -top-3 left-4 px-2.5 py-0.5 rounded-full bg-emerald-500 text-slate-950 text-[10px] font-black uppercase">
                Sem Mensalidade
              </span>

              <div className="space-y-3 pt-2">
                <h3 className="text-lg font-bold text-white">Consulta Avulsa</h3>
                <p className="text-xs text-slate-400">
                  Ideal para MEI, microempresa e donas de casa com 1 ou 2 funcionários.
                </p>
                <div>
                  <span className="text-3xl font-extrabold text-emerald-400">R$ 10,00</span>
                  <span className="text-xs text-slate-500 font-normal"> / consulta</span>
                </div>
                <ul className="space-y-2 text-xs text-slate-300 pt-3">
                  <li className="flex items-center"><Check className="w-3.5 h-3.5 text-emerald-400 mr-2" /> Validação ICP-Brasil na hora</li>
                  <li className="flex items-center"><Check className="w-3.5 h-3.5 text-emerald-400 mr-2" /> Checagem do CFM em 27 estados</li>
                  <li className="flex items-center"><Check className="w-3.5 h-3.5 text-emerald-400 mr-2" /> Conferência de datas futuras</li>
                  <li className="flex items-center"><Check className="w-3.5 h-3.5 text-emerald-400 mr-2" /> Laudo enviado no seu WhatsApp</li>
                  <li className="flex items-center text-amber-300/90 font-medium"><MapPin className="w-3.5 h-3.5 text-amber-400 mr-2" /> Opcional: + R$ 3 com Geo-Shield</li>
                </ul>
              </div>

              <div className="pt-6 space-y-2">
                <a
                  href="https://checkout.infinitepay.io/solucione-0s1/gfp8843-consulta-avulsa---auditoria-de-atestado-me"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow text-center block"
                >
                  Consultar por R$ 10 (PIX / Cartão)
                </a>
                <a
                  href="https://checkout.infinitepay.io/solucione-0s1/mqf4359-consulta-avulsa-completa-geo-shield-distan"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-xl text-[11px] font-semibold transition-all text-center block border border-amber-500/30"
                >
                  Combo com Geo-Shield (R$ 13)
                </a>
              </div>
            </div>

            {/* CARD 2: STARTER RH */}
            <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition-all">
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-white">Starter RH</h3>
                <p className="text-xs text-slate-400">
                  Para empresas com até 30 funcionários.
                </p>
                <div>
                  <span className="text-3xl font-extrabold text-white">R$ 149</span>
                  <span className="text-xs text-slate-500 font-normal"> / mês</span>
                </div>
                <ul className="space-y-2 text-xs text-slate-300 pt-3">
                  <li className="flex items-center"><Check className="w-3.5 h-3.5 text-emerald-400 mr-2" /> Até 30 validações no mês</li>
                  <li className="flex items-center"><Check className="w-3.5 h-3.5 text-emerald-400 mr-2" /> WhatsApp corporativo integrado</li>
                  <li className="flex items-center"><Check className="w-3.5 h-3.5 text-emerald-400 mr-2" /> Acesso ao Painel do Cliente</li>
                  <li className="flex items-center"><Check className="w-3.5 h-3.5 text-emerald-400 mr-2" /> Suporte prioritário</li>
                </ul>
              </div>

              <div className="pt-6">
                <a
                  href="https://api.whatsapp.com/send?text=Ol%C3%A1!%20Quero%20assinar%20o%20Plano%20Starter%20RH%20(R$%20149/m%C3%AAs)%20do%20Vurio"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all text-center block"
                >
                  Assinar Starter
                </a>
              </div>
            </div>

            {/* CARD 3: COMPLIANCE PRO */}
            <div className="p-6 rounded-2xl bg-gradient-to-b from-sky-950/40 via-slate-900 to-slate-950 border-2 border-sky-500/60 flex flex-col justify-between relative shadow-xl shadow-sky-500/10">
              <span className="absolute -top-3 left-4 px-2.5 py-0.5 rounded-full bg-sky-500 text-slate-950 text-[10px] font-black uppercase">
                Mais Escolhido
              </span>

              <div className="space-y-3 pt-2">
                <h3 className="text-lg font-bold text-white">Compliance Pro</h3>
                <p className="text-xs text-slate-300">
                  Para empresas de 50 a 300 funcionários com alta rotatividade.
                </p>
                <div>
                  <span className="text-3xl font-extrabold text-sky-400">R$ 399</span>
                  <span className="text-xs text-slate-500 font-normal"> / mês</span>
                </div>
                <ul className="space-y-2 text-xs text-slate-200 pt-3">
                  <li className="flex items-center"><Check className="w-3.5 h-3.5 text-emerald-400 mr-2" /> <strong>100 validações mensais</strong></li>
                  <li className="flex items-center"><Check className="w-3.5 h-3.5 text-emerald-400 mr-2" /> <strong>Diligências com clínicas ilimitadas</strong></li>
                  <li className="flex items-center"><Check className="w-3.5 h-3.5 text-emerald-400 mr-2" /> Rollover de atestados por 60 dias</li>
                  <li className="flex items-center"><Check className="w-3.5 h-3.5 text-emerald-400 mr-2" /> Relatório de passivo financeiro</li>
                </ul>
              </div>

              <div className="pt-6">
                <a
                  href="https://api.whatsapp.com/send?text=Ol%C3%A1!%20Quero%20assinar%20o%20Plano%20Compliance%20Pro%20(R$%20399/m%C3%AAs)%20do%20Vurio"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-sky-600/30 text-center block"
                >
                  Assinar Pro
                </a>
              </div>
            </div>

            {/* CARD 4: ENTERPRISE */}
            <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition-all">
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-white">Enterprise</h3>
                <p className="text-xs text-slate-400">
                  Grandes indústrias, redes de varejo e hospitais.
                </p>
                <div>
                  <span className="text-3xl font-extrabold text-white">Sob Medida</span>
                </div>
                <ul className="space-y-2 text-xs text-slate-300 pt-3">
                  <li className="flex items-center"><Check className="w-3.5 h-3.5 text-emerald-400 mr-2" /> 1.000+ validações mensais</li>
                  <li className="flex items-center"><Check className="w-3.5 h-3.5 text-emerald-400 mr-2" /> Integração com ERP (TOTVS, Senior) ou exportação em lote</li>
                  <li className="flex items-center"><Check className="w-3.5 h-3.5 text-emerald-400 mr-2" /> Conexão com o canal de WhatsApp da sua própria empresa</li>
                  <li className="flex items-center"><Check className="w-3.5 h-3.5 text-emerald-400 mr-2" /> Gerente de conta e SLA prioritário</li>
                </ul>
              </div>

              <div className="pt-6">
                <a
                  href="https://api.whatsapp.com/send?text=Ol%C3%A1!%20Gostaria%20de%20uma%20proposta%20do%20Plano%20Enterprise%20do%20Vurio"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all text-center block"
                >
                  Falar com Consultor
                </a>
              </div>
            </div>

          </div>

          {/* VITRINE DE PRODUTOS ADICIONAIS (ADD-ONS INDEPENDENTES) */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 border border-amber-500/30 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-3 gap-2">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <h3 className="text-base font-bold text-white">Produtos Adicionais (Add-ons Independentes)</h3>
              </div>
              <span className="text-xs text-amber-300/80 font-medium">Contrate avulso ou agregue a qualquer plano</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              {/* Add-on 1: Geo-Shield */}
              <div className="p-4 bg-slate-950/80 rounded-xl border border-amber-500/30 space-y-3 relative flex flex-col justify-between">
                <div>
                  <span className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[9px] font-bold border border-amber-500/30 uppercase">
                    Add-on Opcional
                  </span>
                  <div className="flex items-center justify-between pt-1">
                    <span className="font-bold text-amber-300 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> Geo-Shield</span>
                    <div className="text-right">
                      <span className="font-extrabold text-white text-sm">R$ 49/mês</span>
                      <span className="block text-[10px] text-slate-400">ou +R$ 3 na consulta avulsa</span>
                    </div>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed mt-2">
                    Auditoria de rota e distância geográfica entre o posto de trabalho/moradia e a clínica do atestado. Identifica incompatibilidades de deslocamento (ex: Santos x Ribeirão Preto) amparado no Art. 482 da CLT.
                  </p>
                </div>
                <a
                  href="https://checkout.infinitepay.io/solucione-0s1/mqf4359-consulta-avulsa-completa-geo-shield-distan"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-lg text-[11px] font-bold transition-all text-center block border border-amber-500/40"
                >
                  Contratar com Geo-Shield (R$ 13)
                </a>
              </div>

              {/* Add-on 2: Doctor Shield & Dossiê B.O. */}
              <div className="p-4 bg-slate-950/80 rounded-xl border border-emerald-500/30 space-y-3 relative flex flex-col justify-between">
                <div>
                  <span className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[9px] font-bold border border-emerald-500/30 uppercase">
                    Add-on Pericial
                  </span>
                  <div className="flex items-center justify-between pt-1">
                    <span className="font-bold text-emerald-300 flex items-center gap-1.5"><Stethoscope className="w-3.5 h-3.5" /> Dossiê Jurídico & B.O.</span>
                    <div className="text-right">
                      <span className="font-extrabold text-white text-sm">R$ 89 avulso</span>
                      <span className="block text-[10px] text-emerald-400">R$ 49 se assinante</span>
                    </div>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed mt-2">
                    Certidão pericial completa com hash SHA-256 inalterável, carimbo de tempo ICP-Brasil e histórico de incidentes do CRM, formatada para abertura direta de Notícia-Crime na Polícia Civil e justa causa trabalhista.
                  </p>
                </div>
                <a
                  href="https://checkout.infinitepay.io/solucione-0s1/sao7695-dossie-noticia-crime-para-bo-policial"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded-lg text-[11px] font-bold transition-all text-center block border border-emerald-500/40"
                >
                  Emitir Dossiê B.O. (R$ 89)
                </a>
              </div>

              {/* Add-on 3: Diligência Formal CFM */}
              <div className="p-4 bg-slate-950/80 rounded-xl border border-sky-500/30 space-y-3 relative flex flex-col justify-between">
                <div>
                  <span className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 text-[9px] font-bold border border-sky-500/30 uppercase">
                    Add-on 1-Clique
                  </span>
                  <div className="flex items-center justify-between pt-1">
                    <span className="font-bold text-sky-300 flex items-center gap-1.5"><Scale className="w-3.5 h-3.5" /> Diligência Formal CFM</span>
                    <div className="text-right">
                      <span className="font-extrabold text-white text-sm">R$ 15 / ofício</span>
                      <span className="block text-[10px] text-emerald-400">Ilimitado no Pro</span>
                    </div>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed mt-2">
                    Emissão e envio automático de ofício administrativo respaldado na Resolução CFM 1.658/2002 para confirmação de atendimento diretamente com a secretaria do consultório ou hospital.
                  </p>
                </div>
                <a
                  href="https://checkout.infinitepay.io/solucione-0s1/xnv1997-diligencia-formal-cfm-oficio-1-clique"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-1.5 bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 rounded-lg text-[11px] font-bold transition-all text-center block border border-sky-500/40"
                >
                  Disparar Diligência (R$ 15)
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. PERGUNTAS FREQUENTES EM LINGUAGEM HUMANA (FAQ) */}
      <section id="perguntas-frequentes" className="py-14 px-4 sm:px-6 lg:px-8 border-b border-slate-800/60 bg-slate-950/40">
        <div className="max-w-4xl mx-auto space-y-8">
          
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-white">Dúvidas Frequentes</h2>
            <p className="text-xs sm:text-sm text-slate-400">Respostas diretas e sem juridiquês:</p>
          </div>

          <div className="space-y-4 text-xs sm:text-sm">
            
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
              <h4 className="font-bold text-white flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-sky-400" />
                Preciso instalar algum aplicativo no computador ou celular?
              </h4>
              <p className="text-slate-300 leading-relaxed pl-6">
                Não! Você pode usar o Vurio 100% pelo WhatsApp ou diretamente pelo navegador web. Não requer nenhuma instalação.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
              <h4 className="font-bold text-white flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-sky-400" />
                Posso enviar uma foto de papel tirada pela câmera do celular?
              </h4>
              <p className="text-slate-300 leading-relaxed pl-6">
                Sim! Nosso sistema lê a imagem, reconhece o carimbo do médico, checa o CRM no Conselho de Medicina e confere a data do atendimento.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
              <h4 className="font-bold text-white flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-sky-400" />
                O que o sistema faz se o atestado tiver divergência de dados?
              </h4>
              <p className="text-slate-300 leading-relaxed pl-6">
                O Vurio <strong>não acusa ninguém</strong> de fraude. Emitimos um laudo pericial neutro apontando a inconsistência (como divergência de dígitos no CPF ou emissão em outra cidade) e orientando o DP a fazer uma checagem amigável com o colaborador.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
              <h4 className="font-bold text-white flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-sky-400" />
                Como funciona a Consulta Avulsa de R$ 10,00?
              </h4>
              <p className="text-slate-300 leading-relaxed pl-6">
                Você envia o atestado para o nosso WhatsApp, recebe a confirmação dos dados e paga os R$ 10 via chave PIX gerada na hora. O laudo pericial sai imediatamente no seu chat.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* 8. FOOTER EXECUTIVO COM RESPALDO LEGAL */}
      <footer className="bg-slate-950 py-10 px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-500 space-y-3">
        <div className="flex items-center justify-center space-x-2 text-slate-400 font-medium">
          <ShieldCheck className="w-4 h-4 text-sky-400" />
          <span>Vurio Compliance & Perícia Digital LTDA</span>
        </div>
        <p className="max-w-2xl mx-auto text-[11px] leading-relaxed text-slate-500">
          Respaldo legal: Medida Provisória nº 2.200-2/2001 (ICP-Brasil), Lei 14.510/2023 (Telemedicina), Resoluções CFM 1.658/2002 e 2.299/2021, Art. 482 da CLT e LGPD (Lei 13.709/2018).
        </p>
        <p className="text-[10px] text-slate-600">
          © 2026 Vurio. Todos os direitos reservados.
        </p>
      </footer>

    </div>
  );
}
