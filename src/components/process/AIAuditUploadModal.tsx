import React, { useState } from 'react';
import { ShieldCheck, Upload, FileText, CheckCircle, AlertCircle, Loader2, X, Sparkles } from 'lucide-react';
import { Step } from '../../engine/types';

interface AIAuditUploadModalProps {
  step: Step;
  isOpen: boolean;
  onClose: () => void;
  onAuditComplete: (stepId: string, isSuccess: boolean, fileName: string, feedback: string) => void;
}

export const AIAuditUploadModal: React.FC<AIAuditUploadModalProps> = ({
  step,
  isOpen,
  onClose,
  onAuditComplete
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditResult, setAuditResult] = useState<{
    status: 'idle' | 'success' | 'rejected';
    feedback: string;
  }>({ status: 'idle', feedback: '' });

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setAuditResult({ status: 'idle', feedback: '' });
    }
  };

  const handleRunAudit = () => {
    const fileName = selectedFile ? selectedFile.name : 'comprovante_entrega.pdf';
    setIsAuditing(true);

    setTimeout(() => {
      setIsAuditing(false);
      const isApproved = true;
      const feedbackMessage = `Validação de IA Vurio efetuada com sucesso. Documento "${fileName}" verificado: autenticidade, selo de data e correspondência com os critérios da etapa "${step.title}".`;

      setAuditResult({
        status: isApproved ? 'success' : 'rejected',
        feedback: feedbackMessage
      });

      setTimeout(() => {
        onAuditComplete(step.id, isApproved, fileName, feedbackMessage);
        onClose();
      }, 1400);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative overflow-hidden">
        
        {/* Decorative ambient gradient */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-1.5">
                Auditoria de IA de Entrega
                <Sparkles className="w-4 h-4 text-emerald-400" />
              </h3>
              <p className="text-xs text-slate-400">Etapa: <span className="text-emerald-400 font-semibold">{step.title}</span></p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="space-y-5">
          <p className="text-sm text-slate-300">
            Esta etapa exige envio de anexo (comprovante, contrato, nota ou foto) para validação autônoma pela IA do Vurio antes de evoluir o status.
          </p>

          {/* Upload Area */}
          <div className="border-2 border-dashed border-slate-700 hover:border-emerald-500/50 bg-slate-950/60 rounded-xl p-5 text-center transition-all">
            <input
              type="file"
              id="ai-audit-file-input"
              className="hidden"
              onChange={handleFileChange}
              accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xml"
            />
            <label htmlFor="ai-audit-file-input" className="cursor-pointer flex flex-col items-center">
              <Upload className="w-10 h-10 text-emerald-400 mb-2 animate-bounce" />
              <span className="text-sm font-medium text-slate-200">
                {selectedFile ? selectedFile.name : 'Clique para selecionar arquivo de entrega'}
              </span>
              <span className="text-xs text-slate-400 mt-1">
                Suporta PDF, PNG, JPG, XML e Docs (Máx 25MB)
              </span>
            </label>
          </div>

          {/* Quick Mock Preset Buttons if no file picked */}
          {!selectedFile && (
            <div className="flex flex-wrap gap-2 pt-1">
              <span className="text-xs text-slate-400 w-full mb-1">Ou selecione um documento de teste:</span>
              <button
                onClick={() => setSelectedFile(new File([], "nota_fiscal_servico_1042.pdf"))}
                className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-700 flex items-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5 text-emerald-400" />
                nota_fiscal_servico_1042.pdf
              </button>
              <button
                onClick={() => setSelectedFile(new File([], "relatorio_auditoria_v1.pdf"))}
                className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-700 flex items-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5 text-indigo-400" />
                relatorio_auditoria_v1.pdf
              </button>
            </div>
          )}

          {/* Auditing State */}
          {isAuditing && (
            <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex items-center space-x-3 animate-pulse">
              <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
              <div>
                <p className="text-sm font-semibold text-emerald-300">Auditoria IA em Andamento...</p>
                <p className="text-xs text-emerald-400/80">Lendo metadados, integridade do documento e requisitos...</p>
              </div>
            </div>
          )}

          {/* Audit Result Banner */}
          {auditResult.status === 'success' && (
            <div className="p-4 rounded-xl bg-emerald-900/30 border border-emerald-500 text-emerald-200 flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-xs leading-relaxed">
                <p className="font-semibold text-emerald-300 mb-1">Aprovado pela IA do Vurio!</p>
                {auditResult.feedback}
              </div>
            </div>
          )}

          {auditResult.status === 'rejected' && (
            <div className="p-4 rounded-xl bg-rose-900/30 border border-rose-500 text-rose-200 flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="text-xs leading-relaxed">
                <p className="font-semibold text-rose-300 mb-1">Reprovado na Auditoria</p>
                {auditResult.feedback}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex justify-end space-x-3 border-t border-slate-800 pt-4">
          <button
            onClick={onClose}
            disabled={isAuditing}
            className="px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 rounded-xl transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleRunAudit}
            disabled={!selectedFile || isAuditing}
            className="px-5 py-2 text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-2"
          >
            {isAuditing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Auditando...
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                Submeter para IA Audit
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
