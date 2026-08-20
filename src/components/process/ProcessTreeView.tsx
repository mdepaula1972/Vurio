/**
 * Vurio v1.0.0 — Gestor Inteligente de Processos com IA
 * ProcessTreeView — Visualização hierárquica por camadas (Layers)
 */
import React from 'react';
import { useTranslation } from 'react-i18next';

import { CheckCircle2, Lock, Clock, ArrowDown, UserCheck, DollarSign, ExternalLink, GitMerge, AlertCircle, Play } from 'lucide-react';
import { Process, Step } from '../../engine/types';
import { groupStepsByLayer } from '../../engine/dependencyResolver';
import { BlockadeBanner } from './BlockadeBanner';

interface ProcessTreeViewProps {
  process: Process;
  onAdvanceStep: (stepId: string) => void;
  onApproveStep: (stepId: string) => void;
  onSimulateDelay: (stepId: string) => void;
}

export const ProcessTreeView: React.FC<ProcessTreeViewProps> = ({
  process,
  onAdvanceStep,
  onApproveStep,
  onSimulateDelay
}) => {
  const { t } = useTranslation();

  const totalSteps = process.steps.length;
  const completedStepsCount = React.useMemo(
    () => process.steps.filter(s => s.status === 'completed').length,
    [process.steps]
  );
  const progressPercentage = React.useMemo(
    () => Math.round((completedStepsCount / (totalSteps || 1)) * 100),
    [completedStepsCount, totalSteps]
  );

  const layerMap = groupStepsByLayer(process.steps);
  const sortedLayers = Array.from(layerMap.keys()).sort((a, b) => a - b);

  const getDependencyBadge = (type: string) => {
    switch (type) {
      case 'sequential':
        return <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px]"><Clock className="w-3 h-3"/> <span>Sequencial</span></span>;
      case 'convergent':
        return <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[10px]"><GitMerge className="w-3 h-3"/> <span>Convergente</span></span>;
      case 'financial':
        return <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px]"><DollarSign className="w-3 h-3"/> <span>Financeira</span></span>;
      case 'external':
        return <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px]"><ExternalLink className="w-3 h-3"/> <span>Externa</span></span>;
      default:
        return <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px]"><span>{type}</span></span>;
    }
  };

  return (
    <div className="space-y-10">
      
      {/* Header do Processo */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase border border-indigo-500/30">
              {process.category}
            </span>
            <span className="text-xs text-slate-400">
              {totalSteps} etapas ({completedStepsCount} concluídas)
            </span>
          </div>
          <h2 className="text-2xl font-extrabold text-white mt-1">
            {process.name}
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-2xl">
            {process.description}
          </p>
        </div>

        {/* Progress Bar Header */}
        <div className="sm:w-48 space-y-1.5">
          <div className="flex justify-between text-xs font-bold text-slate-300">
            <span>Progresso Global</span>
            <span>{progressPercentage}%</span>
          </div>
          <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden p-0.5">
            <div
              className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Árvore Hierárquica por Camadas (Layers 1..N) */}
      <div className="space-y-8 relative">
        
        {/* Linha guia vertical */}
        <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-slate-800 hidden sm:block pointer-events-none" />

        {sortedLayers.map((layerNum) => {
          const stepsInLayer = layerMap.get(layerNum) || [];

          return (
            <div key={layerNum} className="relative space-y-4">
              
              {/* Layer Badge Header */}
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 text-indigo-400 flex items-center justify-center font-bold text-sm shadow-md z-10">
                  C{layerNum}
                </div>
                <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
                  Camada {layerNum} ({stepsInLayer.length} {stepsInLayer.length === 1 ? 'etapa' : 'etapas'})
                </h3>
              </div>

              {/* Grid de Cards de Etapas na Camada */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:ml-16">
                {stepsInLayer.map((step) => {
                  const isBlocked = step.status === 'blocked';
                  const isCompleted = step.status === 'completed';
                  const isInProgress = step.status === 'in_progress';

                  return (
                    <div
                      key={step.id}
                      className={`rounded-2xl border p-5 transition-all space-y-4 shadow-lg ${
                        isCompleted
                          ? 'bg-slate-900/60 border-emerald-500/30'
                          : isBlocked
                          ? 'bg-slate-900 border-red-500/40 shadow-red-950/20'
                          : 'bg-slate-900 border-indigo-500/40 shadow-indigo-950/30'
                      }`}
                    >
                      {/* Step Title & Status Badge */}
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">
                              ID: {step.id}
                            </span>
                            {step.dependencies.map((dep, idx) => (
                              <React.Fragment key={idx}>
                                {getDependencyBadge(dep.type)}
                              </React.Fragment>
                            ))}
                          </div>
                          <h4 className="text-base font-bold text-white">
                            {step.title}
                          </h4>
                        </div>

                        {/* Status Icon */}
                        <div className="flex-shrink-0">
                          {isCompleted && (
                            <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30 flex items-center space-x-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Concluída</span>
                            </span>
                          )}
                          {isBlocked && (
                            <span className="px-2.5 py-1 rounded-full bg-red-500/20 text-red-400 text-xs font-bold border border-red-500/30 flex items-center space-x-1">
                              <Lock className="w-3.5 h-3.5" />
                              <span>Bloqueada</span>
                            </span>
                          )}
                          {isInProgress && (
                            <span className="px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-400 text-xs font-bold border border-indigo-500/30 flex items-center space-x-1 animate-pulse">
                              <Play className="w-3.5 h-3.5 fill-indigo-400" />
                              <span>Pronta / Em Curso</span>
                            </span>
                          )}
                        </div>
                      </div>

                      <p className="text-xs text-slate-400 leading-relaxed">
                        {step.description}
                      </p>

                      {/* Responsáveis */}
                      <div className="flex items-center space-x-2 text-xs text-slate-300">
                        <span className="text-slate-400 font-medium">Responsáveis:</span>
                        <span className="font-semibold text-indigo-300">
                          {step.responsible.join(', ')}
                        </span>
                      </div>

                      {/* Diagnostic Explicável de Bloqueio se houver */}
                      {isBlocked && (
                        <BlockadeBanner step={step} />
                      )}

                      {/* Botões de Ação */}
                      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                        
                        <button
                          onClick={() => onSimulateDelay(step.id)}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
                        >
                          Simular Atraso
                        </button>

                        {/* Botão de Aprovação (Human in the Loop) */}
                        {step.approval && !isCompleted && (
                          <button
                            onClick={() => onApproveStep(step.id)}
                            className="px-3 py-1.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 text-xs font-semibold flex items-center space-x-1 transition-all"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>Aprovar ({step.approval.approvedBy.length}/{step.approval.totalRequired})</span>
                          </button>
                        )}

                        {/* Botão Concluir/Avançar */}
                        {!isCompleted && (
                          <button
                            onClick={() => onAdvanceStep(step.id)}
                            disabled={isBlocked}
                            className={`px-4 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all ${
                              isBlocked
                                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md shadow-emerald-600/20 active:scale-95'
                            }`}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Concluir Etapa</span>
                          </button>
                        )}
                      </div>

                    </div>
                  );
                })}
              </div>

            </div>
          );
        })}

      </div>

    </div>
  );
};
