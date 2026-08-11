/**
 * Vurio v1.3.0 — Gestor Inteligente de Processos com IA
 * AICopilotBar — Assistente Proativo com insights em tempo real e ações em 1-clique
 */
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Bot, Sparkles, AlertTriangle, ArrowRight, X, Lightbulb, Zap, Send } from 'lucide-react';
import { Process } from '../../engine/types';

interface AICopilotBarProps {
  process?: Process;
  onAdvanceBlockedStep?: (stepId: string) => void;
}

export const AICopilotBar: React.FC<AICopilotBarProps> = ({ process, onAdvanceBlockedStep }) => {
  const { t } = useTranslation();
  const [isDismissed, setIsDismissed] = useState(false);

  if (!process || isDismissed) return null;

  const blockedSteps = process.steps.filter(s => s.status === 'blocked');
  const firstBlocked = blockedSteps[0];

  if (!firstBlocked) return null;

  return (
    <div className="fixed bottom-20 sm:bottom-6 left-4 right-4 max-w-4xl mx-auto z-40 animate-fade-in-up">
      <div className="rounded-2xl bg-slate-900/95 border border-indigo-500/40 p-4 sm:p-5 shadow-2xl backdrop-blur-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ring-1 ring-indigo-500/20">
        
        {/* Glow accent */}
        <div className="absolute -top-12 -left-12 w-48 h-48 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Content */}
        <div className="flex items-start space-x-3.5 relative z-10">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-500 text-white shadow-lg shadow-indigo-500/30 flex-shrink-0">
            <Bot className="w-5 h-5 animate-pulse" />
          </div>

          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase tracking-wider">
                {t('copilot.badge')}
              </span>
              <span className="text-xs font-bold text-amber-400 flex items-center space-x-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{t('copilot.stepBlocked', { title: firstBlocked.title })}</span>
              </span>
            </div>

            <p className="text-xs text-slate-300 font-medium leading-relaxed max-w-2xl">
              {firstBlocked.blockadeInfo?.aiRecommendation || `A etapa está retida aguardando os responsáveis: ${firstBlocked.responsible.join(', ')}.`}
            </p>
          </div>
        </div>

        {/* Actions & Dismiss */}
        <div className="flex items-center space-x-2 w-full sm:w-auto justify-end relative z-10">
          {onAdvanceBlockedStep && (
            <button
              onClick={() => onAdvanceBlockedStep(firstBlocked.id)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold text-xs shadow-md shadow-indigo-500/25 flex items-center space-x-1.5 transition-all transform active:scale-95"
            >
              <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
              <span>{t('copilot.unblockAction')}</span>
            </button>
          )}

          <button
            onClick={() => setIsDismissed(true)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            title={t('copilot.minimize')}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
