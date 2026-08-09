/**
 * Vurio v1.0.0 — Gestor Inteligente de Processos com IA
 * Componente principal da aplicação
 */
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Navbar } from './components/layout/Navbar';
import { BottomNav } from './components/layout/BottomNav';
import { HeroPrompt } from './components/hero/HeroPrompt';
import { ProcessTreeView } from './components/process/ProcessTreeView';
import { SimulationModal } from './components/process/SimulationModal';
import { PartnerSection } from './components/partners/PartnerSection';
import { Process } from './engine/types';
import { generateProcessFromPrompt, PRESET_PROCESS_TEMPLATES } from './services/aiService';
import { resolveProcessState } from './engine/dependencyResolver';
import { ShieldAlert, Plus, Sparkles, FolderGit2, AlertTriangle, Layers } from 'lucide-react';

export const APP_VERSION = '1.0.0';


export default function App() {
  const { i18n, t } = useTranslation();
  const [currentLang, setCurrentLang] = useState('pt-BR');
  const [activeTab, setActiveTab] = useState<'home' | 'processes' | 'voice' | 'analytics' | 'partners'>('home');
  const [processes, setProcesses] = useState<Process[]>([]);
  const [selectedProcessId, setSelectedProcessId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [simulatingStepId, setSimulatingStepId] = useState<string | null>(null);

  // Inicializa o estado com processos padrão caso esteja vazio
  useEffect(() => {
    async function init() {
      const p1 = await generateProcessFromPrompt('Quero contratar um funcionário');
      const p2 = await generateProcessFromPrompt('Quero abrir uma empresa ou filial');
      setProcesses([p1, p2]);
      setSelectedProcessId(p1.id);
    }
    init();
  }, []);

  const handleLanguageChange = (lang: string) => {
    setCurrentLang(lang);
    i18n.changeLanguage(lang);
  };

  const handleGenerateProcess = async (promptText: string) => {
    setIsGenerating(true);
    try {
      const newProcess = await generateProcessFromPrompt(promptText);
      setProcesses(prev => [newProcess, ...prev]);
      setSelectedProcessId(newProcess.id);
      setActiveTab('processes');
    } catch (err) {
      console.error('Erro ao gerar processo:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAdvanceStep = (stepId: string) => {
    setProcesses(prev => prev.map(p => {
      if (p.id !== selectedProcessId) return p;

      const updatedSteps = p.steps.map(s => {
        if (s.id === stepId) {
          return {
            ...s,
            status: 'completed' as const,
            completedAt: new Date().toISOString()
          };
        }
        return s;
      });

      // Recalcula o motor de dependências para desobstruir etapas filhas
      return resolveProcessState({
        ...p,
        steps: updatedSteps
      });
    }));
  };

  const handleApproveStep = (stepId: string) => {
    setProcesses(prev => prev.map(p => {
      if (p.id !== selectedProcessId) return p;

      const updatedSteps = p.steps.map(s => {
        if (s.id === stepId && s.approval) {
          const currentApprovers = s.approval.approvedBy || [];
          const newApprovers = currentApprovers.includes('Você (Gestor)') 
            ? currentApprovers 
            : [...currentApprovers, 'Você (Gestor)'];
          
          return {
            ...s,
            approval: {
              ...s.approval,
              approvedBy: newApprovers
            }
          };
        }
        return s;
      });

      return resolveProcessState({
        ...p,
        steps: updatedSteps
      });
    }));
  };

  const selectedProcess = processes.find(p => p.id === selectedProcessId);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col pb-20 sm:pb-8">
      
      {/* Navbar Superior */}
      <Navbar
        activeProcessesCount={processes.length}
        maxFreeProcesses={3}
        onNewProcessClick={() => {
          setActiveTab('home');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        currentLang={currentLang}
        onLanguageChange={handleLanguageChange}
      />

      {/* Conteúdo Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        
        {/* Banner Freemium se atingir o limite */}
        {processes.length >= 3 && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span>{t('freemium.banner')}</span>
            </div>
            <button className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-colors">
              {t('freemium.upgrade')}
            </button>
          </div>
        )}

        {/* Tab Início / Prompt IA */}
        {(activeTab === 'home' || activeTab === 'voice') && (
          <div className="space-y-8">
            <HeroPrompt
              onGenerateProcess={handleGenerateProcess}
              isGenerating={isGenerating}
            />

            {/* Lista dos Processos Ativos */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-extrabold text-white flex items-center space-x-2">
                  <FolderGit2 className="w-5 h-5 text-indigo-400" />
                  <span>Seus Processos em Andamento</span>
                </h3>
                <span className="text-xs text-slate-400 font-medium">
                  {processes.length} de 3 ativos (Plano Gratuito)
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {processes.map((proc) => {
                  const blockedCount = proc.steps.filter(s => s.status === 'blocked').length;
                  const completedCount = proc.steps.filter(s => s.status === 'completed').length;
                  const progressPct = Math.round((completedCount / (proc.steps.length || 1)) * 100);

                  return (
                    <div
                      key={proc.id}
                      onClick={() => {
                        setSelectedProcessId(proc.id);
                        setActiveTab('processes');
                      }}
                      className={`p-5 rounded-2xl border transition-all cursor-pointer space-y-3 hover:border-indigo-500/60 ${
                        selectedProcessId === proc.id
                          ? 'bg-slate-900 border-indigo-500 shadow-lg shadow-indigo-950/40'
                          : 'bg-slate-900/60 border-slate-800'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
                            {proc.category}
                          </span>
                          <h4 className="text-base font-bold text-white mt-0.5">
                            {proc.name}
                          </h4>
                        </div>
                        {blockedCount > 0 && (
                          <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-[10px] font-bold border border-red-500/30 flex items-center space-x-1">
                            <AlertTriangle className="w-3 h-3" />
                            <span>{blockedCount} bloqueio(s)</span>
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-400 line-clamp-2">
                        {proc.description}
                      </p>

                      <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                        <div className="flex items-center space-x-2">
                          <Layers className="w-3.5 h-3.5 text-indigo-400" />
                          <span>{proc.steps.length} etapas</span>
                        </div>
                        <span className="font-bold text-indigo-300">
                          {progressPct}% concluído
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Tab Visualizador de Árvore de Processos */}
        {activeTab === 'processes' && selectedProcess && (
          <ProcessTreeView
            process={selectedProcess}
            onAdvanceStep={handleAdvanceStep}
            onApproveStep={handleApproveStep}
            onSimulateDelay={(stepId) => setSimulatingStepId(stepId)}
          />
        )}

        {/* Tab Analytics & Riscos */}
        {activeTab === 'analytics' && selectedProcess && (
          <div className="space-y-6 bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8">
            <h2 className="text-xl font-bold text-white flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              <span>Análise Preditiva de Riscos & Gargalos (IA Consultiva)</span>
            </h2>
            <p className="text-xs text-slate-400">
              O motor Vurio analisa a estrutura inteira de dependências do processo <strong>"{selectedProcess.name}"</strong> para antecipar atrasos e mitigar falhas antes que ocorram.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Etapas Críticas</span>
                <p className="text-2xl font-extrabold text-white">
                  {selectedProcess.steps.filter(s => s.dependencies.length > 1).length}
                </p>
                <p className="text-[11px] text-slate-400">Possuem múltiplas dependências</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Gargalos Financeiros</span>
                <p className="text-2xl font-extrabold text-emerald-400">
                  {selectedProcess.steps.filter(s => s.financialCriteria).length}
                </p>
                <p className="text-[11px] text-slate-400">Etapas com validação de orçamento</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Gargalos Externos</span>
                <p className="text-2xl font-extrabold text-amber-400">
                  {selectedProcess.steps.filter(s => s.externalCriteria).length}
                </p>
                <p className="text-[11px] text-slate-400">Dependem de terceiros ou clientes</p>
              </div>
            </div>
          </div>
        )}

        {/* Tab Parceiros & AnalisAí */}
        {activeTab === 'partners' && (
          <PartnerSection />
        )}

      </main>

      {/* Modal de Simulação de Atraso se acionado */}
      {simulatingStepId && selectedProcess && (
        <SimulationModal
          process={selectedProcess}
          stepId={simulatingStepId}
          onClose={() => setSimulatingStepId(null)}
        />
      )}

      {/* Bottom Navigation para Mobile First */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
      />

    </div>
  );
}
