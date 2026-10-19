'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  Send, 
  UtensilsCrossed, 
  Receipt, 
  CreditCard, 
  QrCode, 
  Copy, 
  Check, 
  BellRing, 
  Sparkles, 
  ChefHat, 
  HelpCircle,
  Clock
} from 'lucide-react';
import { ChatMessage } from '@/lib/types/garcom';

function ChatContent() {
  const searchParams = useSearchParams();
  const establishmentParam = searchParams.get('establishment') || 'exemplo';
  const tableParam = searchParams.get('table') || '1';

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Rolagem suave automática para o final das mensagens
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Mensagem inicial do assistente (Zero Atrito)
  useEffect(() => {
    const welcomeMsg: ChatMessage = {
      id: 'welcome',
      role: 'assistant',
      content: `👋 Olá! Bem-vindo(a) à **Mesa ${tableParam}**!\n\nSou o seu garçom digital. Estou aqui para agilizar seu atendimento com total autonomia:\n\n• Veja o cardápio e faça pedidos direto por aqui\n• Consulte o extrato parcial da mesa a qualquer momento\n• Feche a conta sem filas (via **Pix** ou chamando a **maquininha**)\n\nComo posso te ajudar agora?`,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };
    setMessages([welcomeMsg]);
  }, [tableParam]);

  // Envio de mensagem
  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || inputText;
    if (!textToSend.trim() || loading) return;

    const userMessage: ChatMessage = {
      id: String(Date.now()),
      role: 'user',
      content: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!customText) setInputText('');
    setLoading(true);

    try {
      const res = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          establishment: establishmentParam,
          table: tableParam,
          message: textToSend.trim()
        })
      });

      const data = await res.json();

      if (data.response) {
        const botMessage: ChatMessage = {
          id: String(Date.now() + 1),
          role: 'assistant',
          content: data.response,
          timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          action_type: data.action_type,
          metadata: data.metadata
        };
        setMessages((prev) => [...prev, botMessage]);
      } else if (data.error) {
        const errorMsg: ChatMessage = {
          id: String(Date.now() + 1),
          role: 'assistant',
          content: `⚠️ Desculpe, ${data.error}`,
          timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        };
        setMessages((prev) => [...prev, errorMsg]);
      }
    } catch (err) {
      const errorMsg: ChatMessage = {
        id: String(Date.now() + 1),
        role: 'assistant',
        content: '⚠️ Ocorreu uma oscilação na conexão. Por favor, tente novamente.',
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyPix = (code: string) => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 3000);
  };

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-[#040c18] border-x border-[#02c1db]/15 text-slate-100 shadow-2xl relative">
      {/* HEADER MOBILE ZERO ATRITO */}
      <header className="px-4 py-3 bg-[#051d44]/95 border-b border-[#02c1db]/20 backdrop-blur-md sticky top-0 z-20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-[#0077d1] to-[#02c1db] p-0.5 shadow-md shadow-[#02c1db]/20">
            <div className="h-full w-full bg-[#040c18] rounded-[10px] flex items-center justify-center">
              <UtensilsCrossed className="w-5 h-5 text-[#02c1db]" />
            </div>
          </div>
          <div>
            <h1 className="font-bold text-sm text-white flex items-center gap-1.5 leading-tight">
              <span>Vurio Atendimento</span>
              <span className="w-2 h-2 rounded-full bg-[#01cf9e] inline-block animate-pulse" />
            </h1>
            <p className="text-[11px] text-cyan-300 font-medium">
              Mesa <strong className="text-white font-bold">{tableParam}</strong> • Atendimento Autônomo
            </p>
          </div>
        </div>

        <div className="px-2.5 py-1 rounded-full bg-[#02c1db]/15 border border-[#02c1db]/30 text-[#02c1db] text-[11px] font-bold">
          Zero Fila
        </div>
      </header>

      {/* ÁREA DE MENSAGENS COM SCROLL */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-md ${
                  isUser
                    ? 'bg-gradient-to-br from-[#0077d1] to-[#0295b8] text-white rounded-tr-none'
                    : 'bg-[#082855]/75 border border-[#02c1db]/20 text-slate-100 rounded-tl-none'
                }`}
              >
                {/* TEXTO DA MENSAGEM */}
                <div className="whitespace-pre-wrap">
                  {msg.content.split('\n').map((line, idx) => {
                    // Renderização simples e elegante de markdown básico
                    let formatted = line;
                    return (
                      <div key={idx} className="min-h-[1.25rem]">
                        {line}
                      </div>
                    );
                  })}
                </div>

                {/* CARD ESPECIAL: PAGAMENTO PIX */}
                {msg.action_type === 'bill_requested_pix' && msg.metadata?.pix_key && (
                  <div className="mt-3 pt-3 border-t border-white/10 space-y-2.5">
                    <div className="p-3 bg-[#040c18] rounded-xl border border-cyan-400/30">
                      <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                        Chave Pix ({msg.metadata.pix_key_type || 'PIX'}):
                      </div>
                      <div className="font-mono text-xs text-cyan-300 font-bold truncate mt-0.5">
                        {msg.metadata.pix_key}
                      </div>

                      {msg.metadata.pix_beneficiary && (
                        <div className="text-[11px] text-slate-300 mt-1">
                          Favorecido: <strong>{msg.metadata.pix_beneficiary}</strong>
                        </div>
                      )}
                    </div>

                    {msg.metadata.pix_copy_paste && (
                      <button
                        onClick={() => handleCopyPix(msg.metadata?.pix_copy_paste || '')}
                        className="w-full py-2.5 px-3 bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-transform"
                      >
                        {copiedKey ? (
                          <>
                            <Check className="w-4 h-4 text-slate-950" />
                            <span>Código Pix Copiado!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            <span>Copiar Código Pix Copia-e-Cola</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                )}

                {/* CARD ESPECIAL: GARÇOM ACIONADO (CARTÃO) */}
                {msg.action_type === 'bill_requested_card' && (
                  <div className="mt-2 pt-2 border-t border-white/10 flex items-center gap-2 text-xs text-amber-300">
                    <BellRing className="w-4 h-4 animate-bounce" />
                    <span>Garçom notificado no salão com a máquina</span>
                  </div>
                )}

                <div
                  className={`text-[10px] mt-1.5 ${
                    isUser ? 'text-cyan-100/70 text-right' : 'text-slate-400'
                  }`}
                >
                  {msg.timestamp}
                </div>
              </div>
            </div>
          );
        })}

        {/* INDICADOR DE DIGITAÇÃO */}
        {loading && (
          <div className="flex items-center gap-2 text-xs text-cyan-300/80 italic p-2 bg-[#082855]/40 rounded-xl max-w-[180px] border border-cyan-500/20">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span>Garçom digitando...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* CHIPS DE AÇÃO RÁPIDA (ZERO ATRITO) */}
      <div className="px-3 py-2 bg-[#040c18]/90 border-t border-white/5 flex gap-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => handleSendMessage('Cardápio')}
          disabled={loading}
          className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#082855] text-cyan-300 border border-[#02c1db]/30 hover:bg-[#0077d1]/30 transition-colors"
        >
          <UtensilsCrossed className="w-3 h-3" />
          <span>Cardápio</span>
        </button>

        <button
          onClick={() => handleSendMessage('Quanto tá dando a conta?')}
          disabled={loading}
          className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#082855] text-cyan-300 border border-[#02c1db]/30 hover:bg-[#0077d1]/30 transition-colors"
        >
          <Receipt className="w-3 h-3" />
          <span>Extrato Parcial</span>
        </button>

        <button
          onClick={() => handleSendMessage('Quero pagar no Pix')}
          disabled={loading}
          className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-950/60 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-900/40 transition-colors"
        >
          <QrCode className="w-3 h-3" />
          <span>Pagar Pix</span>
        </button>

        <button
          onClick={() => handleSendMessage('Quero pagar no Cartão, chama o garçom')}
          disabled={loading}
          className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-950/60 text-amber-300 border border-amber-500/40 hover:bg-amber-900/40 transition-colors"
        >
          <CreditCard className="w-3 h-3" />
          <span>Pagar Cartão</span>
        </button>
      </div>

      {/* CAMPO DE ENTRADA DO CHAT */}
      <div className="p-3 bg-[#05162e] border-t border-[#02c1db]/20">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Digite seu pedido ou mensagem..."
            disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-xl bg-[#040c18] border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-[#02c1db]"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || loading}
            className="p-2.5 rounded-xl bg-gradient-to-r from-[#0077d1] to-[#02c1db] text-[#040c18] font-bold shadow-md shadow-[#02c1db]/20 disabled:opacity-40 hover:opacity-90 transition-all flex items-center justify-center"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#040c18] flex items-center justify-center text-cyan-400">
          Carregando atendimento da mesa...
        </div>
      }
    >
      <ChatContent />
    </Suspense>
  );
}
