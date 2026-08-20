/**
 * Vurio v1.2.0 — Gestor Inteligente de Processos com IA
 * InitialWizardModal — Modal de Pergunta Inicial: Abrir Empresa vs Estruturar Projeto/Processo
 */
import React, { useState } from 'react';
import { X, Building2, Workflow, Sparkles, Upload, FileText, ArrowRight, Layers, Bot, Edit3 } from 'lucide-react';
import { CreationMode, DocumentUploadData } from '../../engine/types';

interface InitialWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectOption: (mode: CreationMode, data?: { prompt?: string; documentData?: DocumentUploadData }) => void;
}

export const InitialWizardModal: React.FC<InitialWizardModalProps> = ({
  isOpen,
  onClose,
  onSelectOption,
}) => {
  const [step, setStep] = useState<'main_choice' | 'process_sub_choice' | 'document_upload'>('main_choice');
  const [documentContent, setDocumentContent] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [processPrompt, setProcessPrompt] = useState<string>('');

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setDocumentContent(text || `Processo importado a partir do arquivo '${file.name}'.`);
    };
    reader.readAsText(file);
  };

  const handleDocumentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!documentContent.trim()) return;

    onSelectOption('process_document', {
      documentData: {
        fileName: fileName || 'Documento_de_Processo.txt',
        fileType: 'text/plain',
        extractedText: documentContent,
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden max-h-[90vh] overflow-y-auto">
        
        {/* Background Glow */}
        <div className="absolute -top-24 -left-24 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Title */}
        <div className="flex items-center space-x-3">
          <div className="p-3 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-indigo-500/20">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-xl font-extrabold text-white">
                Assistente de Início Vurio
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-bold uppercase border border-indigo-500/30">
                v1.2.0
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Escolha seu objetivo para acionarmos a inteligência correta de mapeamento.
            </p>
          </div>
        </div>

        {/* ETAPA 1: PERGUNTA PRINCIPAL */}
        {step === 'main_choice' && (
          <div className="space-y-4 pt-2">
            <label className="text-xs font-extrabold text-slate-200 uppercase tracking-wider block text-center sm:text-left">
              O que você deseja fazer hoje?
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Opção 1: Abrir uma Empresa */}
              <button
                type="button"
                onClick={() => onSelectOption('company')}
                className="p-5 rounded-2xl bg-gradient-to-br from-indigo-950/60 to-slate-950 border border-indigo-500/40 hover:border-indigo-400 transition-all text-left space-y-3 shadow-lg hover:shadow-indigo-950/50 group"
              >
                <div className="w-12 h-12 rounded-xl bg-indigo-600/20 border border-indigo-500/40 text-indigo-300 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-base font-extrabold text-white group-hover:text-indigo-300 transition-colors">
                    1. Abrir uma Empresa
                  </h4>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    MEI, Simples Nacional, Lucro Presumido ou Real. Checagem de viabilidade e trava de sociedade.
                  </p>
                </div>
                <div className="flex items-center text-xs font-bold text-indigo-400 pt-1">
                  <span>Iniciar Enquadramento</span>
                  <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>

              {/* Opção 2: Estruturar um Projeto / Processo */}
              <button
                type="button"
                onClick={() => setStep('process_sub_choice')}
                className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 hover:border-blue-500/60 transition-all text-left space-y-3 shadow-lg hover:shadow-blue-950/50 group"
              >
                <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/40 text-blue-300 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Workflow className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-base font-extrabold text-white group-hover:text-blue-300 transition-colors">
                    2. Estruturar Projeto / Processo
                  </h4>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Crie workflows operacionais, contratações, vendas, compras com dependências e prazos.
                  </p>
                </div>
                <div className="flex items-center text-xs font-bold text-blue-400 pt-1">
                  <span>Escolha o método</span>
                  <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>

            </div>
          </div>
        )}

        {/* ETAPA 2: SUB-PERGUNTA DE PROCESSO */}
        {step === 'process_sub_choice' && (
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold text-slate-200 uppercase tracking-wider block">
                Como você deseja desenhar este workflow?
              </label>
              <button
                onClick={() => setStep('main_choice')}
                className="text-xs text-indigo-400 hover:underline font-semibold"
              >
                ← Voltar
              </button>
            </div>

            <div className="space-y-3">
              
              {/* 2A: Desenhar com IA em Linguagem Natural */}
              <button
                type="button"
                onClick={() => onSelectOption('process_ai')}
                className="w-full p-4 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-indigo-500/60 transition-all text-left flex items-start space-x-3 group"
              >
                <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 group-hover:scale-105 transition-transform">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white group-hover:text-indigo-300">
                    Ajuda da IA (Descrever ou Falar por Voz)
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Digite uma frase ou use comandos de voz para a IA desenhar as etapas e dependências automaticamente.
                  </p>
                </div>
              </button>

              {/* 2B: Upload de Documento / POP */}
              <button
                type="button"
                onClick={() => setStep('document_upload')}
                className="w-full p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/40 hover:border-indigo-400 transition-all text-left flex items-start space-x-3 group"
              >
                <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 group-hover:scale-105 transition-transform">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="text-sm font-bold text-white group-hover:text-emerald-300">
                      Upload de Documento (POP / Manual / PDF)
                    </h4>
                    <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      NOVO
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Suba um arquivo ou cole um manual/POP contendo todas as nuances do processo. A IA distribuirá em etapas.
                  </p>
                </div>
              </button>

              {/* 2C: Já tenho tudo definido (Manual) */}
              <button
                type="button"
                onClick={() => onSelectOption('process_manual')}
                className="w-full p-4 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 transition-all text-left flex items-start space-x-3 group"
              >
                <div className="p-2.5 rounded-xl bg-slate-800 text-slate-300 border border-slate-700 group-hover:scale-105 transition-transform">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white group-hover:text-slate-200">
                    Já tenho tudo definido (Criação Manual)
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Monte manualmente as etapas, atribuindo responsáveis, prazos e critérios de avanço.
                  </p>
                </div>
              </button>

            </div>
          </div>
        )}

        {/* ETAPA 3: UPLOAD DE DOCUMENTO / COLETEXTO */}
        {step === 'document_upload' && (
          <form onSubmit={handleDocumentSubmit} className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold text-slate-200 uppercase tracking-wider block">
                Envio do Documento do Processo
              </label>
              <button
                type="button"
                onClick={() => setStep('process_sub_choice')}
                className="text-xs text-indigo-400 hover:underline font-semibold"
              >
                ← Voltar
              </button>
            </div>

            {/* Dropzone de Arquivo */}
            <div className="p-5 rounded-2xl border-2 border-dashed border-indigo-500/40 bg-slate-950/80 text-center space-y-3 relative hover:border-indigo-400 transition-colors">
              <FileText className="w-8 h-8 text-indigo-400 mx-auto" />
              <div>
                <p className="text-xs font-bold text-white">
                  Selecione um arquivo de processo (.txt, .md, .doc, .pdf)
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  ou cole o conteúdo textual detalhado abaixo
                </p>
              </div>

              <input
                type="file"
                accept=".txt,.md,.json,.pdf,.doc,.docx"
                onChange={handleFileUpload}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />

              {fileName && (
                <span className="inline-block px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
                  📄 Arquivo selecionado: {fileName}
                </span>
              )}
            </div>

            {/* Ou Colar Texto do Processo */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400">
                Conteúdo / Detalhes do Manual ou POP:
              </label>
              <textarea
                rows={5}
                value={documentContent}
                onChange={(e) => setDocumentContent(e.target.value)}
                placeholder="Exemplo: Etapa 1: Aprovação de orçamento com a diretoria financeiro. Etapa 2: Cotação com 3 fornecedores... "
                className="w-full p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!documentContent.trim()}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 flex items-center justify-center space-x-2 transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span>Processar e Distribuir Etapas com IA</span>
            </button>
          </form>
        )}

      </div>
    </div>
  );
};
