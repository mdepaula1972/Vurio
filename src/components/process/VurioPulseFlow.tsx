import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Process, Step, PulseStage, MetricType, AIAuditInfo, ExceptionRule, StepStatus
} from '../../engine/types';
import { 
  ShieldAlert, ShieldCheck, Clock, DollarSign, Plus, Mic, MessageSquare, 
  RotateCw, AlertTriangle, ArrowRight, CheckCircle2, ChevronRight, Lock, 
  Sparkles, Layers, Zap, Scale, FileText, Info
} from 'lucide-react';
import { AIAuditUploadModal } from './AIAuditUploadModal';
import { ExceptionOverrideModal } from './ExceptionOverrideModal';
import { VoiceWhatsAppInputModal } from './VoiceWhatsAppInputModal';
import { VoiceConsultantModal } from '../copilot/VoiceConsultantModal';
import { UserRole } from '../../engine/types';

interface VurioPulseFlowProps {
  process: Process;
  onUpdateProcess: (updatedProcess: Process) => void;
}

export const VurioPulseFlow: React.FC<VurioPulseFlowProps> = ({
  process,
  onUpdateProcess
}) => {
  const { t } = useTranslation();

  const DEFAULT_PULSE_STAGES: PulseStage[] = [
    {
      id: 'start',
      name: t('pulseFlow.stages.start'),
      weight: 15,
      wipLimit: 3,
      color: 'from-amber-500/20 to-amber-600/10 border-amber-500/30',
      description: t('pulseFlow.stages.startDesc')
    },
    {
      id: 'in_analysis',
      name: t('pulseFlow.stages.in_analysis'),
      weight: 30,
      wipLimit: 4,
      color: 'from-blue-500/20 to-blue-600/10 border-blue-500/30',
      description: t('pulseFlow.stages.in_analysisDesc')
    },
    {
      id: 'ai_audit',
      name: t('pulseFlow.stages.ai_audit'),
      weight: 35,
      wipLimit: null,
      color: 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/30',
      description: t('pulseFlow.stages.ai_auditDesc')
    },
    {
      id: 'completed',
      name: t('pulseFlow.stages.completed'),
      weight: 20,
      wipLimit: null,
      color: 'from-teal-500/20 to-teal-600/10 border-teal-500/30',
      description: t('pulseFlow.stages.completedDesc')
    }
  ];

  const [stages, setStages] = useState<PulseStage[]>(process.stages || DEFAULT_PULSE_STAGES);
  const [viewOrientation, setViewOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [wipWarning, setWipWarning] = useState<string | null>(null);

  // Modais State
  const [auditStep, setAuditStep] = useState<Step | null>(null);
  const [exceptionStep, setExceptionStep] = useState<Step | null>(null);
  const [isVoiceWhatsOpen, setIsVoiceWhatsOpen] = useState(false);
  const [isConsultantOpen, setIsConsultantOpen] = useState(false);

  // Mapeamento de Steps por Estágio (fallback se stageId não existir)
  const stepsByStage = stages.reduce((acc, stage) => {
    acc[stage.id] = process.steps.filter(step => {
      if (step.stageId) return step.stageId === stage.id;
      // Fallbacks padrão se não tiver stageId
      if (stage.id === 'start') return step.status === 'not_started';
      if (stage.id === 'in_analysis') return step.status === 'in_progress';
      if (stage.id === 'ai_audit') return step.status === 'blocked';
      if (stage.id === 'completed') return step.status === 'completed';
      return false;
    });
    return acc;
  }, {} as Record<string, Step[]>);

  // Cálculo de Progresso Ponderado do Projeto
  const totalWeight = stages.reduce((sum, st) => sum + st.weight, 0);
  const currentWeightedProgress = stages.reduce((accum, stage) => {
    const stepsInStage = stepsByStage[stage.id] || [];
    if (stepsInStage.length === 0) return accum;
    const stageProgressRate = stage.id === 'completed' ? 1.0 : (stage.id === 'ai_audit' ? 0.8 : (stage.id === 'in_analysis' ? 0.5 : 0.2));
    return accum + (stage.weight * stageProgressRate);
  }, 0);

  // Manipulador para mover cards de etapa
  const handleMoveStep = (step: Step, targetStageId: string) => {
    const targetStage = stages.find(s => s.id === targetStageId);
    if (!targetStage) return;

    // 1. Checa WIP Limit na coluna destino (Antiprocrastinação)
    const targetCurrentCount = (stepsByStage[targetStageId] || []).length;
    if (targetStage.wipLimit && targetCurrentCount >= targetStage.wipLimit) {
      setWipWarning(
        `Regra Antiprocrastinação! A etapa "${targetStage.name}" atingiu o limite máximo de ${targetStage.wipLimit} tarefas. Para inserir uma nova, é obrigatório concluir ou excluir uma existente!`
      );
      setTimeout(() => setWipWarning(null), 5000);
      return;
    }

    // 2. Se a etapa de destino for Auditoria IA e a tarefa exigir anexo sem estar aprovada
    if (targetStageId === 'ai_audit' && step.aiAudit?.required && step.aiAudit.status !== 'approved') {
      setAuditStep(step);
      return;
    }

    // Atualiza o passo no processo
    const newStatus = targetStageId === 'completed' ? 'completed' : (targetStageId === 'ai_audit' ? 'blocked' : 'in_progress');
    const updatedSteps = process.steps.map(s => {
      if (s.id === step.id) {
        return {
          ...s,
          stageId: targetStageId,
          status: newStatus as StepStatus,
          completedAt: targetStageId === 'completed' ? new Date().toISOString() : undefined
        };
      }
      return s;
    });

    onUpdateProcess({
      ...process,
      steps: updatedSteps,
      stages: stages,
      metrics: {
        ...(process.metrics || { healthScore: 90, timeSavedHours: 12, criticalPathCount: 2 }),
        weightedProgress: Math.round(currentWeightedProgress)
      }
    });
  };

  // Callback ao finalizar auditoria de IA
  const handleAuditComplete = (stepId: string, isSuccess: boolean, fileName: string, feedback: string) => {
    const updatedSteps = process.steps.map(s => {
      if (s.id === stepId) {
        return {
          ...s,
          stageId: 'completed',
          status: 'completed' as const,
          aiAudit: {
            required: true,
            allowedTypes: ['pdf'],
            status: isSuccess ? 'approved' as const : 'rejected' as const,
            fileName: fileName,
            feedback: feedback,
            auditedAt: new Date().toISOString()
          }
        };
      }
      return s;
    });

    onUpdateProcess({
      ...process,
      steps: updatedSteps
    });
  };

  // Callback de aprovação de exceção (Gerência / Diretoria)
  const handleApproveException = (stepId: string, role: 'gerencia' | 'diretoria', extendedHours: number, justification: string) => {
    const updatedSteps = process.steps.map(s => {
      if (s.id === stepId) {
        return {
          ...s,
          stageId: 'in_analysis',
          status: 'in_progress' as const,
          deadlineData: s.deadlineData ? {
            ...s.deadlineData,
            remainingHours: s.deadlineData.remainingHours + extendedHours
          } : { totalHours: 48, remainingHours: extendedHours },
          exceptionRule: {
            hasRequested: true,
            requiredRole: role,
            status: 'approved' as const,
            reason: justification,
            approvedBy: role === 'diretoria' ? 'Diretoria de Operações' : 'Gerência de Projetos',
            approvedAt: new Date().toISOString(),
            extendedHours: extendedHours
          }
        };
      }
      return s;
    });

    onUpdateProcess({
      ...process,
      steps: updatedSteps
    });
  };

  // Adicionar nova tarefa via IA (Voz / WhatsApp)
  const handleAddStepFromAI = (newStepData: Partial<Step>) => {
    const newStep: Step = {
      id: `step-${Date.now()}`,
      title: newStepData.title || 'Nova Tarefa por Voz',
      description: newStepData.description || 'Criado via entrada mobile',
      stageId: 'start',
      layer: 1,
      status: 'not_started',
      responsible: ['Você (Gestor)'],
      dependencies: [],
      metricType: newStepData.metricType || 'deadline',
      budgetData: newStepData.budgetData || { targetAmount: 3000, spentAmount: 500, currency: 'R$' },
      deadlineData: newStepData.deadlineData || { totalHours: 48, remainingHours: 32 },
      aiAudit: newStepData.aiAudit || { required: true, allowedTypes: ['pdf'], status: 'none' }
    };

    // Checa limitação no Start
    const currentStartCount = (stepsByStage['start'] || []).length;
    if (currentStartCount >= (stages.find(s => s.id === 'start')?.wipLimit || 3)) {
      setWipWarning("Não é possível inserir no Start: limite WIP antiprocrastinação atingido! Exclua ou conclua uma tarefa antes.");
      setTimeout(() => setWipWarning(null), 5000);
      return;
    }

    onUpdateProcess({
      ...process,
      steps: [newStep, ...process.steps]
    });
  };

  return (
    <div className="space-y-6 select-none">

      {/* Header do Módulo Vurio Pulse Flow */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
                <Zap className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                  {t('pulseFlow.title')}
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-semibold border border-emerald-500/30">
                    {t('pulseFlow.badge')}
                  </span>
                </h2>
                <p className="text-xs text-slate-400">
                  {t('pulseFlow.description')}
                </p>
              </div>
            </div>
          </div>

          {/* Medidor Ponderado de Progresso Global + Orientação */}
          <div className="flex items-center space-x-3">
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 flex items-center space-x-3">
              <Scale className="w-5 h-5 text-indigo-400" />
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-medium">
                  {t('pulseFlow.weightedProgress')}
                </span>
                <span className="text-base font-extrabold text-emerald-400">
                  {Math.round(currentWeightedProgress)}% <span className="text-xs font-normal text-slate-400">/ 100%</span>
                </span>
              </div>
            </div>

            {/* Alternador de Orientação Mobile (Landscape / Portrait) */}
            <button
              onClick={() => setViewOrientation(prev => prev === 'portrait' ? 'landscape' : 'portrait')}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 transition-all flex items-center gap-1.5 text-xs font-medium"
              title={t('pulseFlow.panoramaMode')}
            >
              <RotateCw className={`w-4 h-4 text-indigo-400 transition-transform ${viewOrientation === 'landscape' ? 'rotate-90 text-emerald-400' : ''}`} />
              <span className="hidden sm:inline">
                {viewOrientation === 'portrait' ? t('pulseFlow.cardsMobile') : t('pulseFlow.panoramaMode')}
              </span>
            </button>

            {/* Botão IA Consultiva & Prescritiva */}
            <button
              onClick={() => setIsConsultantOpen(true)}
              className="px-3.5 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-violet-600/30 transition-all flex items-center gap-1.5"
              title="IA Consultiva, Preditiva & Prescritiva (Diagnóstico e Autonomia de Alçada)"
            >
              <Sparkles className="w-4 h-4 text-emerald-300" />
              <span>IA Consultiva</span>
            </button>

            {/* Criar via Voz / WhatsApp */}
            <button
              onClick={() => setIsVoiceWhatsOpen(true)}
              className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2"
            >
              <Mic className="w-4 h-4" />
              <MessageSquare className="w-4 h-4" />
              <span>{t('pulseFlow.voiceWhatsBtn')}</span>
            </button>
          </div>
        </div>

        {/* Warning Banner de WIP Limit */}
        {wipWarning && (
          <div className="mt-4 p-3.5 bg-amber-950/70 border border-amber-500/60 rounded-xl text-amber-200 text-xs flex items-center space-x-3 animate-bounce">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
            <div className="flex-1 font-medium">{wipWarning}</div>
          </div>
        )}
      </div>

      {/* QUADRO DE COLUNAS VURIO PULSE FLOW */}
      <div className={`grid gap-4 transition-all ${
        viewOrientation === 'landscape'
          ? 'grid-cols-1 md:grid-cols-4 overflow-x-auto min-w-[900px] pb-4'
          : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
      }`}>
        {stages.map((stage) => {
          const stageSteps = stepsByStage[stage.id] || [];
          const isStartColumn = stage.id === 'start';
          const isAtWipLimit = isStartColumn && stage.wipLimit && stageSteps.length >= stage.wipLimit;

          return (
            <div
              key={stage.id}
              className={`bg-slate-900/90 border rounded-2xl p-4 flex flex-col min-h-[480px] shadow-lg relative transition-all ${stage.color}`}
            >
              {/* Header da Coluna com Regras e Pesos */}
              <div className="border-b border-slate-800 pb-3 mb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-bold text-sm text-slate-100">{stage.name}</h3>
                    <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] font-extrabold text-indigo-300 border border-slate-700">
                      {t('pulseFlow.weight')}: {stage.weight}%
                    </span>
                  </div>

                  {/* Badge de Contagem / WIP Limit */}
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    isAtWipLimit
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
                      : 'bg-slate-800 text-slate-300 border border-slate-700'
                  }`}>
                    {stageSteps.length}
                    {stage.wipLimit ? ` / ${stage.wipLimit} ${t('pulseFlow.maxLimit')}` : ''}
                  </span>
                </div>

                <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                  <Info className="w-3 h-3 text-slate-500" />
                  {stage.description}
                </p>
              </div>

              {/* Botão de Criação Rápida no Start */}
              {isStartColumn && (
                <button
                  onClick={() => setIsVoiceWhatsOpen(true)}
                  disabled={!!isAtWipLimit}
                  className={`w-full py-2.5 px-3 rounded-xl border border-dashed text-xs font-semibold flex items-center justify-center gap-2 mb-3 transition-all ${
                    isAtWipLimit
                      ? 'border-rose-500/30 text-rose-400/60 bg-rose-950/20 cursor-not-allowed'
                      : 'border-amber-500/40 text-amber-300 bg-amber-500/5 hover:bg-amber-500/15 hover:border-amber-400'
                  }`}
                >
                  <Plus className="w-4 h-4" />
                  {isAtWipLimit ? t('pulseFlow.wipBlocked') : t('pulseFlow.newItemStart')}
                </button>
              )}

              {/* Lista de Cards da Coluna */}
              <div className="flex-1 space-y-3 overflow-y-auto pr-1">
                {stageSteps.length === 0 ? (
                  <div className="h-32 flex flex-col items-center justify-center border-2 border-dashed border-slate-800 rounded-xl text-center p-3">
                    <Layers className="w-6 h-6 text-slate-600 mb-1" />
                    <span className="text-xs text-slate-500">{t('pulseFlow.noTasks')}</span>
                  </div>
                ) : (
                  stageSteps.map((step) => (
                    <PulseCard
                      key={step.id}
                      step={step}
                      stage={stage}
                      allStages={stages}
                      onMove={(targetStageId) => handleMoveStep(step, targetStageId)}
                      onOpenAudit={() => setAuditStep(step)}
                      onOpenException={() => setExceptionStep(step)}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAIS COMPONENTES */}
      {auditStep && (
        <AIAuditUploadModal
          step={auditStep}
          isOpen={!!auditStep}
          onClose={() => setAuditStep(null)}
          onAuditComplete={handleAuditComplete}
        />
      )}

      {exceptionStep && (
        <ExceptionOverrideModal
          step={exceptionStep}
          isOpen={!!exceptionStep}
          onClose={() => setExceptionStep(null)}
          onApproveException={handleApproveException}
        />
      )}

      <VoiceWhatsAppInputModal
        isOpen={isVoiceWhatsOpen}
        onClose={() => setIsVoiceWhatsOpen(false)}
        onAddStepFromAI={handleAddStepFromAI}
      />

      <VoiceConsultantModal
        isOpen={isConsultantOpen}
        onClose={() => setIsConsultantOpen(false)}
        onConfirmConsultantFlow={({ title, description, creatorRole, hasFullAutonomy, prescribedSteps }) => {
          const generatedSteps: Step[] = prescribedSteps.map((pStep, index) => ({
            id: `consult-step-${Date.now()}-${index}`,
            title: pStep.title || title,
            description: pStep.description || description,
            stageId: pStep.stageId || 'start',
            layer: index + 1,
            status: pStep.status || 'in_progress',
            responsible: [creatorRole.toUpperCase()],
            dependencies: [],
            metricType: pStep.metricType || 'deadline',
            budgetData: pStep.budgetData,
            deadlineData: pStep.deadlineData || { totalHours: 48, remainingHours: 48 },
            aiAudit: pStep.aiAudit,
            exceptionRule: pStep.exceptionRule
          }));

          onUpdateProcess({
            ...process,
            creatorRole,
            hasFullAutonomy,
            steps: [...generatedSteps, ...process.steps]
          });
        }}
      />

    </div>
  );
};

// ==========================================
// COMPONENTE DO CARD DE TAREFA (PULSE CARD)
// Contém as Barras de Prazo/Orçamento Inversas
// ==========================================
interface PulseCardProps {
  step: Step;
  stage: PulseStage;
  allStages: PulseStage[];
  onMove: (targetStageId: string) => void;
  onOpenAudit: () => void;
  onOpenException: () => void;
}

const PulseCard: React.FC<PulseCardProps> = ({
  step,
  stage,
  allStages,
  onMove,
  onOpenAudit,
  onOpenException
}) => {
  const { t } = useTranslation();

  // 1. Métrica de Prazo: Barra Regressiva (Direita -> Esquerda)
  const remainingHours = step.deadlineData?.remainingHours ?? 32;
  const totalHours = step.deadlineData?.totalHours ?? 48;
  const deadlinePercent = Math.max(0, Math.min(100, (remainingHours / totalHours) * 100));

  // Cores dinâmicas para o Prazo
  let deadlineColor = 'bg-emerald-500';
  let deadlineTextColor = 'text-emerald-400';
  if (deadlinePercent < 20) {
    deadlineColor = 'bg-rose-500';
    deadlineTextColor = 'text-rose-400';
  } else if (deadlinePercent < 50) {
    deadlineColor = 'bg-amber-500';
    deadlineTextColor = 'text-amber-400';
  }

  // 2. Métrica de Orçamento: Barra Regressiva (Direita -> Esquerda conforme consome)
  const spentAmount = step.budgetData?.spentAmount ?? 1200;
  const targetAmount = step.budgetData?.targetAmount ?? 3000;
  const budgetRemainingPercent = Math.max(0, Math.min(100, ((targetAmount - spentAmount) / targetAmount) * 100));

  let budgetColor = 'bg-emerald-500';
  let budgetTextColor = 'text-emerald-400';
  if (budgetRemainingPercent < 20) {
    budgetColor = 'bg-rose-500';
    budgetTextColor = 'text-rose-400';
  } else if (budgetRemainingPercent < 50) {
    budgetColor = 'bg-amber-500';
    budgetTextColor = 'text-amber-400';
  }

  // Encontrar próxima etapa
  const currentIndex = allStages.findIndex(s => s.id === stage.id);
  const nextStage = allStages[currentIndex + 1];

  return (
    <div className="bg-slate-950 border border-slate-800 hover:border-indigo-500/50 rounded-xl p-3.5 shadow-md transition-all space-y-3 group">
      
      {/* Header do Card */}
      <div className="flex items-start justify-between gap-2">
        <h4 className="font-semibold text-xs text-slate-100 group-hover:text-indigo-300 transition-colors leading-snug">
          {step.title}
        </h4>

        {/* Badge Auditoria IA Status */}
        {step.aiAudit?.required && (
          <span
            onClick={onOpenAudit}
            className={`cursor-pointer px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 border shrink-0 ${
              step.aiAudit.status === 'approved'
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30 animate-pulse'
            }`}
            title="Clique para abrir auditoria da IA"
          >
            <ShieldCheck className="w-3 h-3" />
            {step.aiAudit.status === 'approved' ? t('pulseFlow.auditOk') : t('pulseFlow.auditRequired')}
          </span>
        )}
      </div>

      <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
        {step.description}
      </p>

      {/* BARRA REGRESSIVA DE PRAZO (Direita -> Esquerda) */}
      <div className="bg-slate-900 border border-slate-800/80 rounded-lg p-2 space-y-1">
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-slate-400 flex items-center gap-1 font-medium">
            <Clock className="w-3 h-3 text-slate-400" />
            {t('pulseFlow.countdownDeadline')}
          </span>
          <span className={`font-extrabold ${deadlineTextColor}`}>
            {remainingHours}{t('pulseFlow.hoursRemaining')} ({Math.round(deadlinePercent)}%)
          </span>
        </div>

        {/* Barra de Progresso Inversa (Align-Right) */}
        <div className="h-1.5 bg-slate-950 rounded-full overflow-hidden flex justify-end">
          <div
            className={`h-full ${deadlineColor} transition-all duration-500`}
            style={{ width: `${deadlinePercent}%` }}
          />
        </div>
      </div>

      {/* BARRA REGRESSIVA DE ORÇAMENTO (💰 Realizado x Target) */}
      {step.budgetData && (
        <div className="bg-slate-900 border border-slate-800/80 rounded-lg p-2 space-y-1">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-slate-400 flex items-center gap-1 font-medium">
              <DollarSign className="w-3 h-3 text-emerald-400" />
              {t('pulseFlow.budgetSpent')}
            </span>
            <span className={`font-extrabold ${budgetTextColor}`}>
              R$ {spentAmount} / R$ {targetAmount}
            </span>
          </div>

          {/* Barra de Progresso Inversa Orçamento */}
          <div className="h-1.5 bg-slate-950 rounded-full overflow-hidden flex justify-end">
            <div
              className={`h-full ${budgetColor} transition-all duration-500`}
              style={{ width: `${budgetRemainingPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Regra de Exceção (Se aprovado pela Diretoria) */}
      {step.exceptionRule?.status === 'approved' && (
        <div className="p-2 rounded-lg bg-amber-950/40 border border-amber-500/30 text-[10px] text-amber-300 flex items-center gap-1.5">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>{t('pulseFlow.exceptionApproved', { hours: step.exceptionRule.extendedHours, by: step.exceptionRule.approvedBy })}</span>
        </div>
      )}

      {/* Botões de Ação do Card */}
      <div className="flex items-center justify-between pt-1 border-t border-slate-900">
        
        {/* Botão para Solicitar Exceção */}
        <button
          onClick={onOpenException}
          className="text-[10px] text-slate-400 hover:text-amber-300 flex items-center gap-1 py-1 px-1.5 rounded hover:bg-slate-900 transition-colors"
          title="Quebra de regra por Alçada (Diretoria/Gerência)"
        >
          <Lock className="w-3 h-3 text-amber-400" />
          {t('pulseFlow.exceptionBtn')}
        </button>

        {/* Botão de Avanço para Próxima Etapa */}
        {nextStage && (
          <button
            onClick={() => onMove(nextStage.id)}
            className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-200 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ml-auto"
          >
            {t('pulseFlow.advanceBtn')}
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

    </div>
  );
};
