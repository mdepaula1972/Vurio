/**
 * Vurio v1.3.0 — Gestor Inteligente de Processos com IA
 * Componente principal da aplicação
 */
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Navbar } from './components/layout/Navbar';
import { BottomNav } from './components/layout/BottomNav';
import { HeroPrompt } from './components/hero/HeroPrompt';
import { ProcessGraphCanvas } from './components/process/ProcessGraphCanvas';
import { SimulationModal } from './components/process/SimulationModal';
import { PartnerSection } from './components/partners/PartnerSection';
import { AICopilotBar } from './components/copilot/AICopilotBar';
import { VurioPulseFlow } from './components/process/VurioPulseFlow';
import { Process, CompanyOptions, DocumentUploadData, ProcessViewMode } from './engine/types';
import { generateProcessFromPrompt, generateProcessFromDocument } from './services/aiService';
import { resolveProcessState } from './engine/dependencyResolver';
import { ShieldAlert, Plus, Sparkles, FolderGit2, AlertTriangle, Layers, Activity, Zap, CheckCircle2, Network, SlidersHorizontal } from 'lucide-react';

export const APP_VERSION = '1.3.0';

export default function App() {
  const { i18n, t } = useTranslation();
  const [currentLang, setCurrentLang] = useState('pt-BR');
  const [activeTab, setActiveTab] = useState<'home' | 'processes' | 'voice' | 'analytics' | 'partners'>('home');
  const [viewMode, setViewMode] = useState<'pulse_flow' | 'graph'>('pulse_flow');
  const [processes, setProcesses] = useState<Process[]>([]);
  const [selectedProcessId, setSelectedProcessId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [simulatingStepId, setSimulatingStepId] = useState<string | null>(null);

  // Inicializa o estado com processos padrão modelo
  useEffect(() => {
    async function init() {
      const p1 = await generateProcessFromPrompt('Quero contratar um funcionário');
      const p2 = await generateProcessFromPrompt('Quero abrir uma empresa ou filial', {
        regime: 'simples',
        hasExistingCompany: false,
      });
      setProcesses([p1, p2]);
      setSelectedProcessId(p1.id);
    }
    init();
  }, []);

  const handleLanguageChange = (lang: string) => {
    setCurrentLang(lang);
    i18n.changeLanguage(lang);
  };

  const handleGenerateProcess = async (promptText: string, companyOptions?: CompanyOptions) => {
    setIsGenerating(true);
    try {
      const newProcess = await generateProcessFromPrompt(promptText, companyOptions);
      setProcesses(prev => [newProcess, ...prev]);
      setSelectedProcessId(newProcess.id);
      setActiveTab('processes');
    } catch (err) {
      console.error('Erro ao gerar processo:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateFromDocument = async (docData: DocumentUploadData) => {
    setIsGenerating(true);
    try {
      const newProcess = generateProcessFromDocument(docData);
      setProcesses(prev => [newProcess, ...prev]);
      setSelectedProcessId(newProcess.id);
      setActiveTab('processes');
    } catch (err) {
      console.error('Erro ao gerar processo a partir do documento:', err);
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col pb-24 sm:pb-12 selection:bg-indigo-500 selection:text-white">
      
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
          <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold flex items-center justify-between shadow-lg shadow-amber-950/20">
            <div className="flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span>{t('freemium.banner')}</span>
            </div>
            <button className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold transition-colors text-xs">
              {t('freemium.upgrade')}
            </button>
          </div>
        )}

        {/* Tab Início / Prompt IA */}
        {(activeTab === 'home' || activeTab === 'voice') && (
          <div className="space-y-8">
            <HeroPrompt
              onGenerateProcess={handleGenerateProcess}
              onGenerateFromDocument={handleGenerateFromDocument}
              isGenerating={isGenerating}
            />

            {/* Lista dos Processos Ativos com Health Scores */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-extrabold text-white flex items-center space-x-2">
                  <FolderGit2 className="w-5 h-5 text-indigo-400" />
                  <span>Seus Processos Inteligentes em Andamento</span>
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
                  const healthScore = proc.metrics?.healthScore || progressPct;

                  return (
                    <div
                      key={proc.id}
                      onClick={() => {
                        setSelectedProcessId(proc.id);
                        setActiveTab('processes');
                      }}
                      className={`p-5 rounded-3xl border transition-all cursor-pointer space-y-4 hover:border-indigo-500/60 shadow-xl group ${
                        selectedProcessId === proc.id
                          ? 'bg-slate-900 border-indigo-500 ring-1 ring-indigo-500/30 shadow-indigo-950/40'
                          : 'bg-slate-900/60 border-slate-800'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
                            {proc.category}
                          </span>
                          <h4 className="text-base font-extrabold text-white group-hover:text-indigo-300 transition-colors">
                            {proc.name}
                          </h4>
                        </div>
                        
                        {/* Health Badge */}
                        <div className="flex items-center space-x-2">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-black border ${
                            healthScore >= 70
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : healthScore >= 40
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                              : 'bg-red-500/10 text-red-400 border-red-500/30'
                          }`}>
                            ⚡ {healthScore}% Saúde
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                        {proc.description}
                      </p>

                      <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                        <div className="flex items-center space-x-2">
                          <Layers className="w-3.5 h-3.5 text-indigo-400" />
                          <span>{proc.steps.length} etapas</span>
                        </div>

                        {blockedCount > 0 ? (
                          <span className="text-red-400 font-bold flex items-center space-x-1">
                            <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                            <span>{blockedCount} gargalo(s)</span>
                          </span>
                        ) : (
                          <span className="text-emerald-400 font-bold flex items-center space-x-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Pronto para avançar</span>
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Tab Visualizador do Processo (Vurio Pulse Flow & Mapa Grafo) */}
        {activeTab === 'processes' && selectedProcess && (
          <div className="space-y-6">
            {/* Seletor de Modo de Visualização */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 shadow-md">
              <div className="flex items-center space-x-3">
                <span className="text-xs font-semibold text-slate-400">Processo Ativo:</span>
                <select
                  value={selectedProcessId || ''}
                  onChange={(e) => setSelectedProcessId(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-indigo-300 font-bold focus:outline-none focus:border-indigo-500"
                >
                  {processes.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.category})</option>
                  ))}
                </select>
              </div>

              {/* Toggle Buttons: Pulse Flow vs Grafo */}
              <div className="grid grid-cols-2 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  onClick={() => setViewMode('pulse_flow')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    viewMode === 'pulse_flow'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5 text-emerald-400" />
                  Vurio Pulse Flow
                </button>

                <button
                  onClick={() => setViewMode('graph')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    viewMode === 'graph'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Network className="w-3.5 h-3.5 text-indigo-400" />
                  Mapa Grafo
                </button>
              </div>
            </div>

            {/* Render do Modo Selecionado */}
            {viewMode === 'pulse_flow' ? (
              <VurioPulseFlow
                process={selectedProcess}
                onUpdateProcess={(updatedProc) => {
                  setProcesses(prev => prev.map(p => p.id === updatedProc.id ? updatedProc : p));
                }}
              />
            ) : (
              <ProcessGraphCanvas
                process={selectedProcess}
                onAdvanceStep={handleAdvanceStep}
                onApproveStep={handleApproveStep}
                onSimulateDelay={(stepId) => setSimulatingStepId(stepId)}
              />
            )}
          </div>
        )}

        {/* Tab Analytics & Riscos */}
        {activeTab === 'analytics' && selectedProcess && (
          <div className="space-y-6 bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
            <h2 className="text-xl font-bold text-white flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              <span>Análise Preditiva de Riscos & Gargalos (IA Consultiva)</span>
            </h2>
            <p className="text-xs text-slate-400">
              O motor Vurio analisa a estrutura inteira de dependências do processo <strong>"{selectedProcess.name}"</strong> para antecipar atrasos e mitigar falhas antes que ocorram.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Etapas Críticas</span>
                <p className="text-3xl font-black text-white">
                  {selectedProcess.steps.filter(s => s.dependencies.length > 1).length}
                </p>
                <p className="text-[11px] text-slate-400">Possuem múltiplas dependências</p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Gargalos Financeiros</span>
                <p className="text-3xl font-black text-emerald-400">
                  {selectedProcess.steps.filter(s => s.financialCriteria).length}
                </p>
                <p className="text-[11px] text-slate-400">Etapas com validação de orçamento</p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Gargalos Externos</span>
                <p className="text-3xl font-black text-amber-400">
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

      {/* Floating AI Copilot Assistant */}
      <AICopilotBar
        process={selectedProcess}
        onAdvanceBlockedStep={(stepId) => handleAdvanceStep(stepId)}
      />

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
