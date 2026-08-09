/**
 * Vurio v1.0.0 — Gestor Inteligente de Processos com IA
 * HeroPrompt — Interface de entrada de intenção com IA e voz
 */
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Mic, MicOff, Sparkles, ArrowRight, UserPlus, Building2, ShoppingBag, DollarSign } from 'lucide-react';
import { voiceService } from '../../services/voiceService';

interface HeroPromptProps {
  onGenerateProcess: (promptText: string) => void;
  isGenerating: boolean;
}

export const HeroPrompt: React.FC<HeroPromptProps> = ({ onGenerateProcess, isGenerating }) => {
  const { t } = useTranslation();
  const [promptText, setPromptText] = useState('');
  const [isListening, setIsListening] = useState(false);

  const handleVoiceToggle = () => {
    if (isListening) {
      voiceService.stopListening();
      setIsListening(false);
    } else {
      setIsListening(true);
      voiceService.startListening(
        (res) => {
          setPromptText(res.transcript);
        },
        (err) => {
          console.error('Erro de voz:', err);
          setIsListening(false);
        }
      );
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptText.trim()) return;
    onGenerateProcess(promptText);
  };

  const presetExamples = [
    { label: 'Quero contratar um funcionário', icon: UserPlus },
    { label: 'Quero abrir uma empresa ou filial', icon: Building2 },
    { label: 'Implantação de novo cliente B2B', icon: ShoppingBag },
    { label: 'Estruturação de BPO financeiro', icon: DollarSign }
  ];

  return (
    <div className="relative overflow-hidden rounded-3xl bg-slate-900/90 border border-slate-800 p-6 sm:p-10 shadow-2xl shadow-indigo-950/50 mb-10">
      
      {/* Background Decorative Glow */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-3xl mx-auto text-center space-y-6">
        
        {/* Header Badge */}
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
          <span>{t('app.subtitle')}</span>
        </div>

        {/* Title Question Prompt */}
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
          {t('hero.questionPrompt')}
        </h1>

        <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto">
          Descreva em poucas palavras por digitação ou <strong className="text-indigo-400 font-semibold">fale diretamente por voz</strong>. O motor Vurio montará as etapas, dependências, responsáveis e bloqueios.
        </p>

        {/* Input Form with Voice First Button */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative flex items-center">
            
            <input
              type="text"
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              placeholder={t('hero.placeholder')}
              className="w-full pl-5 pr-28 py-4 sm:py-5 rounded-2xl bg-slate-950/80 border border-slate-700/80 text-white placeholder-slate-500 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-inner"
            />

            {/* Voice Mic Button */}
            <button
              type="button"
              onClick={handleVoiceToggle}
              className={`absolute right-14 p-2.5 rounded-xl transition-all ${
                isListening
                  ? 'bg-red-500 text-white animate-bounce shadow-lg shadow-red-500/50'
                  : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'
              }`}
              title={isListening ? 'Parar gravação de voz' : t('hero.voiceButton')}
            >
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5 text-indigo-400" />}
            </button>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isGenerating || !promptText.trim()}
              className="absolute right-2 p-2.5 sm:p-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-md shadow-indigo-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-95"
            >
              {isGenerating ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <ArrowRight className="w-5 h-5" />
              )}
            </button>

          </div>

          {/* Voice Listening Feedback */}
          {isListening && (
            <div className="flex items-center justify-center space-x-2 text-xs font-semibold text-red-400 animate-pulse">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
              <span>{t('hero.voiceListening')}</span>
            </div>
          )}
        </form>

        {/* Preset Quick Examples */}
        <div className="pt-4 border-t border-slate-800/80">
          <p className="text-xs text-slate-400 font-medium mb-3">
            {t('hero.examplesTitle')}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {presetExamples.map((ex, idx) => {
              const Icon = ex.icon;
              return (
                <button
                  key={idx}
                  onClick={() => {
                    setPromptText(ex.label);
                    onGenerateProcess(ex.label);
                  }}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800/60 hover:bg-indigo-600/20 hover:border-indigo-500/40 text-xs font-medium text-slate-300 border border-slate-700/60 transition-all text-left"
                >
                  <Icon className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{ex.label}</span>
                </button>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
};
