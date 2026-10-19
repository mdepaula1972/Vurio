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
  Volume2,
  MessageSquare,
  Phone,
  Video,
  MoreVertical,
  CheckCheck,
  Send,
  Mic
} from 'lucide-react';

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#040c18] text-slate-100 selection:bg-[#25D366] selection:text-[#040c18]">
      {/* GLOW BACKGROUND EFFECT */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[550px] bg-gradient-to-b from-[#25D366]/15 via-[#02c1db]/10 to-transparent blur-[140px] rounded-full" />
        <div className="absolute top-[600px] right-0 w-[500px] h-[500px] bg-[#01cf9e]/10 blur-[150px] rounded-full" />
        <div className="absolute bottom-10 left-0 w-[600px] h-[600px] bg-[#0077d1]/10 blur-[160px] rounded-full" />
      </div>

      {/* NAVBAR */}
      <header className="sticky top-0 z-50 bg-[#040c18]/85 backdrop-blur-md border-b border-[#02c1db]/15">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* LOGO COM PROTAGONISMO DO WHATSAPP */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="h-11 w-11 rounded-2xl bg-gradient-to-tr from-[#0077d1] via-[#02c1db] to-[#25D366] p-0.5 shadow-lg shadow-[#25D366]/20 transition-transform group-hover:scale-105">
              <div className="h-full w-full bg-[#040c18] rounded-[14px] flex items-center justify-center">
                <UtensilsCrossed className="w-6 h-6 text-[#25D366]" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-xl tracking-wider text-white">VURIO</span>
                <span className="text-[10px] font-bold px-2.5 py-0.5 bg-[#25D366]/15 text-[#25D366] border border-[#25D366]/30 rounded-full uppercase tracking-wider flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#25D366] animate-pulse" />
                  GARÇOM NO WHATSAPP
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">Autoatendimento & Caixa no WhatsApp</p>
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
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#25D366] via-emerald-400 to-[#02c1db] text-[#040c18] font-black text-xs uppercase tracking-wider shadow-lg shadow-[#25D366]/25 hover:shadow-[#25D366]/40 hover:scale-[1.02] transition-all"
            >
              <MessageSquare className="w-4 h-4 fill-current" />
              <span>Simular no WhatsApp</span>
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
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#25D366] text-[#040c18] font-bold text-sm shadow-lg shadow-[#25D366]/20"
              >
                <MessageSquare className="w-4 h-4 fill-current" />
                <span>Simular no WhatsApp (Mesa 1)</span>
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* HERO SECTION */}
      <section className="relative z-10 pt-16 pb-24 lg:pt-28 lg:pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* LADO ESQUERDO: COPYWRITING REPOSICIONADO PARA O WHATSAPP */}
          <div className="lg:col-span-7 space-y-8 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#25D366]/10 border border-[#25D366]/30 text-[#25D366] text-xs font-bold backdrop-blur-md shadow-sm">
              <Zap className="w-3.5 h-3.5 text-[#25D366]" />
              <span>⚡ O Garçom com Inteligência Artificial Direto no WhatsApp</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.12]">
              Transforme o{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#25D366] via-emerald-400 to-[#02c1db]">
                WhatsApp
              </span>{' '}
              no{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#02c1db] via-cyan-300 to-[#01cf9e]">
                garçom mais rápido
              </span>{' '}
              do seu bar ou restaurante.
            </h1>

            <p className="text-base sm:text-xl text-slate-300 max-w-2xl mx-auto lg:mx-0 font-normal leading-relaxed">
              O cliente senta, lê o QR Code da mesa e é <strong>atendido direto no WhatsApp por IA</strong>. Pede pratos e bebidas em linguagem natural, a cozinha recebe na hora e o fechamento da conta via Pix é autônomo. Sem totens caros, sem baixar apps.
            </p>

            {/* BOTÕES DE AÇÃO HERO */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              <Link
                href="/chat?establishment=exemplo&table=1"
                target="_blank"
                className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-[#25D366] via-emerald-400 to-[#02c1db] text-[#040c18] font-black text-sm uppercase tracking-wider shadow-xl shadow-[#25D366]/30 hover:shadow-[#25D366]/50 hover:scale-[1.03] transition-all"
              >
                <MessageSquare className="w-5 h-5 fill-current text-[#040c18]" />
                <span>Simular Mesa no WhatsApp</span>
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

            {/* 4 PILARES OBRIGATÓRIOS (CHECKMARKS) */}
            <div className="pt-6 border-t border-white/10 grid grid-cols-2 gap-3 text-xs text-slate-300 max-w-xl mx-auto lg:mx-0">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#25D366] flex-shrink-0" />
                <span className="font-semibold">Atendimento 100% no WhatsApp</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#25D366] flex-shrink-0" />
                <span>Zero Totem ou Hardware Proprietário</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#25D366] flex-shrink-0" />
                <span>Pix Direto na Conta do Restaurante</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#25D366] flex-shrink-0" />
                <span>Sem Cadastro Burocrático de CPF</span>
              </div>
            </div>
          </div>

          {/* LADO DIREITO: MOCKUP DO SMARTPHONE COM A INTERFACE REAL DO WHATSAPP */}
          <div className="lg:col-span-5 relative flex justify-center">
            {/* CORPO DO SMARTPHONE */}
            <div className="w-full max-w-sm rounded-[40px] p-3.5 bg-gradient-to-b from-[#1f2c34] via-[#0b141a] to-[#121b22] border-4 border-slate-700/60 shadow-2xl shadow-[#25D366]/20 relative">
              {/* NOTCH / CÂMERA FRONTAL */}
              <div className="w-24 h-4 bg-black rounded-full mx-auto mb-2 flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-800" />
              </div>

              {/* TELA INTERNA DO WHATSAPP */}
              <div className="rounded-[30px] bg-[#0b141a] border border-white/5 overflow-hidden flex flex-col h-[540px]">
                {/* BARRA SUPERIOR OFICIAL DO WHATSAPP */}
                <div className="px-3.5 py-3 bg-[#1f2c34] text-white flex items-center justify-between shadow-md">
                  <div className="flex items-center gap-2.5">
                    {/* AVATAR COM BADGE DE VERIFICADO */}
                    <div className="relative">
                      <div className="w-9 h-9 rounded-full bg-[#00a884] flex items-center justify-center text-white font-bold shadow">
                        <UtensilsCrossed className="w-5 h-5 text-white" />
                      </div>
                      <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-[#25D366] border border-[#1f2c34] flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 text-slate-950 stroke-[3]" />
                      </div>
                    </div>

                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-1 leading-tight">
                        <span>Vurio Gastrobar</span>
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#25D366] fill-[#25D366] text-[#1f2c34]" />
                      </div>
                      <div className="text-[10px] text-[#25D366] font-medium flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#25D366]" />
                        <span>Online • Conta Comercial Oficial</span>
                      </div>
                    </div>
                  </div>

                  {/* ÍCONES DE AÇÃO WHATSAPP */}
                  <div className="flex items-center gap-3 text-slate-300">
                    <Video className="w-4 h-4 opacity-75" />
                    <Phone className="w-4 h-4 opacity-75" />
                    <MoreVertical className="w-4 h-4 opacity-75" />
                  </div>
                </div>

                {/* BANNER DE IDENTIFICAÇÃO DA MESA (WHATSAPP INFO) */}
                <div className="bg-[#182229] px-3 py-1.5 text-center text-[11px] text-[#8696a0] border-b border-[#222e35]">
                  🔒 Conversa criptografada • Atendimento na <strong className="text-emerald-400">Mesa 4</strong>
                </div>

                {/* HISTÓRICO DE MENSAGENS COM O PADRÃO FLUIDO DO WHATSAPP */}
                <div className="flex-1 p-3 space-y-3 overflow-hidden text-xs bg-[radial-gradient(#1f2c34_1px,transparent_1px)] [background-size:16px_16px] bg-[#0b141a]">
                  {/* DATA */}
                  <div className="text-center">
                    <span className="px-2.5 py-0.5 bg-[#182229] text-[#8696a0] rounded-md text-[10px] font-medium shadow-sm">
                      HOJE
                    </span>
                  </div>

                  {/* MENSAGEM DO CLIENTE 1 */}
                  <div className="flex flex-col items-end">
                    <div className="bg-[#005c4b] text-[#e9edef] p-2.5 rounded-2xl rounded-tr-none max-w-[85%] shadow-sm">
                      <p className="leading-relaxed">Desce 2 Chopps IPA e 1 Batata Rústica, por favor!</p>
                      <div className="flex items-center justify-end gap-1 text-[9px] text-[#8696a0] mt-1">
                        <span>20:14</span>
                        <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb]" />
                      </div>
                    </div>
                  </div>

                  {/* RESPOSTA DO BOT 1 */}
                  <div className="flex flex-col items-start">
                    <div className="bg-[#202c33] text-[#e9edef] p-2.5 rounded-2xl rounded-tl-none max-w-[85%] shadow-sm space-y-1">
                      <p className="font-semibold text-[#25D366] text-[11px]">
                        Anotado! Pedido enviado para a cozinha 🍻
                      </p>
                      <p className="text-[11px] text-slate-300">
                        • 2x Chopp IPA 500ml<br />
                        • 1x Batata Rústica com Alecrim
                      </p>
                      <div className="text-right text-[9px] text-[#8696a0] pt-0.5">20:14</div>
                    </div>
                  </div>

                  {/* MENSAGEM DO CLIENTE 2 (FECHAMENTO) */}
                  <div className="flex flex-col items-end">
                    <div className="bg-[#005c4b] text-[#e9edef] p-2.5 rounded-2xl rounded-tr-none max-w-[85%] shadow-sm">
                      <p className="leading-relaxed">Fecha a mesa 4 no Pix?</p>
                      <div className="flex items-center justify-end gap-1 text-[9px] text-[#8696a0] mt-1">
                        <span>20:45</span>
                        <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb]" />
                      </div>
                    </div>
                  </div>

                  {/* RESPOSTA DO BOT 2 (PIX COPIA E COLA NO WHATSAPP) */}
                  <div className="flex flex-col items-start">
                    <div className="bg-[#202c33] text-[#e9edef] p-3 rounded-2xl rounded-tl-none max-w-[92%] shadow-md border border-[#25D366]/30 space-y-2">
                      <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
                        <span className="font-bold text-[#25D366]">🧾 Conta da Mesa 4:</span>
                        <span className="font-mono text-sm font-black text-white">R$ 62,00</span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-tight">
                        Copie a chave Pix abaixo para pagar direto na conta do restaurante:
                      </p>
                      <div className="p-2 rounded bg-[#111b21] border border-white/10 text-[10px] font-mono text-cyan-300 truncate">
                        00020126580014BR.GOV.BCB.PIX0114...
                      </div>
                      <div className="w-full py-1.5 bg-[#25D366] text-slate-950 font-black rounded-lg text-[10px] text-center shadow">
                        Copiar Código Pix
                      </div>
                      <div className="text-right text-[9px] text-[#8696a0]">20:45</div>
                    </div>
                  </div>
                </div>

                {/* BARRA DE DIGITAÇÃO WHATSAPP */}
                <div className="p-2 bg-[#1f2c34] flex items-center gap-2">
                  <div className="flex-1 bg-[#2a3942] rounded-full px-3 py-1.5 text-[11px] text-[#8696a0] flex items-center justify-between">
                    <span>Mensagem</span>
                    <Mic className="w-3.5 h-3.5 text-[#8696a0]" />
                  </div>
                  <div className="w-8 h-8 rounded-full bg-[#00a884] flex items-center justify-center text-white">
                    <Send className="w-4 h-4 ml-0.5" />
                  </div>
                </div>
              </div>
            </div>

            {/* BADGE FLUTUANTE DE VELOCIDADE */}
            <div className="absolute -bottom-5 -right-2 sm:-right-6 p-4 rounded-2xl bg-[#05162e]/95 border border-[#25D366]/40 backdrop-blur-xl shadow-2xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#25D366]/20 text-[#25D366] flex items-center justify-center font-bold">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">+35% Giro de Mesa</div>
                <div className="text-[11px] text-slate-400">Zero espera pelo garçom ou maquininha</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SEÇÃO 2: DIFERENCIAIS PROTAGONIZANDO O WHATSAPP */}
      <section id="diferenciais" className="py-20 bg-[#020813]/60 border-y border-[#02c1db]/10 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#25D366]">
              Por que Atender no WhatsApp?
            </h2>
            <p className="text-2xl sm:text-4xl font-extrabold text-white">
              O seu cliente já tem o WhatsApp aberto. Por que obrigá-lo a baixar outro app?
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* CARD 1: FAMILIARIDADE ABSOLUTA */}
            <div className="p-6 rounded-2xl bg-[#082855]/30 border border-[#02c1db]/15 backdrop-blur-md hover:border-[#25D366]/40 transition-all flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-xl bg-[#25D366]/10 border border-[#25D366]/20 text-[#25D366] flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <Smartphone className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Familiaridade Absoluta</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  O cliente não precisa aprender a mexer em um sistema novo. Ele já usa o WhatsApp todo dia. Basta apontar a câmera pro QR Code e conversar naturalmente.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-white/5 text-[11px] font-semibold text-[#25D366] flex items-center gap-1">
                <span>99% dos smartphones no Brasil</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* CARD 2: LINGUAGEM NATURAL */}
            <div className="p-6 rounded-2xl bg-[#082855]/30 border border-[#02c1db]/15 backdrop-blur-md hover:border-[#02c1db]/40 transition-all flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Linguagem Natural</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Ele pode pedir por texto ou áudio: <em>"Me traz um chopp sem colarinho e uma porção de fritas"</em>. O assistente IA entende variações, calcula subtotais e não erra pedidos.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-white/5 text-[11px] font-semibold text-cyan-300 flex items-center gap-1">
                <span>IA com Google Gemini</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* CARD 3: FECHAMENTO INSTANTÂNEO */}
            <div className="p-6 rounded-2xl bg-[#082855]/30 border border-[#02c1db]/15 backdrop-blur-md hover:border-emerald-500/40 transition-all flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <Zap className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Fechamento Instantâneo</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Recebimento da chave Pix / Copia e Cola dentro da própria conversa. O cliente transfere e o caixa confirma com 1 toque. Se preferir cartão, chama o garçom no mesmo chat.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-white/5 text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
                <span>Conta paga em 30 segundos</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* CARD 4: KDS & SEM CUSTÓDIA */}
            <div className="p-6 rounded-2xl bg-[#082855]/30 border border-[#02c1db]/15 backdrop-blur-md hover:border-orange-500/40 transition-all flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <ChefHat className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">KDS & Zero Taxa Pix</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Os pedidos caem instantaneamente na tela da cozinha com alerta sonoro. O dinheiro do Pix cai direto na conta bancária do seu estabelecimento, com 0% de custódia.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-white/5 text-[11px] font-semibold text-orange-400 flex items-center gap-1">
                <span>Cozinha e Caixa sincronizados</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SEÇÃO 3: COMO FUNCIONA EM 3 ETAPAS */}
      <section id="como-funciona" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-widest text-[#25D366]">Jornada Sem Atrito</h2>
          <p className="text-2xl sm:text-4xl font-extrabold text-white">
            Como o Vurio opera na prática da leitura do QR Code ao fechamento
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-8 rounded-3xl bg-[#082855]/25 border border-white/10 relative">
            <span className="text-5xl font-black text-[#25D366]/20 absolute top-6 right-6 font-mono">01</span>
            <div className="w-12 h-12 rounded-xl bg-[#25D366]/15 text-[#25D366] flex items-center justify-center font-bold text-lg mb-6">
              1
            </div>
            <h3 className="text-xl font-bold text-white mb-3">QR Code na Mesa</h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              O cliente aponta a câmera para o QR Code da mesa e a conversa abre instantaneamente no WhatsApp com o número da mesa já identificado.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-[#082855]/25 border border-white/10 relative">
            <span className="text-5xl font-black text-[#02c1db]/20 absolute top-6 right-6 font-mono">02</span>
            <div className="w-12 h-12 rounded-xl bg-[#0077d1]/20 text-cyan-300 flex items-center justify-center font-bold text-lg mb-6">
              2
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Atendimento IA & Cozinha</h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              O cliente pede pratos e bebidas em linguagem natural. A IA anota e envia direto para a tela KDS da cozinha com alarme sonoro em tempo real.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-[#082855]/25 border border-white/10 relative">
            <span className="text-5xl font-black text-[#01cf9e]/20 absolute top-6 right-6 font-mono">03</span>
            <div className="w-12 h-12 rounded-xl bg-[#01cf9e]/20 text-[#01cf9e] flex items-center justify-center font-bold text-lg mb-6">
              3
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Pix Direto ou Maquininha</h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              Para pagar, ele pede a conta no chat: recebe a chave Pix para pagar sem fila ou aciona a maquineta física. O caixa confirma com 1 clique.
            </p>
          </div>
        </div>
      </section>

      {/* SEÇÃO 4: COMPARATIVO (TRADICIONAL VS VURIO WHATSAPP) */}
      <section id="comparativo" className="py-20 bg-[#020813]/80 border-t border-[#02c1db]/15 relative z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#02c1db]">Análise de Eficiência</h2>
            <p className="text-2xl sm:text-3xl font-black text-white">Modelo Tradicional vs. Vurio no WhatsApp</p>
          </div>

          <div className="overflow-hidden rounded-3xl border border-[#02c1db]/25 shadow-2xl bg-[#05162e]/40 backdrop-blur-md">
            <div className="grid grid-cols-2 divide-x divide-white/10 text-sm">
              <div className="p-6 sm:p-8 bg-rose-950/20">
                <div className="text-rose-400 font-black text-base uppercase tracking-wider mb-6 flex items-center gap-2">
                  <span>❌ Gargalo Tradicional</span>
                </div>
                <ul className="space-y-4 text-xs sm:text-sm text-slate-300">
                  <li className="flex items-start gap-2.5">
                    <span className="text-rose-400 font-bold">•</span>
                    <span>15 minutos de espera para pedir a conta nos horários de pico.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-rose-400 font-bold">•</span>
                    <span>Garçom vai ao caixa, busca a conta, leva na mesa e volta para pegar a maquininha.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-rose-400 font-bold">•</span>
                    <span>Totens caros que acumulam fila em frente ao balcão.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-rose-400 font-bold">•</span>
                    <span>Apps que forçam cadastro, senha ou CPF e geram rejeição no cliente.</span>
                  </li>
                </ul>
              </div>

              <div className="p-6 sm:p-8 bg-[#082855]/40">
                <div className="text-[#25D366] font-black text-base uppercase tracking-wider mb-6 flex items-center gap-2">
                  <span>✨ Vurio no WhatsApp</span>
                </div>
                <ul className="space-y-4 text-xs sm:text-sm text-slate-200 font-medium">
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-[#25D366] flex-shrink-0 mt-0.5" />
                    <span>Fechamento autônomo em 30 segundos com chave Pix Copia e Cola.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-[#25D366] flex-shrink-0 mt-0.5" />
                    <span>Chama a maquineta física com 1 toque caso o cliente prefira cartão.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-[#25D366] flex-shrink-0 mt-0.5" />
                    <span>Zero hardware adicional: funciona direto no WhatsApp do próprio cliente.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-[#25D366] flex-shrink-0 mt-0.5" />
                    <span>Sem senhas ou downloads: aplicativo que o cliente já usa 30 vezes ao dia.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SEÇÃO 5: BANNER DE CTA FINAL */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto relative z-10 text-center">
        <div className="p-10 sm:p-14 rounded-3xl bg-gradient-to-br from-[#082855] via-[#040c18] to-[#052d6b] border border-[#25D366]/30 shadow-2xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#25D366]/15 text-[#25D366] text-xs font-bold">
            <MessageSquare className="w-3.5 h-3.5 fill-current" />
            <span>Disponível Agora no WhatsApp</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-black text-white">
            Coloque o WhatsApp para atender as mesas do seu bar ou restaurante.
          </h2>

          <p className="text-slate-300 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
            Abra a simulação em tempo real, veja o painel do caixa e comprove a agilidade de um atendimento autônomo.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="/chat?establishment=exemplo&table=1"
              target="_blank"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-[#25D366] via-emerald-400 to-[#02c1db] text-[#040c18] font-black text-xs uppercase tracking-wider shadow-xl shadow-[#25D366]/30 hover:scale-105 transition-all flex items-center justify-center gap-2"
            >
              <MessageSquare className="w-4 h-4 fill-current text-[#040c18]" />
              <span>Simular Atendimento na Mesa 1</span>
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
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#25D366] to-[#02c1db] p-0.5 flex items-center justify-center">
              <div className="w-full h-full bg-[#02060d] rounded-[10px] flex items-center justify-center">
                <UtensilsCrossed className="w-4 h-4 text-[#25D366]" />
              </div>
            </div>
            <div>
              <div className="font-bold text-slate-300 text-sm">VURIO ATENDIMENTO</div>
              <div className="text-[11px] text-slate-500">Autoatendimento e Fechamento Autônomo de Mesas no WhatsApp</div>
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
