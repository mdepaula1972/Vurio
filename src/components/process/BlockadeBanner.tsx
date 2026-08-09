/**
 * Vurio v1.0.0 — Gestor Inteligente de Processos com IA
 * BlockadeBanner — Card explicativo de bloqueios e diagnósticos de IA
 */
import React from 'react';
import { useTranslation } from 'react-i18next';

import { ShieldAlert, User, Calendar, AlertTriangle, Lightbulb, CheckCircle2 } from 'lucide-react';
import { Step } from '../../engine/types';

interface BlockadeBannerProps {
  step: Step;
  onUnblockClick?: () => void;
}

export const BlockadeBanner: React.FC<BlockadeBannerProps> = ({ step, onUnblockClick }) => {
  const { t } = useTranslation();
  const info = step.blockadeInfo;

  if (!info || !info.isBlocked) {
    return (
      <div className="flex items-center space-x-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
        <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
        <span>Etapa pronta para execução ou finalizada sem impedimentos.</span>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-red-950/40 border border-red-800/60 p-4 sm:p-5 space-y-4 shadow-xl">
      
      {/* Blockade Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-red-200">
              {t('process.blockade.title')}
            </h4>
            <p className="text-xs text-red-300/80 font-medium">
              {info.reason}
            </p>
          </div>
        </div>
      </div>

      {/* Grid de Detalhes Explicativos (Explicabilidade Nativa) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        
        {/* Condição Ausente */}
        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
          <div className="text-slate-400 font-medium flex items-center space-x-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>{t('process.blockade.pendingCondition')}</span>
          </div>
          <p className="text-slate-200 font-semibold">{info.missingCondition}</p>
        </div>

        {/* Quem Precisa Agir */}
        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
          <div className="text-slate-400 font-medium flex items-center space-x-1.5">
            <User className="w-3.5 h-3.5 text-blue-400" />
            <span>{t('process.blockade.responsible')}</span>
          </div>
          <p className="text-slate-200 font-semibold">
            {info.responsibleParties.length > 0 ? info.responsibleParties.join(', ') : 'Não atribuído'}
          </p>
        </div>

        {/* Bloqueado Desde */}
        {info.blockedSince && (
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
            <div className="text-slate-400 font-medium flex items-center space-x-1.5">
              <Calendar className="w-3.5 h-3.5 text-indigo-400" />
              <span>{t('process.blockade.since')}</span>
            </div>
            <p className="text-slate-200 font-semibold">{info.blockedSince}</p>
          </div>
        )}

        {/* Impacto no Processo */}
        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
          <div className="text-slate-400 font-medium flex items-center space-x-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
            <span>{t('process.blockade.impact')}</span>
          </div>
          <p className="text-slate-200 font-semibold">{info.processImpact}</p>
        </div>

      </div>

      {/* Orientação IA para Desbloqueio */}
      {info.aiRecommendation && (
        <div className="p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-500/30 flex items-start space-x-3 text-xs">
          <Lightbulb className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold text-indigo-300">{t('process.blockade.aiSuggestion')}</span>
            <p className="text-slate-300 leading-relaxed">{info.aiRecommendation}</p>
          </div>
        </div>
      )}

    </div>
  );
};
