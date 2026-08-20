/**
 * Vurio v1.3.0 — Gestor Inteligente de Processos com IA
 * ProcessGraphCanvas — Visualizador dinâmico de processo com Mapa de Conexões, Kanban, Timeline e Lista
 */
import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  GitFork, LayoutGrid, Calendar, ListFilter, Lock, CheckCircle2, Play, 
  Sparkles, DollarSign, ExternalLink, Clock, UserCheck, Activity, ArrowRight, ShieldAlert
} from 'lucide-react';
import { Process, Step, ProcessViewMode } from '../../engine/types';
import { groupStepsByLayer } from '../../engine/dependencyResolver';
import { BlockadeBanner } from './BlockadeBanner';

interface ProcessGraphCanvasProps {
  process: Process;
  onAdvanceStep: (stepId: string) => void;
  onApproveStep: (stepId: string) => void;
  onSimulateDelay: (stepId: string) => void;
}

export const ProcessGraphCanvas: React.FC<ProcessGraphCanvasProps> = ({
  process,
  onAdvanceStep,
  onApproveStep,
  onSimulateDelay,
}) => {
  const [viewMode, setViewMode] = useState<ProcessViewMode>('graph');
  const layerMap = useMemo(() => groupStepsByLayer(process.steps), [process.steps]);
  const sortedLayers = useMemo(() => Array.from(layerMap.keys()).sort((a, b) => a - b), [layerMap]);

  const stepsByStatus = useMemo(() => {
    const grouped: Record<Step['status'], Step[]> = {
      completed: [],
      blocked: [],
      in_progress: [],
      not_started: [],
    };
    for (let i = 0; i < process.steps.length; i++) {
      const step = process.steps[i];
      if (grouped[step.status]) {
        grouped[step.status].push(step);
      }
    }
    return grouped;
  }, [process.steps]);

  const totalSteps = process.steps.length || 1;
  const completedSteps = stepsByStatus.completed.length;
  const blockedSteps = stepsByStatus.blocked.length;
  const inProgressSteps = stepsByStatus.in_progress.length;
  const healthScore = process.metrics?.healthScore || Math.round((completedSteps / totalSteps) * 100);

  return (
    <div className="space-y-6">
      
      {/* HEADER DO PROCESSO COM HEALTH SCORE E CONTROL BAR */}
      <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden">
        
        {/* Background Glow Effect */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          
          {/* Informações Principais do Processo */}
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center space-x-2">
              <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold uppercase tracking-wider border border-indigo-500/30">
                {process.category}
              </span>
              {blockedSteps > 0 ? (
                <span className="px-3 py-1 rounded-full bg-red-500/20 text-red-400 text-xs font-bold border border-red-500/30 flex items-center space-x-1 animate-pulse">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>{blockedSteps} Gargalo(s) Detectado(s)</span>
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30 flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Fluxo Operacional Fluído</span>
                </span>
              )}
            </div>

            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              {process.name}
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              {process.description}
            </p>
          </div>

          {/* Card Indicador de Saúde Operacional (Health Gauge) */}
          <div className="flex items-center space-x-4 bg-slate-950/80 p-4 rounded-2xl border border-slate-800 shadow-inner">
            <div className="relative w-16 h-16 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-800"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className={healthScore >= 70 ? 'text-emerald-400' : healthScore >= 40 ? 'text-amber-400' : 'text-red-400'}
                  strokeDasharray={`${healthScore}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <span className="absolute text-sm font-black text-white">
                {healthScore}%
              </span>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Saúde do Fluxo
              </span>
              <p className="text-sm font-extrabold text-white mt-0.5">
                {completedSteps} de {totalSteps} concluídos
              </p>
              <p className="text-[11px] text-indigo-400 font-semibold">
                ~{process.metrics?.timeSavedHours || completedSteps * 4}h economizadas
              </p>
            </div>
          </div>

        </div>

        {/* SELETOR DE MODOS DE VISUALIZAÇÃO (TABS DE MODOS) */}
        <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-1.5 p-1 rounded-2xl bg-slate-950 border border-slate-800 w-full sm:w-auto">
            
            <button
              onClick={() => setViewMode('graph')}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition-all ${
                viewMode === 'graph'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-indigo-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <GitFork className="w-4 h-4" />
              <span>Mapa de Conexões</span>
            </button>

            <button
              onClick={() => setViewMode('kanban')}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition-all ${
                viewMode === 'kanban'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-indigo-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              <span>Kanban</span>
            </button>

            <button
              onClick={() => setViewMode('timeline')}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition-all ${
                viewMode === 'timeline'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-indigo-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Linha do Tempo</span>
            </button>

          </div>

          {/* Legenda de Status */}
          <div className="flex items-center space-x-3 text-[11px] font-semibold text-slate-400">
            <span className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span>Concluída</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse"></span>
              <span>Em Curso</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
              <span>Bloqueada</span>
            </span>
          </div>
        </div>

      </div>

      {/* VISTA 1: MAPA DE CONEXÕES / MAPA HIERÁRQUICO (DEFAULT) */}
      {viewMode === 'graph' && (
        <div className="space-y-8 relative">
          
          {/* Guia vertical visual */}
          <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-gradient-to-b from-indigo-500/50 via-slate-800 to-transparent hidden sm:block pointer-events-none" />

          {sortedLayers.map((layerNum) => {
            const stepsInLayer = layerMap.get(layerNum) || [];

            return (
              <div key={layerNum} className="relative space-y-4">
                
                {/* Layer Header Badge */}
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 text-indigo-300 flex items-center justify-center font-black text-sm shadow-md z-10">
                    C{layerNum}
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
                      Camada {layerNum}
                    </h3>
                    <span className="text-xs text-slate-400">
                      {stepsInLayer.length} {stepsInLayer.length === 1 ? 'etapa nesta fase' : 'etapas paralelas/convergentes nesta fase'}
                    </span>
                  </div>
                </div>

                {/* Grid de Cards da Camada */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:ml-16">
                  {stepsInLayer.map((step) => {
                    const isBlocked = step.status === 'blocked';
                    const isCompleted = step.status === 'completed';
                    const isInProgress = step.status === 'in_progress';

                    return (
                      <div
                        key={step.id}
                        className={`rounded-2xl border p-5 transition-all space-y-4 shadow-xl relative overflow-hidden ${
                          isCompleted
                            ? 'bg-slate-900/70 border-emerald-500/40 shadow-emerald-950/20'
                            : isBlocked
                            ? 'bg-slate-900 border-red-500/50 shadow-red-950/30'
                            : 'bg-slate-900 border-indigo-500/50 shadow-indigo-950/40 ring-1 ring-indigo-500/20'
                        }`}
                      >
                        {/* Glow indicator */}
                        <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-2xl pointer-events-none ${
                          isCompleted ? 'bg-emerald-500/10' : isBlocked ? 'bg-red-500/10' : 'bg-indigo-500/15'
                        }`} />

                        {/* Title & Status */}
                        <div className="flex items-start justify-between relative z-10">
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              Etapa #{step.id}
                            </span>
                            <h4 className="text-base font-extrabold text-white">
                              {step.title}
                            </h4>
                          </div>

                          <div>
                            {isCompleted && (
                              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/40 flex items-center space-x-1">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Concluída</span>
                              </span>
                            )}
                            {isBlocked && (
                              <span className="px-3 py-1 rounded-full bg-red-500/20 text-red-400 text-xs font-bold border border-red-500/40 flex items-center space-x-1">
                                <Lock className="w-3.5 h-3.5" />
                                <span>Bloqueada</span>
                              </span>
                            )}
                            {isInProgress && (
                              <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-500/40 flex items-center space-x-1 animate-pulse">
                                <Play className="w-3.5 h-3.5 fill-indigo-400" />
                                <span>Pronta / Executar</span>
                              </span>
                            )}
                          </div>
                        </div>

                        <p className="text-xs text-slate-300 leading-relaxed font-medium relative z-10">
                          {step.description}
                        </p>

                        {/* Responsáveis */}
                        <div className="flex items-center space-x-2 text-xs text-slate-300 pt-1 border-t border-slate-800">
                          <span className="text-slate-400 font-medium">Responsáveis:</span>
                          <span className="font-bold text-indigo-300">
                            {step.responsible.join(', ')}
                          </span>
                        </div>

                        {/* Banner Explicativo de Bloqueio da IA */}
                        {isBlocked && (
                          <BlockadeBanner step={step} />
                        )}

                        {/* Actions */}
                        <div className="pt-3 flex items-center justify-between gap-2 border-t border-slate-800/80">
                          <button
                            onClick={() => onSimulateDelay(step.id)}
                            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
                          >
                            Simular Atraso
                          </button>

                          {step.approval && !isCompleted && (
                            <button
                              onClick={() => onApproveStep(step.id)}
                              className="px-3 py-1.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 text-xs font-bold flex items-center space-x-1 transition-all"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                              <span>Aprovar ({step.approval.approvedBy.length}/{step.approval.totalRequired})</span>
                            </button>
                          )}

                          {!isCompleted && (
                            <button
                              onClick={() => onAdvanceStep(step.id)}
                              disabled={isBlocked}
                              className={`px-4 py-1.5 rounded-xl text-xs font-extrabold flex items-center space-x-1.5 transition-all ${
                                isBlocked
                                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                  : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-600/20 active:scale-95'
                              }`}
                            >
                              <CheckCircle2 className="w-4 h-4" />
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
      )}

      {/* VISTA 2: KANBAN BOARD */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Coluna 1: Em Progresso / Prontas */}
          <div className="space-y-4 p-4 rounded-3xl bg-slate-900/60 border border-indigo-500/30">
            <h3 className="text-sm font-extrabold text-indigo-300 flex items-center space-x-2">
              <Play className="w-4 h-4 text-indigo-400 fill-indigo-400" />
              <span>Em Progresso / Prontas ({stepsByStatus.in_progress.length})</span>
            </h3>

            {stepsByStatus.in_progress.map(s => (
              <div key={s.id} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 shadow-md">
                <h4 className="text-sm font-bold text-white">{s.title}</h4>
                <p className="text-xs text-slate-400">{s.description}</p>
                <button
                  onClick={() => onAdvanceStep(s.id)}
                  className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/20"
                >
                  Concluir Etapa
                </button>
              </div>
            ))}
          </div>

          {/* Coluna 2: Bloqueadas */}
          <div className="space-y-4 p-4 rounded-3xl bg-slate-900/60 border border-red-500/30">
            <h3 className="text-sm font-extrabold text-red-300 flex items-center space-x-2">
              <Lock className="w-4 h-4 text-red-400" />
              <span>Bloqueadas por Dependências ({stepsByStatus.blocked.length})</span>
            </h3>

            {stepsByStatus.blocked.map(s => (
              <div key={s.id} className="p-4 rounded-2xl bg-slate-900 border border-red-500/30 space-y-3 shadow-md">
                <h4 className="text-sm font-bold text-white">{s.title}</h4>
                <p className="text-xs text-slate-400">{s.description}</p>
                <BlockadeBanner step={s} />
              </div>
            ))}
          </div>

          {/* Coluna 3: Concluídas */}
          <div className="space-y-4 p-4 rounded-3xl bg-slate-900/60 border border-emerald-500/30">
            <h3 className="text-sm font-extrabold text-emerald-300 flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Concluídas ({stepsByStatus.completed.length})</span>
            </h3>

            {stepsByStatus.completed.map(s => (
              <div key={s.id} className="p-4 rounded-2xl bg-slate-900/80 border border-emerald-500/20 space-y-2 opacity-80">
                <h4 className="text-sm font-bold text-slate-200 line-through">{s.title}</h4>
                <p className="text-xs text-slate-500">{s.description}</p>
              </div>
            ))}
          </div>

        </div>
      )}

      {/* VISTA 3: TIMELINE / GANTT */}
      {viewMode === 'timeline' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl">
          <h3 className="text-lg font-extrabold text-white flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-indigo-400" />
            <span>Cronograma Sequencial de Avanço</span>
          </h3>

          <div className="space-y-4">
            {process.steps.map((s, idx) => (
              <div key={s.id} className="flex items-center space-x-4">
                <span className="w-8 h-8 rounded-full bg-slate-800 text-indigo-300 flex items-center justify-center font-bold text-xs">
                  {idx + 1}
                </span>

                <div className="flex-1 p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-white">{s.title}</h4>
                    <span className="text-xs text-slate-400">Responsável: {s.responsible.join(', ')}</span>
                  </div>

                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    s.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' : s.status === 'blocked' ? 'bg-red-500/20 text-red-400' : 'bg-indigo-500/20 text-indigo-300'
                  }`}>
                    {s.status === 'completed' ? 'Concluída' : s.status === 'blocked' ? 'Bloqueada' : 'Em Andamento'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
