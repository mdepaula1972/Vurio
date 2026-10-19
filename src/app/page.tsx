'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  UtensilsCrossed, 
  QrCode, 
  Zap, 
  CreditCard, 
  ChefHat, 
  ShieldCheck, 
  ArrowRight, 
  Sparkles, 
  Clock, 
  DollarSign, 
  Smartphone, 
  CheckCircle2, 
  BellRing, 
  ExternalLink, 
  Layers, 
  TrendingUp, 
  Check, 
  ChevronRight,
  Menu,
  X,
  Volume2
} from 'lucide-react';

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#040c18] text-slate-100 selection:bg-[#02c1db] selection:text-[#040c18]">
      {/* GLOW BACKGROUND EFFECT */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[550px] bg-gradient-to-b from-[#02c1db]/15 via-[#0077d1]/10 to-transparent blur-[140px] rounded-full" />
        <div className="absolute top-[600px] right-0 w-[500px] h-[500px] bg-[#01cf9e]/10 blur-[150px] rounded-full" />
        <div className="absolute bottom-10 left-0 w-[600px] h-[600px] bg-[#0077d1]/10 blur-[160px] rounded-full" />
      </div>

      {/* NAVBAR */}
      <header className="sticky top-0 z-50 bg-[#040c18]/85 backdrop-blur-md border-b border-[#02c1db]/15">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* LOGO */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="h-11 w-11 rounded-2xl bg-gradient-to-tr from-[#0077d1] via-[#02c1db] to-[#01cf9e] p-0.5 shadow-lg shadow-[#02c1db]/20 transition-transform group-hover:scale-105">
              <div className="h-full w-full bg-[#040c18] rounded-[14px] flex items-center justify-center">
                <UtensilsCrossed className="w-6 h-6 text-[#02c1db]" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-xl tracking-wider text-white">VURIO</span>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-[#02c1db]/15 text-[#02c1db] border border-[#02c1db]/30 rounded-full uppercase tracking-wider">
                  Garçom IA
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">Autoatendimento & Caixa Autônomo</p>
            </div>
          </Link>

          {/* DESKTOP NAV ATALHOS */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#diferenciais" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
              Diferenciais
            </a>
            <a href="#como-funciona" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
              Como Funciona
            </a>
            <a href="#comparativo" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
              Comparativo
            </a>
            <Link 
              href="/admin" 
              className="text-sm font-medium text-cyan-300 hover:text-cyan-200 transition-colors flex items-center gap-1.5"
            >
              <Layers className="w-4 h-4" />
              <span>Painel Gerente / Caixa</span>
            </Link>
            <Link 
              href="/kitchen" 
              className="text-sm font-medium text-orange-400 hover:text-orange-300 transition-colors flex items-center gap-1.5"
            >
              <ChefHat className="w-4 h-4" />
              <span>Cozinha (KDS)</span>
            </Link>
          </nav>

          {/* CTA PRINCIPAL */}
          <div className="hidden sm:flex items-center gap-3">
            <Link
              href="/chat?establishment=exemplo&table=1"
              target="_blank"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#0077d1] via-[#02c1db] to-[#01cf9e] text-[#040c18] font-bold text-xs uppercase tracking-wider shadow-lg shadow-[#02c1db]/25 hover:shadow-[#02c1db]/40 hover:scale-[1.02] transition-all"
            >
              <QrCode className="w-4 h-4" />
              <span>Simular Mesa de Teste</span>
            </Link>
          </div>

          {/* MOBILE MENU BUTTON */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-slate-400 hover:text-white bg-white/5 border border-white/10"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* MOBILE MENU DROPDOWN */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#05162e] border-b border-[#02c1db]/20 px-4 py-6 space-y-4">
            <a 
              href="#diferenciais" 
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-medium text-slate-200 py-1"
            >
              Diferenciais
            </a>
            <a 
              href="#como-funciona" 
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-medium text-slate-200 py-1"
            >
              Como Funciona
            </a>
            <a 
              href="#comparativo" 
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-medium text-slate-200 py-1"
            >
              Comparativo
            </a>
            <div className="pt-3 border-t border-white/10 space-y-2">
              <Link 
                href="/admin" 
                className="flex items-center gap-2 p-2.5 rounded-xl bg-[#082855] text-cyan-300 text-sm font-medium"
              >
                <Layers className="w-4 h-4" />
                <span>Painel do Gerente / Caixa</span>
              </Link>
              <Link 
                href="/kitchen" 
                className="flex items-center gap-2 p-2.5 rounded-xl bg-orange-950/40 text-orange-300 text-sm font-medium border border-orange-500/20"
              >
                <ChefHat className="w-4 h-4" />
                <span>Tela da Cozinha (KDS)</span>
              </Link>
              <Link 
                href="/chat?establishment=exemplo&table=1" 
                target="_blank"
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#02c1db] text-[#040c18] font-bold text-sm shadow-lg shadow-[#02c1db]/20"
              >
                <QrCode className="w-4 h-4" />
                <span>Simular Mesa de Teste (QR Code)</span>
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* HERO SECTION */}
      <section className="relative z-10 pt-16 pb-24 lg:pt-28 lg:pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* LADO ESQUERDO: COPYWRITING DE ALTA CONVERSÃO */}
          <div className="lg:col-span-7 space-y-8 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#082855]/70 border border-[#02c1db]/30 text-[#02c1db] text-xs font-semibold backdrop-blur-md shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-[#01cf9e]" />
              <span>O Novo Padrão Operacional para Restaurantes e Bares</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.12]">
              O fim do gargalo de atendimento e da{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#02c1db] via-cyan-300 to-[#01cf9e]">
                espera pela maquininha
              </span>{' '}
              no seu bar ou restaurante.
            </h1>

            <p className="text-base sm:text-xl text-slate-300 max-w-2xl mx-auto lg:mx-0 font-normal leading-relaxed">
              Autoatendimento na mesa via <strong>QR Code sem exigir totens caros ou downloads</strong>. Pedidos direto para a cozinha e fechamento autônomo com Pix ou maquininha.
            </p>

            {/* BOTÕES DE AÇÃO HERO */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              <Link
                href="/chat?establishment=exemplo&table=1"
                target="_blank"
                className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-[#0077d1] via-[#02c1db] to-[#01cf9e] text-[#040c18] font-black text-sm uppercase tracking-wider shadow-xl shadow-[#02c1db]/30 hover:shadow-[#02c1db]/50 hover:scale-[1.03] transition-all"
              >
                <QrCode className="w-5 h-5 text-[#040c18]" />
                <span>Simular Mesa de Teste</span>
                <ArrowRight className="w-4 h-4 text-[#040c18]" />
              </Link>

              <Link
                href="/admin"
                className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-6 py-4 rounded-2xl bg-[#082855]/70 hover:bg-[#082855] border border-[#02c1db]/25 text-white font-bold text-sm backdrop-blur-md transition-colors"
              >
                <Layers className="w-4 h-4 text-[#02c1db]" />
                <span>Painel Gerente / Caixa</span>
              </Link>
            </div>

            {/* SELOS DE CONFIANÇA */}
            <div className="pt-6 border-t border-white/10 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#01cf9e]" />
                <span>Zero Instalação de Hardware</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#01cf9e]" />
                <span>Pix Direto na Conta do Dono</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#01cf9e]" />
                <span>Sem Bloqueio de Cadastro / CPF</span>
              </div>
            </div>
          </div>

          {/* LADO DIREITO: MOCKUP INTERATIVO DA MESA (CHAT ZERO ATRITO) */}
          <div className="lg:col-span-5 relative flex justify-center">
            {/* AMBIENTAÇÃO VISUAL */}
            <div className="w-full max-w-sm rounded-[36px] p-4 bg-gradient-to-b from-[#082855] via-[#040c18] to-[#051d44] border-2 border-[#02c1db]/30 shadow-2xl shadow-[#02c1db]/20 relative">
              {/* ALTO-FALANTE DO SMARTPHONE */}
              <div className="w-24 h-4 bg-slate-900 rounded-full mx-auto mb-3 flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-slate-800" />
              </div>

              {/* TELA INTERNA DO CELULAR */}
              <div className="rounded-[28px] bg-[#040c18] border border-white/10 overflow-hidden flex flex-col h-[520px]">
                {/* TOPO DO CHAT DA MESA */}
                <div className="px-4 py-3 bg-[#051d44] border-b border-[#02c1db]/20 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#02c1db]/20 flex items-center justify-center text-[#02c1db]">
                      <UtensilsCrossed className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-1">
                        <span>Vurio Gastrobar</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-[#01cf9e]" />
                      </div>
                      <div className="text-[10px] text-cyan-300">Mesa 4 • Entrada Zero Fila</div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-[#01cf9e]/15 text-[#01cf9e] text-[9px] font-bold border border-[#01cf9e]/30">
                    Ao Vivo
                  </span>
                </div>

                {/* HISTÓRICO DE MENSAGENS SIMULADO */}
                <div className="flex-1 p-3 space-y-2.5 overflow-hidden text-xs">
                  {/* BALÃO BOT */}
                  <div className="p-3 rounded-2xl rounded-tl-none bg-[#082855]/70 border border-[#02c1db]/20 text-slate-200">
                    Olá! Bem-vindo à <strong>Mesa 4</strong>. Veja nosso cardápio ou me peça pratos e bebidas!
                  </div>

                  {/* BALÃO CLIENTE */}
                  <div className="p-2.5 rounded-2xl rounded-tr-none bg-gradient-to-r from-[#0077d1] to-[#0295b8] text-white ml-auto max-w-[80%]">
                    Me vê 2 Chopps IPA e 1 Batata Rústica
                  </div>

                  {/* BALÃO BOT CONFIRMANDO PEDIDO */}
                  <div className="p-2.5 rounded-2xl rounded-tl-none bg-[#082855]/70 border border-[#02c1db]/20 text-slate-200">
                    <div className="flex items-center gap-1 text-emerald-400 font-bold mb-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Pedido enviado para a cozinha!</span>
                    </div>
                    • 2x Chopp IPA 500ml<br />
                    • 1x Batata Rústica com Alecrim
                  </div>

                  {/* BALÃO CLIENTE PEDINDO A CONTA */}
                  <div className="p-2.5 rounded-2xl rounded-tr-none bg-gradient-to-r from-[#0077d1] to-[#0295b8] text-white ml-auto max-w-[80%]">
                    Quero pagar no Pix
                  </div>

                  {/* BALÃO BOT FECHAMENTO PIX */}
                  <div className="p-3 rounded-2xl rounded-tl-none bg-[#172b14] border border-emerald-500/40 text-emerald-100 space-y-1.5 shadow-md">
                    <div className="flex items-center justify-between font-bold text-emerald-400">
                      <span>⚡ Fechamento via Pix</span>
                      <span className="font-mono text-sm text-white font-black">R$ 62,00</span>
                    </div>
                    <div className="text-[10px] text-slate-300">
                      Favorecido: <strong>Vurio Alimentos Ltda</strong><br />
                      Chave CNPJ: <code className="text-cyan-300">12.345.678/0001-90</code>
                    </div>
                    <div className="pt-1">
                      <div className="w-full py-1.5 bg-emerald-500 text-slate-950 font-black rounded-lg text-[10px] text-center shadow-md">
                        Copiar Código Pix Copia-e-Cola
                      </div>
                    </div>
                  </div>
                </div>

                {/* BOTÕES RÁPIDOS MOCKUP */}
                <div className="p-2 bg-[#051d44] border-t border-white/5 flex gap-1.5">
                  <span className="px-2 py-1 bg-white/5 rounded-md text-[10px] text-slate-300">📋 Cardápio</span>
                  <span className="px-2 py-1 bg-white/5 rounded-md text-[10px] text-slate-300">🧾 Parcial</span>
                  <span className="px-2 py-1 bg-emerald-950/60 text-emerald-300 rounded-md text-[10px] border border-emerald-500/30">⚡ Pix</span>
                  <span className="px-2 py-1 bg-amber-950/60 text-amber-300 rounded-md text-[10px] border border-amber-500/30">💳 Cartão</span>
                </div>
              </div>
            </div>

            {/* BADGE FLUTUANTE DE VELOCIDADE */}
            <div className="absolute -bottom-5 -right-2 sm:-right-6 p-4 rounded-2xl bg-[#05162e]/95 border border-[#02c1db]/30 backdrop-blur-xl shadow-2xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#01cf9e]/20 text-[#01cf9e] flex items-center justify-center font-bold">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">+35% Giro de Mesa</div>
                <div className="text-[11px] text-slate-400">Zero espera na hora de pagar</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SEÇÃO 2: OS 4 DIFERENCIAIS DE VALOR */}
      <section id="diferenciais" className="py-20 bg-[#020813]/60 border-y border-[#02c1db]/10 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#02c1db]">
              Arquitetura de Atendimento Autônomo
            </h2>
            <p className="text-2xl sm:text-4xl font-extrabold text-white">
              Por que bares e restaurantes modernos estão eliminando os totens e o atraso no salão?
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* CARD 1 */}
            <div className="p-6 rounded-2xl bg-[#082855]/30 border border-[#02c1db]/15 backdrop-blur-md hover:border-[#02c1db]/40 transition-all flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <Smartphone className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Zero Atrito de Instalação</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Nada de totens caros de R$ 8.000 ou tablets que quebram na mesa. O cliente lê o QR Code direto no celular dele e é atendido imediatamente, sem baixar aplicativo nem digitar CPF.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-white/5 text-[11px] font-semibold text-cyan-300 flex items-center gap-1">
                <span>Leitura instantânea de QR Code</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* CARD 2 */}
            <div className="p-6 rounded-2xl bg-[#082855]/30 border border-[#02c1db]/15 backdrop-blur-md hover:border-[#02c1db]/40 transition-all flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <Zap className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Fechamento Autônomo</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  O cliente pede a conta no próprio chat e paga via <strong>Pix Copia-e-Cola</strong> direto na conta bancária do seu estabelecimento, ou chama o garçom com a maquininha com apenas 1 clique.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-white/5 text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
                <span>Liberação imediata no caixa</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* CARD 3 */}
            <div className="p-6 rounded-2xl bg-[#082855]/30 border border-[#02c1db]/15 backdrop-blur-md hover:border-[#02c1db]/40 transition-all flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <ChefHat className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">KDS Integrado e Inteligente</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Tela da cozinha em tempo real com <strong>alerta sonoro harmônico (Web Audio API)</strong> a cada novo pedido e sinalização vermelha imediata caso a mesa solicite a conta ou seja liberada.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-white/5 text-[11px] font-semibold text-orange-400 flex items-center gap-1">
                <span>Zero desperdício de pratos</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* CARD 4 */}
            <div className="p-6 rounded-2xl bg-[#082855]/30 border border-[#02c1db]/15 backdrop-blur-md hover:border-[#02c1db]/40 transition-all flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Sem Custódia Financeira</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Não somos intermediadores financeiros e não cobramos porcentagem abusiva sobre as vendas. A chave Pix cadastrada é do próprio restaurante e o valor cai 100% livre na sua conta.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-white/5 text-[11px] font-semibold text-blue-400 flex items-center gap-1">
                <span>0% de taxa sobre o Pix</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SEÇÃO 3: COMO FUNCIONA EM 3 ETAPAS */}
      <section id="como-funciona" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-widest text-[#01cf9e]">Fluxo Operacional</h2>
          <p className="text-2xl sm:text-4xl font-extrabold text-white">
            Como o Vurio opera na prática da abertura ao fechamento
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-8 rounded-3xl bg-[#082855]/25 border border-white/10 relative">
            <span className="text-5xl font-black text-[#02c1db]/20 absolute top-6 right-6 font-mono">01</span>
            <div className="w-12 h-12 rounded-xl bg-[#02c1db]/15 text-[#02c1db] flex items-center justify-center font-bold text-lg mb-6">
              1
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Cliente lê o QR Code</h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              O cliente senta na mesa, aponta a câmera do celular para o QR Code e entra direto no chat com o cardápio e a mesa já identificada.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-[#082855]/25 border border-white/10 relative">
            <span className="text-5xl font-black text-[#02c1db]/20 absolute top-6 right-6 font-mono">02</span>
            <div className="w-12 h-12 rounded-xl bg-[#0077d1]/20 text-cyan-300 flex items-center justify-center font-bold text-lg mb-6">
              2
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Pedidos e KDS na Cozinha</h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              O assistente IA anota pedidos e tira dúvidas de ingredientes. Os itens são impressos ou aparecem no KDS da cozinha com alarme sonoro instantâneo.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-[#082855]/25 border border-white/10 relative">
            <span className="text-5xl font-black text-[#02c1db]/20 absolute top-6 right-6 font-mono">03</span>
            <div className="w-12 h-12 rounded-xl bg-[#01cf9e]/20 text-[#01cf9e] flex items-center justify-center font-bold text-lg mb-6">
              3
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Fechamento Autônomo</h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              Na hora de ir embora, o cliente digita "fechar a conta", confere o extrato, paga pelo Pix ou chama o garçom com a máquina. O caixa confirma com 1 toque.
            </p>
          </div>
        </div>
      </section>

      {/* SEÇÃO 4: COMPARATIVO (TRADICIONAL VS VURIO) */}
      <section id="comparativo" className="py-20 bg-[#020813]/80 border-t border-[#02c1db]/15 relative z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#02c1db]">Análise de Eficiência</h2>
            <p className="text-2xl sm:text-3xl font-black text-white">Modelo Tradicional vs. Modelo Vurio</p>
          </div>

          <div className="overflow-hidden rounded-3xl border border-[#02c1db]/25 shadow-2xl bg-[#05162e]/40 backdrop-blur-md">
            <div className="grid grid-cols-2 divide-x divide-white/10 text-sm">
              <div className="p-6 sm:p-8 bg-rose-950/20">
                <div className="text-rose-400 font-black text-base uppercase tracking-wider mb-6 flex items-center gap-2">
                  <span>❌ Modelo Tradicional com Gargalo</span>
                </div>
                <ul className="space-y-4 text-xs sm:text-sm text-slate-300">
                  <li className="flex items-start gap-2.5">
                    <span className="text-rose-400 font-bold">•</span>
                    <span>Cliente espera 15 min pelo garçom para pedir a conta no pico do almoço.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-rose-400 font-bold">•</span>
                    <span>Garçom vai ao caixa, imprime comprovante, volta, vai buscar a maquininha.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-rose-400 font-bold">•</span>
                    <span>Totens de autoatendimento custam R$ 6.000 a R$ 12.000 cada.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-rose-400 font-bold">•</span>
                    <span>Apps de cardápio exigem cadastro complexo, senha ou CPF obrigatório.</span>
                  </li>
                </ul>
              </div>

              <div className="p-6 sm:p-8 bg-[#082855]/40">
                <div className="text-[#01cf9e] font-black text-base uppercase tracking-wider mb-6 flex items-center gap-2">
                  <span>✨ Modelo Autônomo Vurio</span>
                </div>
                <ul className="space-y-4 text-xs sm:text-sm text-slate-200 font-medium">
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-[#01cf9e] flex-shrink-0 mt-0.5" />
                    <span>Fechamento em 30 segundos com chave Pix direta no chat da mesa.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-[#01cf9e] flex-shrink-0 mt-0.5" />
                    <span>Se preferir cartão, chama a maquineta com 1 clique e notifica o painel.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-[#01cf9e] flex-shrink-0 mt-0.5" />
                    <span>Custo zero de novos aparelhos: funciona em qualquer celular via QR Code.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-[#01cf9e] flex-shrink-0 mt-0.5" />
                    <span>Zero atrito de entrada: leitura de QR Code abre o cardápio no segundo 1.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SEÇÃO 5: BANNER DE CTA FINAL */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto relative z-10 text-center">
        <div className="p-10 sm:p-14 rounded-3xl bg-gradient-to-br from-[#082855] via-[#040c18] to-[#052d6b] border border-[#02c1db]/30 shadow-2xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#02c1db]/15 text-[#02c1db] text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Disponível Agora</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-black text-white">
            Experimente o Vurio no seu restaurante hoje mesmo.
          </h2>

          <p className="text-slate-300 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
            Abra a simulação em tempo real, acione o painel do caixa e veja como a cozinha recebe os pedidos instantaneamente.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="/chat?establishment=exemplo&table=1"
              target="_blank"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-[#0077d1] to-[#02c1db] text-[#040c18] font-black text-xs uppercase tracking-wider shadow-xl shadow-[#02c1db]/30 hover:scale-105 transition-all flex items-center justify-center gap-2"
            >
              <QrCode className="w-4 h-4 text-[#040c18]" />
              <span>Testar como Cliente (Mesa 1)</span>
            </Link>

            <Link
              href="/admin"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-[#082855] border border-white/10 text-white font-bold text-xs uppercase tracking-wider hover:bg-[#0b316d] transition-colors flex items-center justify-center gap-2"
            >
              <Layers className="w-4 h-4 text-cyan-300" />
              <span>Acessar Painel Admin / Caixa</span>
            </Link>

            <Link
              href="/kitchen"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-orange-950/50 border border-orange-500/30 text-orange-300 font-bold text-xs uppercase tracking-wider hover:bg-orange-900/40 transition-colors flex items-center justify-center gap-2"
            >
              <ChefHat className="w-4 h-4 text-orange-400" />
              <span>Ver KDS da Cozinha</span>
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#02060d] border-t border-white/5 py-12 px-4 sm:px-6 lg:px-8 text-xs text-slate-500 relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#0077d1] to-[#02c1db] p-0.5 flex items-center justify-center">
              <div className="w-full h-full bg-[#02060d] rounded-[10px] flex items-center justify-center">
                <UtensilsCrossed className="w-4 h-4 text-[#02c1db]" />
              </div>
            </div>
            <div>
              <div className="font-bold text-slate-300 text-sm">VURIO ATENDIMENTO</div>
              <div className="text-[11px] text-slate-500">Autoatendimento e Fechamento Autônomo de Mesas</div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-slate-400">
            <Link href="/admin" className="hover:text-white transition-colors">
              Painel Admin
            </Link>
            <Link href="/kitchen" className="hover:text-white transition-colors">
              KDS Cozinha
            </Link>
            <Link href="/chat?establishment=exemplo&table=1" className="hover:text-white transition-colors">
              Mesa de Demonstração
            </Link>
            <Link href="/termos" className="hover:text-white transition-colors">
              Termos de Uso & LGPD
            </Link>
          </div>

          <div className="text-center md:text-right">
            <div>© {new Date().getFullYear()} Vurio Tecnologia. Todos os direitos reservados.</div>
            <div className="text-[10px] text-slate-600 mt-0.5">Atendimento inteligente com zero atrito operacional.</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
