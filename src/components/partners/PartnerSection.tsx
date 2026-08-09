/**
 * Vurio v1.0.0 — Gestor Inteligente de Processos com IA
 * PartnerSection — Seção de parceiros, BPO financeiro e AnalisAí
 */
import React from 'react';
import { useTranslation } from 'react-i18next';

import { Building2, DollarSign, Handshake, Users, ArrowUpRight, ShieldCheck, PieChart } from 'lucide-react';

export const PartnerSection: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="space-y-8">
      
      {/* Banner Principal AnalisAí & Vurio Partner */}
      <div className="rounded-3xl bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 border border-indigo-500/30 p-6 sm:p-10 shadow-2xl space-y-6">
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
              <Handshake className="w-3.5 h-3.5" />
              <span>Conexão BPO & Parceiros Estratégicos</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              AnalisAí & Vurio Partner Program
            </h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              Enquanto o <strong>Vurio</strong> é a plataforma tecnológica de gestão inteligente de processos com IA, o <strong>AnalisAí</strong> provê a execução especializada em serviços financeiros e BPO.
            </p>
          </div>

          <button className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-500/25 flex items-center space-x-2 transition-all transform active:scale-95">
            <span>Quero ser um Parceiro Vurio</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>

        {/* Grid de Recursos do Canal de Parceiros */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t border-indigo-500/20">
          
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
              <Building2 className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-white">Para Escritórios & BPOs</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Estruture os processos dos seus clientes (abertura de empresa, fluxo financeiro, compras) com total governança e transparência.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <DollarSign className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-white">Integração Financeira AnalisAí</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Identificação automática pelo Vurio de dependências orçamentárias que necessitam de intervenção ou suporte de BPO financeiro.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
              <PieChart className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-white">Receita Recorrente & Painel</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Gerencie a carteira de clientes atribuída, acompanhe métricas de avanço e receba comissionamento por contas ativas no Vurio.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
};
