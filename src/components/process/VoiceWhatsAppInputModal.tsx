import React, { useState } from 'react';
import { Mic, MicOff, MessageSquare, Sparkles, X, Loader2, ArrowRight, Edit3 } from 'lucide-react';
import { Step } from '../../engine/types';
import { voiceService } from '../../services/voiceService';

interface VoiceWhatsAppInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddStepFromAI: (newStepData: Partial<Step>) => void;
}

export const VoiceWhatsAppInputModal: React.FC<VoiceWhatsAppInputModalProps> = ({
  isOpen,
  onClose,
  onAddStepFromAI
}) => {
  const [mode, setMode] = useState<'voice' | 'whatsapp'>('voice');
  const [isListening, setIsListening] = useState(false);
  const [userInputText, setUserInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleToggleVoice = () => {
    setVoiceError(null);

    if (isListening) {
      voiceService.stopListening();
      setIsListening(false);
    } else {
      if (!voiceService.isSupported()) {
        setVoiceError('O seu navegador não suporta captura de voz nativa. Digite suas instruções no campo abaixo.');
        return;
      }

      setIsListening(true);
      voiceService.startListening(
        (res) => {
          setUserInputText(res.transcript);
        },
        (err) => {
          console.error('Erro de captura de voz:', err);
          setVoiceError('Não foi possível acessar o microfone. Escreva no campo de texto abaixo.');
          setIsListening(false);
        }
      );
    }
  };

  const handleProcessInput = () => {
    const rawInput = userInputText.trim();
    if (!rawInput) return;

    if (isListening) {
      voiceService.stopListening();
      setIsListening(false);
    }

    setIsProcessing(true);

    // A IA analisa o texto estritamente digitado ou ditado pelo USUÁRIO e sugere as ações / métricas
    setTimeout(() => {
      setIsProcessing(false);
      
      const extractedTitle = rawInput.length > 50 ? rawInput.slice(0, 48) + '...' : rawInput;
      const lower = rawInput.toLowerCase();
      
      onAddStepFromAI({
        title: extractedTitle,
        description: `Entrada do usuário via ${mode === 'voice' ? 'voz' : 'WhatsApp'}: "${rawInput}"`,
        stageId: 'start',
        metricType: lower.includes('r$') || lower.includes('orçamento') || lower.includes('gasto') || lower.includes('custo') ? 'budget' : 'deadline',
        budgetData: lower.includes('r$') ? { targetAmount: 5000, spentAmount: 0, currency: 'R$' } : undefined,
        deadlineData: { totalHours: 48, remainingHours: 48, deadlineDate: 'Definido por IA' },
        aiAudit: {
          required: lower.includes('anexo') || lower.includes('nota') || lower.includes('comprovante') || lower.includes('documento') || lower.includes('relatório'),
          allowedTypes: ['pdf', 'png', 'jpg'],
          status: 'none'
        }
      });
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4">
      <div className="bg-slate-900 border border-indigo-500/40 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative overflow-hidden">
        
        {/* Ambient Gradient */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                Entrada do Usuário (Voz / Texto)
              </h3>
              <p className="text-xs text-slate-400">Insira suas informações para a IA analisar e sugerir ações</p>
            </div>
          </div>
          <button
            onClick={() => {
              if (isListening) voiceService.stopListening();
              onClose();
            }}
            className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Mode Selection */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800 mb-5">
          <button
            type="button"
            onClick={() => {
              setMode('voice');
              setVoiceError(null);
            }}
            className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
              mode === 'voice'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Mic className="w-4 h-4" />
            Ditado por Voz
          </button>

          <button
            type="button"
            onClick={() => {
              setMode('whatsapp');
              if (isListening) {
                voiceService.stopListening();
                setIsListening(false);
              }
              setVoiceError(null);
            }}
            className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
              mode === 'whatsapp'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            Texto do WhatsApp / Digitação
          </button>
        </div>

        {/* VOICE MODE */}
        {mode === 'voice' && (
          <div className="space-y-4 text-center">
            <div className="py-4 flex flex-col items-center justify-center">
              <button
                type="button"
                onClick={handleToggleVoice}
                disabled={isProcessing}
                className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all ${
                  isListening
                    ? 'bg-rose-500 text-white animate-pulse shadow-lg shadow-rose-500/50 ring-8 ring-rose-500/20'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-xl shadow-indigo-600/40 hover:scale-105'
                }`}
              >
                {isListening ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
              </button>

              <span className="text-xs font-medium text-slate-300 mt-3">
                {isListening ? 'Fale agora: gravando sua voz em tempo real...' : 'Clique no microfone e fale suas instruções'}
              </span>
            </div>

            {/* Error Banner */}
            {voiceError && (
              <div className="p-3 bg-amber-950/60 border border-amber-500/40 rounded-xl text-amber-200 text-xs text-left">
                {voiceError}
              </div>
            )}

            {/* Editable Text Area with Speech-to-Text Transcript */}
            <div className="space-y-1.5 text-left">
              <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1">
                <Edit3 className="w-3.5 h-3.5 text-indigo-400" />
                Sua Informação Ditada ou Digitada:
              </label>
              <textarea
                rows={3}
                value={userInputText}
                onChange={e => setUserInputText(e.target.value)}
                placeholder="Fale no microfone ou digite aqui o que deseja realizar..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        )}

        {/* WHATSAPP / TEXT MODE */}
        {mode === 'whatsapp' && (
          <div className="space-y-3">
            <label className="block text-xs font-semibold text-slate-300">
              Digite ou cole sua mensagem (do WhatsApp, e-mail ou nota):
            </label>
            <textarea
              rows={4}
              value={userInputText}
              onChange={e => setUserInputText(e.target.value)}
              placeholder="Cole a mensagem de texto ou digite sua instrução..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
            />
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-6 flex items-center justify-between border-t border-slate-800 pt-4">
          <span className="text-[11px] text-slate-400">
            A IA só sugerirá regras após você inserir os dados.
          </span>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={() => {
                if (isListening) voiceService.stopListening();
                onClose();
              }}
              className="px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleProcessInput}
              disabled={isProcessing || !userInputText.trim()}
              className="px-5 py-2 text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analisando e Sugerindo...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Sugerir Ações com IA
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
