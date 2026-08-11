import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Mic, MicOff, Sparkles, X, Check, Volume2, Loader2, ArrowRight, 
  ShieldCheck, ShieldAlert, AlertTriangle, UserCheck, Lock, Edit3, 
  Lightbulb, CheckCircle2, HelpCircle, User, Zap
} from 'lucide-react';
import { Step, UserRole } from '../../engine/types';
import { voiceService } from '../../services/voiceService';

interface VoiceConsultantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmConsultantFlow: (data: {
    title: string;
    description: string;
    creatorRole: UserRole;
    hasFullAutonomy: boolean;
    requireAudit: boolean;
    prescribedSteps: Partial<Step>[];
  }) => void;
}

export const VoiceConsultantModal: React.FC<VoiceConsultantModalProps> = ({
  isOpen,
  onClose,
  onConfirmConsultantFlow
}) => {
  const { t } = useTranslation();

  // Wizard Step State (1: Input/Speech, 2: User Role & Autonomy, 3: AI Diagnostic)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Input Data State
  const [isListening, setIsListening] = useState(false);
  const [userInputText, setUserInputText] = useState('');
  const [voiceError, setVoiceError] = useState<string | null>(null);

  // Role & Autonomy State
  const [selectedRole, setSelectedRole] = useState<UserRole>('operacional');
  const [hasFullAutonomy, setHasFullAutonomy] = useState<boolean>(false);
  const [targetPhaseForApproval, setTargetPhaseForApproval] = useState<string>('ai_audit');

  // AI Diagnostic Loading
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  if (!isOpen) return null;

  // Toggle Voice Recognition
  const handleToggleVoice = () => {
    setVoiceError(null);

    if (isListening) {
      voiceService.stopListening();
      setIsListening(false);
    } else {
      if (!voiceService.isSupported()) {
        setVoiceError(t('hero.voiceError', 'O seu navegador não suporta captura de voz nativa. Digite suas instruções no campo abaixo.'));
        return;
      }

      setIsListening(true);
      voiceService.startListening(
        (res) => {
          setUserInputText(res.transcript);
        },
        (err) => {
          console.error('Erro de áudio:', err);
          setVoiceError('Erro ao capturar áudio. Digite no campo abaixo.');
          setIsListening(false);
        }
      );
    }
  };

  // Run AI Diagnostic Analysis
  const handleRunDiagnostic = () => {
    if (isListening) {
      voiceService.stopListening();
      setIsListening(false);
    }

    setIsAnalyzing(true);

    setTimeout(() => {
      setIsAnalyzing(false);
      setCurrentStep(3);
    }, 1400);
  };

  // Final Action: Injetar Fluxo no Vurio Pulse Flow
  const handleFinalSubmit = () => {
    const raw = userInputText.trim();
    const title = raw.length > 50 ? raw.slice(0, 48) + '...' : raw;
    const lower = raw.toLowerCase();

    // Gerar passos prescritos de acordo com nível e autonomia do usuário
    const prescribedSteps: Partial<Step>[] = [
      {
        title: `Start: ${title}`,
        description: `Entrada do Fluxo iniciada pelo nível ${selectedRole.toUpperCase()}`,
        stageId: 'start',
        metricType: 'deadline',
        deadlineData: { totalHours: 48, remainingHours: 48 }
      },
      {
        title: `Análise & Execução do Fluxo`,
        description: `Desenvolvimento técnico e validação preliminar do Fluxo`,
        stageId: 'in_analysis',
        metricType: lower.includes('r$') || lower.includes('orçamento') ? 'budget' : 'deadline',
        budgetData: lower.includes('r$') ? { targetAmount: 6000, spentAmount: 1500, currency: 'R$' } : undefined,
        deadlineData: { totalHours: 72, remainingHours: 60 }
      }
    ];

    // Se o usuário NÃO tem autonomia total, injeta a trava de aprovação de alçada
    if (!hasFullAutonomy) {
      prescribedSteps.push({
        title: `Autorização de Alçada (${selectedRole === 'operacional' ? 'Gerência' : 'Diretoria'})`,
        description: `Trava de segurança: Este Fluxo exige autorização formal de alçada superior para evoluir.`,
        stageId: 'ai_audit',
        status: 'blocked',
        aiAudit: {
          required: true,
          allowedTypes: ['pdf', 'png', 'jpg'],
          status: 'pending'
        },
        exceptionRule: {
          hasRequested: true,
          requiredRole: selectedRole === 'operacional' ? 'gerencia' : 'diretoria',
          status: 'pending'
        }
      });
    }

    onConfirmConsultantFlow({
      title,
      description: `Fluxo criado via Consultoria de IA com perfil ${selectedRole.toUpperCase()} (${hasFullAutonomy ? 'Autonomia Total' : 'Autonomia Parcial - Trava de Autorização Exigida'})`,
      creatorRole: selectedRole,
      hasFullAutonomy,
      requireAudit: !hasFullAutonomy,
      prescribedSteps
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4">
      <div className="bg-slate-900 border border-indigo-500/40 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative overflow-hidden">
        
        {/* Decorative ambient gradient */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                IA Consultiva & Prescritiva do Fluxo
              </h3>
              <p className="text-xs text-slate-400">
                Diagnóstico de falhas, riscos preditivos e prescrição de travas de autorização
              </p>
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

        {/* Progress Stepper (Step 1 -> Step 2 -> Step 3) */}
        <div className="flex items-center justify-between px-2 mb-6">
          <div className={`flex items-center gap-2 text-xs font-bold ${currentStep >= 1 ? 'text-indigo-400' : 'text-slate-600'}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] ${currentStep >= 1 ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-500'}`}>1</span>
            <span>Transcrição</span>
          </div>
          <div className={`h-0.5 flex-1 mx-2 ${currentStep >= 2 ? 'bg-indigo-600' : 'bg-slate-800'}`} />
          <div className={`flex items-center gap-2 text-xs font-bold ${currentStep >= 2 ? 'text-indigo-400' : 'text-slate-600'}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] ${currentStep >= 2 ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-500'}`}>2</span>
            <span>Nível & Autonomia</span>
          </div>
          <div className={`h-0.5 flex-1 mx-2 ${currentStep >= 3 ? 'bg-indigo-600' : 'bg-slate-800'}`} />
          <div className={`flex items-center gap-2 text-xs font-bold ${currentStep === 3 ? 'text-indigo-400' : 'text-slate-600'}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] ${currentStep === 3 ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-500'}`}>3</span>
            <span>Diagnóstico IA</span>
          </div>
        </div>

        {/* STEP 1: CAPTURA DE VOZ / TEXTO ("É isso que você quer estruturar em seu Fluxo?") */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <div className="text-center py-3">
              <button
                type="button"
                onClick={handleToggleVoice}
                className={`relative w-20 h-20 rounded-full mx-auto flex items-center justify-center transition-all ${
                  isListening
                    ? 'bg-rose-500 text-white animate-pulse shadow-lg shadow-rose-500/50 ring-8 ring-rose-500/20'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-xl shadow-indigo-600/40 hover:scale-105'
                }`}
              >
                {isListening ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
              </button>
              <span className="text-xs font-medium text-slate-300 block mt-2.5">
                {isListening ? 'Ouvindo e transcrevendo em tempo real...' : 'Clique no microfone para ditar ou digite abaixo'}
              </span>
            </div>

            {voiceError && (
              <div className="p-3 bg-amber-950/60 border border-amber-500/40 rounded-xl text-amber-200 text-xs">
                {voiceError}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-indigo-400" />
                "É isso que você quer estruturar em seu Fluxo?" (Confirme ou Edite):
              </label>
              <textarea
                rows={3}
                value={userInputText}
                onChange={e => setUserInputText(e.target.value)}
                placeholder="Ex: 'Contratar fornecedor de TI para nova filial até sexta-feira com orçamento de R$ 8.000...'"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                disabled={!userInputText.trim()}
                className="px-5 py-2 text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl shadow-md transition-all flex items-center gap-2"
              >
                <span>Avançar para Nível & Autonomia</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: NÍVEL DO USUÁRIO & AUTONOMIA NO FLUXO */}
        {currentStep === 2 && (
          <div className="space-y-5">
            {/* 1. Nível do Usuário */}
            <div>
              <label className="block text-xs font-bold text-slate-200 mb-2 flex items-center gap-1.5">
                <User className="w-4 h-4 text-indigo-400" />
                1. Qual o seu nível de atuação ao inserir este Fluxo?
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedRole('operacional')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    selectedRole === 'operacional'
                      ? 'border-indigo-500 bg-indigo-500/10 text-indigo-200 font-bold shadow-md'
                      : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="text-xs">👤 Operacional</div>
                  <span className="text-[10px] opacity-75 block mt-0.5">Analista / Técnico</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedRole('gerencia')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    selectedRole === 'gerencia'
                      ? 'border-indigo-500 bg-indigo-500/10 text-indigo-200 font-bold shadow-md'
                      : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="text-xs">🛡️ Gerência</div>
                  <span className="text-[10px] opacity-75 block mt-0.5">Coordenador / Gestor</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedRole('diretoria')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    selectedRole === 'diretoria'
                      ? 'border-indigo-500 bg-indigo-500/10 text-indigo-200 font-bold shadow-md'
                      : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="text-xs">👑 Diretoria</div>
                  <span className="text-[10px] opacity-75 block mt-0.5">Executivo / C-Level</span>
                </button>
              </div>
            </div>

            {/* 2. Autonomia no Fluxo */}
            <div>
              <label className="block text-xs font-bold text-slate-200 mb-2 flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-emerald-400" />
                2. Você possui autonomia total para decidir o Fluxo do início ao fim?
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setHasFullAutonomy(true)}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    hasFullAutonomy
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-200 font-bold shadow-md'
                      : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2 text-xs font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Autonomia Total
                  </div>
                  <p className="text-[11px] opacity-80 mt-1">
                    Posso aprovar e movimentar todas as fases sem solicitar autorização externa.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setHasFullAutonomy(false)}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    !hasFullAutonomy
                      ? 'border-amber-500 bg-amber-500/10 text-amber-200 font-bold shadow-md'
                      : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2 text-xs font-bold">
                    <ShieldAlert className="w-4 h-4 text-amber-400" />
                    Autonomia Parcial
                  </div>
                  <p className="text-[11px] opacity-80 mt-1">
                    Em determinada fase será necessária autorização de alçada superior.
                  </p>
                </button>
              </div>
            </div>

            {/* Se Autonomia Parcial, indicar fase */}
            {!hasFullAutonomy && (
              <div className="p-3 bg-amber-950/30 border border-amber-500/30 rounded-xl text-xs space-y-2">
                <span className="font-semibold text-amber-300 block">
                  A IA injetará uma Trava de Autorização de Alçada na fase de auditoria/aprovação financeira.
                </span>
              </div>
            )}

            <div className="flex justify-between pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="px-4 py-2 text-xs text-slate-400 hover:text-slate-200 rounded-xl"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={handleRunDiagnostic}
                disabled={isAnalyzing}
                className="px-5 py-2 text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-md transition-all flex items-center gap-2"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Executando Diagnóstico IA...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 text-amber-300" />
                    Gerar Diagnóstico & Prescrição IA
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: PAINEL DE DIAGNÓSTICO EM 3 PILARES (CONSULTIVO, PREDITIVO E PRESCRITIVO) */}
        {currentStep === 3 && (
          <div className="space-y-4">
            
            {/* 🔍 Consultivo */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-indigo-500/30 space-y-1">
              <span className="text-[10px] font-extrabold text-indigo-400 uppercase tracking-wider flex items-center gap-1">
                🔍 Diagnóstico Consultivo de IA (Análise de Omissões)
              </span>
              <p className="text-xs text-slate-200 leading-relaxed">
                Identificamos que este Fluxo criado pelo nível <strong className="text-indigo-300 uppercase">{selectedRole}</strong> {!hasFullAutonomy ? 'exige validação formal de orçamento e entrega para evitar estouro de custos.' : 'possui autonomia livre sem pendências de terceiros.'}
              </p>
            </div>

            {/* 🔮 Preditivo */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-amber-500/30 space-y-1">
              <span className="text-[10px] font-extrabold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                🔮 Análise Preditiva de Riscos
              </span>
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span>Risco de Atraso em Documentação:</span>
                <span className="font-extrabold text-amber-400">Baixo (15%)</span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span>Risco de Gargalo de Alçada:</span>
                <span className={`font-extrabold ${!hasFullAutonomy ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {!hasFullAutonomy ? 'Médio (Trava Ativa)' : 'Zero (Liberado)'}
                </span>
              </div>
            </div>

            {/* 💊 Prescritivo */}
            <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 space-y-2">
              <span className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                💊 Prescrição IA (Ações Sugeridas Prontas)
              </span>
              <ul className="text-xs text-emerald-200 space-y-1 pl-4 list-disc">
                <li>Medidor Regressivo de Prazo ajustado para 48h com alerta Verde ➔ Vermelho.</li>
                {!hasFullAutonomy && <li>Trava de Autorização de Alçada ({selectedRole === 'operacional' ? 'Gerência' : 'Diretoria'}) injetada no Vurio Pulse Flow.</li>}
                <li>WIP Limit antiprocrastinação ativo no estágio Start.</li>
              </ul>
            </div>

            {/* Submit Action */}
            <div className="flex justify-between items-center pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200"
              >
                Ajustar Perfil
              </button>

              <button
                type="button"
                onClick={handleFinalSubmit}
                className="px-6 py-2.5 text-xs font-extrabold bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white rounded-xl shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                Estruturar Fluxo no Vurio Pulse Flow
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
