/**
 * Vurio v1.1.0 — Gestor Inteligente de Processos com IA
 * CompanyConfigModal — Modal interativo de seleção de regime tributário e sociedade existente
 */
import React, { useState } from 'react';
import { X, Building2, ShieldAlert, CheckCircle2, ArrowRight, AlertTriangle, Sparkles } from 'lucide-react';
import { CompanyTaxRegime, CompanyOptions } from '../../engine/types';

interface CompanyConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (options: CompanyOptions) => void;
}

export const CompanyConfigModal: React.FC<CompanyConfigModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  const [selectedRegime, setSelectedRegime] = useState<CompanyTaxRegime>('simples');
  const [hasExistingCompany, setHasExistingCompany] = useState<boolean>(false);

  if (!isOpen) return null;

  const regimes: {
    id: CompanyTaxRegime;
    title: string;
    description: string;
    badge: string;
    dispensesViability: boolean;
  }[] = [
    {
      id: 'mei',
      title: 'MEI — Microempreendedor Individual',
      description: 'Faturamento até R$ 81 mil/ano. Isento de Contrato Social e pesquisa prévia de viabilidade de nome/endereço.',
      badge: 'Dispensa Viabilidade',
      dispensesViability: true,
    },
    {
      id: 'simples',
      title: 'Simples Nacional (ME / EPP)',
      description: 'Regime unificado para micro e pequenas empresas (até R$ 4,8 mi/ano). Exige pesquisa prévia e Contrato Social.',
      badge: 'Recomendado',
      dispensesViability: false,
    },
    {
      id: 'presumido',
      title: 'Lucro Presumido',
      description: 'Tributação simplificada baseada em margens fixas. Ideal para serviços com alta margem de lucro.',
      badge: 'Médio / Grande Porte',
      dispensesViability: false,
    },
    {
      id: 'real',
      title: 'Lucro Real',
      description: 'Tributação baseada no lucro líquido efetivo. Obrigatório para empresas com faturamento acima de R$ 78 mi/ano.',
      badge: 'Corporativo',
      dispensesViability: false,
    },
  ];

  const isMeiConflict = selectedRegime === 'mei' && hasExistingCompany;

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm({
      regime: selectedRegime,
      hasExistingCompany,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden max-h-[90vh] overflow-y-auto">
        
        {/* Background Glow */}
        <div className="absolute -top-20 -right-20 w-72 h-72 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header Close */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Title */}
        <div className="flex items-center space-x-3">
          <div className="p-3 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-xl font-extrabold text-white">
                Estruturação de Abertura de Empresa
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-bold uppercase border border-indigo-500/30">
                v1.1.0
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Selecione o enquadramento fiscal e histórico societário para o motor Vurio mapear as dependências corretas.
            </p>
          </div>
        </div>

        <form onSubmit={handleFormSubmit} className="space-y-6">
          
          {/* Pergunta 1: Você já possui outra empresa? */}
          <div className="space-y-3 p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
            <label className="text-xs font-extrabold text-slate-200 uppercase tracking-wider block">
              1. Você já possui alguma outra empresa aberta em seu nome (como sócio ou titular)?
            </label>
            
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setHasExistingCompany(false)}
                className={`p-3.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center space-x-2 ${
                  !hasExistingCompany
                    ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 shadow-md shadow-indigo-950/40'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <CheckCircle2 className={`w-4 h-4 ${!hasExistingCompany ? 'text-indigo-400' : 'text-slate-500'}`} />
                <span>Não (Primeira Empresa)</span>
              </button>

              <button
                type="button"
                onClick={() => setHasExistingCompany(true)}
                className={`p-3.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center space-x-2 ${
                  hasExistingCompany
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-md shadow-amber-950/40'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <AlertTriangle className={`w-4 h-4 ${hasExistingCompany ? 'text-amber-400' : 'text-slate-500'}`} />
                <span>Sim, já sou sócio / titular</span>
              </button>
            </div>
          </div>

          {/* Pergunta 2: Escolha do Tipo / Regime Tributário */}
          <div className="space-y-3">
            <label className="text-xs font-extrabold text-slate-200 uppercase tracking-wider block">
              2. Qual será o enquadramento da nova empresa?
            </label>

            <div className="space-y-2.5">
              {regimes.map((r) => {
                const isSelected = selectedRegime === r.id;
                return (
                  <div
                    key={r.id}
                    onClick={() => setSelectedRegime(r.id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-1.5 ${
                      isSelected
                        ? 'bg-indigo-950/40 border-indigo-500 shadow-lg shadow-indigo-950/40'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                          isSelected ? 'border-indigo-400 bg-indigo-500' : 'border-slate-600'
                        }`}>
                          {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white"></span>}
                        </span>
                        <h4 className="text-sm font-bold text-white">
                          {r.title}
                        </h4>
                      </div>

                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        r.dispensesViability
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}>
                        {r.badge}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 leading-relaxed pl-5">
                      {r.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Alerta de Impedimento Legal do MEI se Houver Conflito */}
          {isMeiConflict && (
            <div className="p-4 rounded-2xl bg-red-950/50 border border-red-800/80 text-red-200 text-xs space-y-2 animate-pulse">
              <div className="flex items-center space-x-2 font-bold text-red-300">
                <ShieldAlert className="w-4 h-4 text-red-400 flex-shrink-0" />
                <span>Impedimento Legal Detectado (LC nº 123/2006)</span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                A legislação brasileira proíbe estritamente que titulares de MEI possuam participação em outra empresa ativa. O motor Vurio criará o processo já com o <strong>alerta de impedimento travando a execução do MEI</strong> e orientando a migração para Simples Nacional.
              </p>
            </div>
          )}

          {/* Dica do MEI Sem Pesquisa Prévia se for MEI Válido */}
          {selectedRegime === 'mei' && !hasExistingCompany && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center space-x-2 font-semibold">
              <Sparkles className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>Vantagem MEI: A pesquisa prévia de viabilidade de nome e endereço é <strong>dispensada</strong>! O fluxo iniciará direto na emissão do CCMEI.</span>
            </div>
          )}

          {/* Botão de Envio */}
          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-500/30 flex items-center justify-center space-x-2 transition-all transform active:scale-95"
            >
              <span>Gerar Processo Personalizado</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
