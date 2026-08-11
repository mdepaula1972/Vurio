import React, { useState } from 'react';
import { ShieldAlert, CheckCircle2, Clock, X, AlertTriangle, UserCheck, Lock } from 'lucide-react';
import { Step } from '../../engine/types';

interface ExceptionOverrideModalProps {
  step: Step;
  isOpen: boolean;
  onClose: () => void;
  onApproveException: (stepId: string, role: 'gerencia' | 'diretoria', extendedHours: number, justification: string) => void;
}

export const ExceptionOverrideModal: React.FC<ExceptionOverrideModalProps> = ({
  step,
  isOpen,
  onClose,
  onApproveException
}) => {
  const [selectedRole, setSelectedRole] = useState<'gerencia' | 'diretoria'>('diretoria');
  const [extendedHours, setExtendedHours] = useState<number>(48);
  const [justification, setJustification] = useState<string>('Autorizado caráter emergencial devido a fator externo imprevisto.');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onApproveException(step.id, selectedRole, extendedHours, justification);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4">
      <div className="bg-slate-900 border border-amber-500/40 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative overflow-hidden">
        
        {/* Decorative ambient gradient */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                Quebra de Regra & Exceção
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30">Alçada Superior</span>
              </h3>
              <p className="text-xs text-slate-400">Tarefa: <span className="text-amber-400 font-semibold">{step.title}</span></p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-500/30 text-amber-200 text-xs flex items-start space-x-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <p>
              As travas antiprocrastinação e restrições da etapa exigem autorização especial para extensão de prazo ou transição sem anexo. O registro será gravado no audit log.
            </p>
          </div>

          {/* Level Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Nível de Alçada para Liberação
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSelectedRole('gerencia')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  selectedRole === 'gerencia'
                    ? 'border-amber-500 bg-amber-500/10 text-amber-200 shadow-md'
                    : 'border-slate-800 bg-slate-950/50 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-sm">
                  <UserCheck className="w-4 h-4 text-amber-400" />
                  Gerência
                </div>
                <p className="text-[11px] opacity-75 mt-1">Até +24h de prazo extra</p>
              </button>

              <button
                type="button"
                onClick={() => setSelectedRole('diretoria')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  selectedRole === 'diretoria'
                    ? 'border-amber-500 bg-amber-500/10 text-amber-200 shadow-md'
                    : 'border-slate-800 bg-slate-950/50 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-sm">
                  <Lock className="w-4 h-4 text-amber-400" />
                  Diretoria
                </div>
                <p className="text-[11px] opacity-75 mt-1">Liberdade total & extensão livre</p>
              </button>
            </div>
          </div>

          {/* Extended Hours Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              Extensão de Prazo (Horas)
            </label>
            <input
              type="number"
              min="1"
              max="240"
              value={extendedHours}
              onChange={e => setExtendedHours(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Justification Textarea */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Justificativa Obrigatória de Exceção
            </label>
            <textarea
              rows={3}
              required
              value={justification}
              onChange={e => setJustification(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
              placeholder="Descreva o motivo que exige a liberação da regra..."
            />
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex justify-end space-x-3 border-t border-slate-800 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-semibold bg-amber-600 hover:bg-amber-500 text-white rounded-xl shadow-lg shadow-amber-600/30 transition-all flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              Aprovar Exceção ({selectedRole === 'diretoria' ? 'Diretoria' : 'Gerência'})
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
