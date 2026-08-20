/**
 * Vurio v1.0.0 — Gestor Inteligente de Processos com IA
 * SimulationModal — Simulador de efeito cascata e atraso de etapas
 */
import React, { useState } from 'react';
import { X, AlertOctagon, ArrowRight, Play, RefreshCw } from 'lucide-react';

import { Process, Step } from '../../engine/types';
import { simulateDelayConsequences } from '../../engine/dependencyResolver';

interface SimulationModalProps {
  process: Process;
  stepId: string;
  onClose: () => void;
}

export const SimulationModal: React.FC<SimulationModalProps> = ({ process, stepId, onClose }) => {
  const [delayDays, setDelayDays] = useState(5);
  const targetStep = process.steps.find(s => s.id === stepId);

  const simulation = simulateDelayConsequences(stepId, delayDays, process);
  const impactedStepIds = new Set(simulation.impactedStepIds);
  const impactedSteps = process.steps.filter(s => impactedStepIds.has(s.id));

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-6 relative overflow-hidden">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="flex items-center space-x-3">
          <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <AlertOctagon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-white">
              Simulador de Consequências
            </h3>
            <p className="text-xs text-slate-400">
              Análise preditiva de efeito cascata e riscos no processo
            </p>
          </div>
        </div>

        {/* Target Step Card */}
        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
          <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
            Etapa Analisada
          </span>
          <h4 className="text-sm font-bold text-white">
            {targetStep?.title}
          </h4>
          <p className="text-xs text-slate-400">
            {targetStep?.description}
          </p>
        </div>

        {/* Slider de Dias de Atraso */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-bold text-slate-300">
            <span>Se houver um atraso de:</span>
            <span className="text-amber-400 font-extrabold text-sm">{delayDays} dias</span>
          </div>
          <input
            type="range"
            min="1"
            max="30"
            value={delayDays}
            onChange={(e) => setDelayDays(Number(e.target.value))}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
          />
        </div>

        {/* Consequências Previstas */}
        <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/30 space-y-3">
          <h5 className="text-xs font-extrabold text-amber-300 uppercase tracking-wider flex items-center space-x-1.5">
            <span>Consequências Estimadas</span>
          </h5>
          <p className="text-xs text-slate-300 leading-relaxed font-medium">
            {simulation.explanation}
          </p>

          {impactedSteps.length > 0 && (
            <div className="pt-2 border-t border-amber-500/20 space-y-2">
              <span className="text-[11px] font-bold text-slate-400">
                Etapas que ficarão bloqueadas em efeito cascata:
              </span>
              <ul className="space-y-1">
                {impactedSteps.map(s => (
                  <li key={s.id} className="text-xs text-amber-200 flex items-center space-x-1.5">
                    <ArrowRight className="w-3 h-3 text-amber-400 flex-shrink-0" />
                    <span><strong>{s.title}</strong> (Responsável: {s.responsible.join(', ')})</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Actions Footer */}
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-colors"
          >
            Fechar Simulação
          </button>
        </div>

      </div>
    </div>
  );
};
