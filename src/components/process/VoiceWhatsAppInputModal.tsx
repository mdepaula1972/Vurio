import React, { useState } from 'react';
import { Mic, MessageSquare, Sparkles, X, Check, Volume2, Loader2, ArrowRight } from 'lucide-react';
import { Step } from '../../engine/types';

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
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [whatsappText, setWhatsappText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleStartVoice = () => {
    setIsRecording(true);
    setTranscript('');
    
    // Simulação de transcrição em tempo real via voz
    const samplePhrases = [
      "Aprovar orçamento da campanha de marketing até sexta-feira com limite de R$ 4.500.",
      "Entregar documentação fiscal da filial até amanhã às 18h com anexo de nota fiscal.",
      "Finalizar protótipo do aplicativo mobile e agendar reunião com a diretoria."
    ];
    const chosenPhrase = samplePhrases[Math.floor(Math.random() * samplePhrases.length)];

    let currentLength = 0;
    const interval = setInterval(() => {
      currentLength += 3;
      setTranscript(chosenPhrase.slice(0, currentLength));
      if (currentLength >= chosenPhrase.length) {
        clearInterval(interval);
        setIsRecording(false);
      }
    }, 120);
  };

  const handleProcessInput = () => {
    const rawInput = mode === 'voice' ? transcript : whatsappText;
    if (!rawInput.trim()) return;

    setIsProcessing(true);

    setTimeout(() => {
      setIsProcessing(false);
      
      // IA interpreta o áudio/WhatsApp e constrói o card regrado
      const extractedTitle = rawInput.split(' ')[0] ? rawInput.slice(0, 45) : 'Nova Tarefa via Voz/Whats';
      
      onAddStepFromAI({
        title: extractedTitle,
        description: `Processado via IA Vurio a partir de ${mode === 'voice' ? 'ditado de voz' : 'mensagem de WhatsApp'}: "${rawInput}"`,
        stageId: 'start',
        metricType: rawInput.includes('R$') || rawInput.includes('orçamento') ? 'budget' : 'deadline',
        budgetData: rawInput.includes('R$') ? { targetAmount: 4500, spentAmount: 1200, currency: 'R$' } : undefined,
        deadlineData: { totalHours: 48, remainingHours: 36, deadlineDate: 'Em 2 dias' },
        aiAudit: {
          required: rawInput.toLowerCase().includes('anexo') || rawInput.toLowerCase().includes('nota') || rawInput.toLowerCase().includes('documento'),
          allowedTypes: ['pdf', 'png', 'jpg'],
          status: 'none'
        }
      });
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4">
      <div className="bg-slate-900 border border-indigo-500/40 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative overflow-hidden">
        
        {/* Decorative ambient gradient */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                Criação Rápida via Voz / WhatsApp
              </h3>
              <p className="text-xs text-slate-400">Entrada Inteligente Mobile-First com IA</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection Mode */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800 mb-5">
          <button
            type="button"
            onClick={() => setMode('voice')}
            className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
              mode === 'voice'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Mic className="w-4 h-4" />
            Comando por Voz (Ditado)
          </button>

          <button
            type="button"
            onClick={() => setMode('whatsapp')}
            className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
              mode === 'whatsapp'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            Cole do WhatsApp
          </button>
        </div>

        {/* VOICE MODE */}
        {mode === 'voice' && (
          <div className="space-y-4 text-center">
            <div className="py-6 flex flex-col items-center justify-center">
              <button
                type="button"
                onClick={handleStartVoice}
                disabled={isRecording || isProcessing}
                className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all ${
                  isRecording
                    ? 'bg-rose-500 text-white animate-pulse shadow-lg shadow-rose-500/50 ring-8 ring-rose-500/20'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-xl shadow-indigo-600/40 hover:scale-105'
                }`}
              >
                <Mic className="w-8 h-8" />
              </button>

              <span className="text-xs font-medium text-slate-300 mt-3">
                {isRecording ? 'Gravando e transcrevendo com IA...' : 'Clique para ditar nova tarefa'}
              </span>
            </div>

            {/* Live Transcript Output */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-left min-h-[80px]">
              <span className="text-[11px] font-semibold text-indigo-400 block mb-1 flex items-center gap-1">
                <Volume2 className="w-3.5 h-3.5" />
                Transcrição em Tempo Real:
              </span>
              <p className="text-xs text-slate-200 italic">
                {transcript || 'Aguardando início do áudio...'}
              </p>
            </div>
          </div>
        )}

        {/* WHATSAPP MODE */}
        {mode === 'whatsapp' && (
          <div className="space-y-3">
            <label className="block text-xs font-semibold text-slate-300">
              Mensagem de Texto / Áudio Transcrito do WhatsApp
            </label>
            <textarea
              rows={4}
              value={whatsappText}
              onChange={e => setWhatsappText(e.target.value)}
              placeholder='Ex: "Favor aprovar a contratação do fornecedor de TI até quinta orçado em R$ 8.000 exigindo anexo do contrato."'
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
            />
            {/* Presets */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setWhatsappText("Aprovar contratação de TI até quinta-feira orçado em R$ 8.000 com anexo do contrato.")}
                className="text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-700"
              >
                Exemplo WhatsApp 1
              </button>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-6 flex justify-end space-x-3 border-t border-slate-800 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 rounded-xl transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleProcessInput}
            disabled={isProcessing || (mode === 'voice' && !transcript) || (mode === 'whatsapp' && !whatsappText)}
            className="px-5 py-2 text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Extraindo com IA...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Gerar Card Regrado
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
