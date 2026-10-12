'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  CheckCircle2,
  AlertTriangle,
  FileText,
  UserCheck,
  Building2,
  Calendar,
  Clock,
  FolderOpen,
  Send,
  UploadCloud,
  RefreshCw,
  Copy,
  ExternalLink,
  ShieldCheck,
  Compass,
  FileCheck,
  XCircle,
  HelpCircle,
  Stethoscope
} from 'lucide-react';
import { PermanentEmployeeFolder } from '@/lib/services/absenteeism-service';
import { DpAttestationAnalysisResponse } from '@/lib/services/dp-attestation-analyzer';

export interface ValidationWorkstationProps {
  initialFile?: File | null;
  initialFileUrl?: string | null;
  companyId?: string;
  onDecisionRecorded?: (decision: string, protocolId: string) => void;
}

export function ValidationWorkstation({
  initialFile = null,
  initialFileUrl = null,
  companyId = 'default',
  onDecisionRecorded
}: ValidationWorkstationProps) {
  // Estado do Arquivo e Visualizador
  const [currentFile, setCurrentFile] = useState<File | null>(initialFile);
  const [fileUrl, setFileUrl] = useState<string | null>(initialFileUrl);
  const [isPdf, setIsPdf] = useState(false);

  // Controles do Visualizador (Split View - Esquerda)
  const [zoomScale, setZoomScale] = useState(1);
  const [rotationDegrees, setRotationDegrees] = useState(0);

  // Estados do Formulário de Digitação Assistida (Split View - Direita)
  const [colaboradorNome, setColaboradorNome] = useState('');
  const [colaboradorCpf, setColaboradorCpf] = useState('');
  const [cidadeTrabalho, setCidadeTrabalho] = useState('Santos');
  const [cidadeResidencia, setCidadeResidencia] = useState('Santos');

  const [medicoNome, setMedicoNome] = useState('');
  const [crm, setCrm] = useState('');
  const [uf, setUf] = useState('SP');
  const [dataEmissao, setDataEmissao] = useState(new Date().toISOString().substring(0, 10));
  const [diasAfastamento, setDiasAfastamento] = useState(3);
  const [cid, setCid] = useState('');
  const [localAtendimento, setLocalAtendimento] = useState('');

  // Status da Consulta ao Vivo no CFM
  const [crmStatus, setCrmStatus] = useState<'IDLE' | 'LOADING' | 'ACTIVE' | 'INCONSISTENT'>('IDLE');
  const [cfmDoctorName, setCfmDoctorName] = useState<string | null>(null);
  const [cfmStatusMessage, setCfmStatusMessage] = useState<string | null>(null);

  // Análise e Alertas
  const [analyzing, setAnalyzing] = useState(false);
  const [protocolId, setProtocolId] = useState<string>(() => `#VR-${Math.random().toString(36).substring(2, 8).toUpperCase()}`);
  const [alertasSeguranca, setAlertasSeguranca] = useState<string[]>([]);
  const [alertasOperacionais, setAlertasOperacionais] = useState<string[]>([]);
  const [etiquetasPreditivas, setEtiquetasPreditivas] = useState<string[]>([]);
  const [flagDigitacaoAssistida, setFlagDigitacaoAssistida] = useState(false);
  const [camposPendentes, setCamposPendentes] = useState<string[]>([]);

  // Pasta Permanente do Colaborador
  const [permanentFolder, setPermanentFolder] = useState<PermanentEmployeeFolder | null>(null);
  const [loadingFolder, setLoadingFolder] = useState(false);

  // Ações de Decisão do DP
  const [observationModalOpen, setObservationModalOpen] = useState(false);
  const [observationText, setObservationText] = useState('');
  const [submittingDecision, setSubmittingDecision] = useState(false);
  const [decisionFeedback, setDecisionFeedback] = useState<{ type: 'success' | 'info'; text: string } | null>(null);

  // Efeito ao receber novo arquivo
  useEffect(() => {
    if (initialFile) {
      setCurrentFile(initialFile);
      const url = URL.createObjectURL(initialFile);
      setFileUrl(url);
      setIsPdf(initialFile.type === 'application/pdf' || initialFile.name.toLowerCase().endsWith('.pdf'));
      processDocument(initialFile);
    }
  }, [initialFile]);

  // Consulta ao vivo no CFM ao digitar CRM e UF
  useEffect(() => {
    const cleanCrm = crm.trim();
    const cleanUf = uf.trim().toUpperCase();

    if (cleanCrm.length >= 3 && cleanUf.length === 2) {
      const timer = setTimeout(() => {
        lookupCrmLive(cleanCrm, cleanUf);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setCrmStatus('IDLE');
      setCfmDoctorName(null);
    }
  }, [crm, uf]);

  // Consulta Pasta Permanente ao alterar CPF ou Nome
  useEffect(() => {
    if (colaboradorCpf.replace(/\D/g, '').length >= 11 || colaboradorNome.trim().length >= 4) {
      fetchPermanentFolder(colaboradorCpf, colaboradorNome);
    }
  }, [colaboradorCpf, colaboradorNome]);

  const lookupCrmLive = async (crmNumber: string, ufState: string) => {
    try {
      setCrmStatus('LOADING');
      const res = await fetch(`/api/doctor/check-crm?crm=${encodeURIComponent(crmNumber)}&uf=${encodeURIComponent(ufState)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.report && data.report.status === 'REGULAR') {
          setCrmStatus('ACTIVE');
          setCfmDoctorName(data.report.officialName);
          setCfmStatusMessage(`CRM ${crmNumber}/${ufState} ATIVO perante o CFM.`);
          if (!medicoNome && data.report.officialName) {
            setMedicoNome(data.report.officialName);
          }
        } else {
          setCrmStatus('INCONSISTENT');
          setCfmDoctorName(data.report?.officialName || null);
          setCfmStatusMessage(`Registro com situação ${data.report?.status || 'INCONSISTENTE'} no CFM.`);
        }
      } else {
        setCrmStatus('INCONSISTENT');
        setCfmStatusMessage('Registro não localizado ou inconsistente no Conselho.');
      }
    } catch {
      setCrmStatus('INCONSISTENT');
      setCfmStatusMessage('Inconsistência temporária na consulta do conselho profissional.');
    }
  };

  const fetchPermanentFolder = async (cpfVal: string, nomeVal: string) => {
    try {
      setLoadingFolder(true);
      const params = new URLSearchParams();
      if (cpfVal) params.append('cpf', cpfVal);
      if (nomeVal) params.append('nome', nomeVal);
      params.append('companyId', companyId);

      const res = await fetch(`/api/dp/decision?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setPermanentFolder(data.folder);
      }
    } catch {
      // silencioso
    } finally {
      setLoadingFolder(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCurrentFile(file);
    const url = URL.createObjectURL(file);
    setFileUrl(url);
    setIsPdf(file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf'));
    // Resetar transformações visuais
    setZoomScale(1);
    setRotationDegrees(0);
    processDocument(file);
  };

  const processDocument = async (file: File) => {
    try {
      setAnalyzing(true);
      const fd = new FormData();
      fd.append('file', file);
      fd.append('companyId', companyId);
      if (colaboradorNome) fd.append('colaborador_nome', colaboradorNome);
      if (colaboradorCpf) fd.append('colaborador_cpf', colaboradorCpf);
      if (cidadeTrabalho) fd.append('cidade_trabalho', cidadeTrabalho);
      if (cidadeResidencia) fd.append('cidade_residencia', cidadeResidencia);

      const res = await fetch('/api/dp/analyze-attestation', {
        method: 'POST',
        body: fd
      });

      if (res.ok) {
        const data = await res.json();
        
        // Preencher formulário assistido com dados extraídos pelo OCR
        if (data.dados_extraidos) {
          if (data.dados_extraidos.colaborador_nome && data.dados_extraidos.colaborador_nome !== 'Não identificado') {
            setColaboradorNome(data.dados_extraidos.colaborador_nome);
          }
          if (data.dados_extraidos.medico_nome && data.dados_extraidos.medico_nome !== 'Não identificado') {
            setMedicoNome(data.dados_extraidos.medico_nome);
          }
          if (data.dados_extraidos.crm_uf && data.dados_extraidos.crm_uf.includes('/')) {
            const [pCrm, pUf] = data.dados_extraidos.crm_uf.split('/');
            setCrm(pCrm.replace(/\D/g, ''));
            setUf(pUf.trim().toUpperCase());
          }
          if (data.dados_extraidos.data_emissao) {
            setDataEmissao(data.dados_extraidos.data_emissao);
          }
          if (data.dados_extraidos.dias_afastamento) {
            setDiasAfastamento(data.dados_extraidos.dias_afastamento);
          }
          if (data.dados_extraidos.cid && data.dados_extraidos.cid !== 'Não informado') {
            setCid(data.dados_extraidos.cid);
          }
          if (data.dados_extraidos.local_atendimento) {
            setLocalAtendimento(data.dados_extraidos.local_atendimento);
          }
        }

        setAlertasSeguranca(data.alertas_seguranca || []);
        setAlertasOperacionais(data.alertas_operacionais || []);
        setFlagDigitacaoAssistida(data.flag_digitacao_assistida || false);
        setCamposPendentes(data.campos_pendentes_digitacao || []);

        const tags: string[] = [];
        if (data.analise_preditiva?.nome_evento) {
          tags.push(`Afastamento coincidente com ${data.analise_preditiva.nome_evento}`);
        }
        setEtiquetasPreditivas(tags);
      }
    } catch (err) {
      console.error('Falha ao processar atestado na estação:', err);
    } finally {
      setAnalyzing(false);
    }
  };

  // Controles do Visualizador
  const handleZoomIn = () => setZoomScale(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoomScale(prev => Math.max(prev - 0.25, 0.5));
  const handleRotate = () => setRotationDegrees(prev => (prev + 90) % 360);
  const handleFitScreen = () => {
    setZoomScale(1);
    setRotationDegrees(0);
  };

  // Registrar Decisão Operacional do DP
  const handleRecordDecision = async (
    decisionType: 'APROVADO' | 'APROVADO_COM_OBSERVACAO' | 'SOLICITADO_DOCUMENTO_FISICO',
    customNotes?: string
  ) => {
    try {
      setSubmittingDecision(true);
      const res = await fetch('/api/dp/decision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cpf: colaboradorCpf,
          nome: colaboradorNome || 'Colaborador',
          companyId,
          protocolId,
          decisaoDp: decisionType,
          observacaoDp: customNotes || observationText || undefined,
          diasAfastamento,
          dataEmissao,
          medicoNome,
          crmUf: `${crm}/${uf}`,
          cid,
          localAtendimento,
          alertasRegistrados: [...alertasSeguranca, ...alertasOperacionais],
          etiquetasPreditivas,
          exigiuDigitacaoManual: flagDigitacaoAssistida
        })
      });

      if (res.ok) {
        const result = await res.json();
        setPermanentFolder(result.folder);
        setObservationModalOpen(false);
        setObservationText('');
        
        const labelDesc = 
          decisionType === 'APROVADO' ? 'Aprovado' :
          decisionType === 'APROVADO_COM_OBSERVACAO' ? 'Aprovado com Observação' :
          'Solicitação de Documento Físico Enviada';

        setDecisionFeedback({
          type: 'success',
          text: `Decisão [${labelDesc}] registrada com sucesso sob protocolo ${protocolId}.`
        });

        if (onDecisionRecorded) {
          onDecisionRecorded(decisionType, protocolId);
        }

        setTimeout(() => setDecisionFeedback(null), 5000);
      }
    } catch (err: any) {
      setDecisionFeedback({
        type: 'info',
        text: `Erro ao registrar decisão: ${err.message}`
      });
    } finally {
      setSubmittingDecision(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Barra de Status e Feedback */}
      {decisionFeedback && (
        <div className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-between animate-fadeIn ${
          decisionFeedback.type === 'success'
            ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
            : 'bg-sky-950/40 border-sky-500/40 text-sky-300'
        }`}>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{decisionFeedback.text}</span>
          </div>
          <button onClick={() => setDecisionFeedback(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* ESTAÇÃO DE VALIDAÇÃO: SPLIT VIEW (LADO A LADO) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[720px]">
        
        {/* ========================================================================= */}
        {/* PAINEL DA ESQUERDA (VISUALIZADOR DO DOCUMENTO) - 6 COLUNAS */}
        {/* ========================================================================= */}
        <div className="lg:col-span-6 flex flex-col bg-slate-950/90 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
          
          {/* Barra de Controles Visuais Superior */}
          <div className="p-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between flex-wrap gap-2 text-xs">
            <div className="flex items-center space-x-1.5">
              <span className="font-bold text-white flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-sky-400" />
                Visualizador de Documento
              </span>
              <span className="font-mono text-[10px] text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                {currentFile ? currentFile.name : 'Nenhum arquivo'}
              </span>
            </div>

            {/* Controles de Zoom, Rotação e Ajuste */}
            <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                onClick={handleZoomIn}
                title="Aumentar Zoom (+)"
                className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-all"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={handleZoomOut}
                title="Diminuir Zoom (-)"
                className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-all"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                onClick={handleRotate}
                title="Rotacionar 90°"
                className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-all"
              >
                <RotateCw className="w-4 h-4" />
              </button>
              <button
                onClick={handleFitScreen}
                title="Ajustar à Tela (Reset)"
                className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-all"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
              <div className="h-4 w-px bg-slate-800 mx-1"></div>
              <span className="font-mono text-[10px] text-slate-400 px-1.5">
                {Math.round(zoomScale * 100)}% • {rotationDegrees}°
              </span>
            </div>
          </div>

          {/* Área de Visualização com Zoom e Rotação */}
          <div className="flex-1 bg-slate-950 relative flex items-center justify-center p-4 overflow-auto min-h-[500px]">
            {analyzing && (
              <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-20 flex flex-col items-center justify-center space-y-2">
                <RefreshCw className="w-8 h-8 text-sky-400 animate-spin" />
                <span className="text-xs font-bold text-white">Extraindo dados e analisando integridade...</span>
              </div>
            )}

            {fileUrl ? (
              isPdf ? (
                /* Visualizador para PDF */
                <div
                  className="w-full h-full min-h-[550px] flex items-center justify-center transition-transform duration-200"
                  style={{
                    transform: `scale(${zoomScale}) rotate(${rotationDegrees}deg)`,
                    transformOrigin: 'center center'
                  }}
                >
                  <object
                    data={`${fileUrl}#toolbar=0&navpanes=0`}
                    type="application/pdf"
                    className="w-full h-[600px] rounded-xl border border-slate-800 shadow-xl"
                  >
                    <div className="p-6 text-center text-xs space-y-3 bg-slate-900 rounded-xl">
                      <p className="text-slate-300">O navegador não suporta renderização direta de PDF dentro do frame.</p>
                      <a
                        href={fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg font-bold"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Abrir PDF em Nova Aba</span>
                      </a>
                    </div>
                  </object>
                </div>
              ) : (
                /* Visualizador para Imagem (JPG, PNG) */
                <div className="w-full h-full flex items-center justify-center overflow-hidden">
                  <img
                    src={fileUrl}
                    alt="Atestado submetido"
                    className="max-h-[600px] object-contain rounded-xl shadow-2xl transition-transform duration-200"
                    style={{
                      transform: `scale(${zoomScale}) rotate(${rotationDegrees}deg)`,
                      transformOrigin: 'center center'
                    }}
                  />
                </div>
              )
            ) : (
              /* Estado Sem Arquivo Carregado */
              <div className="text-center p-8 space-y-4 max-w-sm">
                <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-800 mx-auto flex items-center justify-center text-slate-500">
                  <UploadCloud className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Nenhum Documento Carregado</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Arraste ou selecione o atestado médico (PDF ou Imagem) para iniciar a validação na estação.
                  </p>
                </div>
                <div>
                  <label className="cursor-pointer px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold inline-flex items-center gap-2 transition-all shadow">
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>Selecionar Arquivo</span>
                    <input
                      type="file"
                      accept=".pdf,image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Rodapé do Visualizador: Troca Rápida de Arquivo */}
          <div className="p-3 bg-slate-900/60 border-t border-slate-800 flex items-center justify-between text-xs">
            <span className="text-[11px] text-slate-400 font-mono">
              Protocolo: <strong className="text-white">{protocolId}</strong>
            </span>
            <label className="cursor-pointer text-sky-400 hover:text-sky-300 text-xs font-semibold flex items-center gap-1">
              <span>Carregar Outro Documento</span>
              <input type="file" accept=".pdf,image/*" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* PAINEL DA DIREITA (INSPEÇÃO E AÇÕES DO DP) - 6 COLUNAS */}
        {/* ========================================================================= */}
        <div className="lg:col-span-6 flex flex-col space-y-4">
          
          {/* 1. CARD SUPERIOR DE ALERTAS NEUTROS (SEM LINGUAGEM ACUSATÓRIA) */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <span className="font-bold text-white text-xs flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-sky-400" />
                Apontamentos Técnicos & Alertas Neutros
              </span>
              <span className="text-[10px] text-slate-400 font-semibold uppercase">Linguagem Informativa</span>
            </div>

            {alertasSeguranca.length === 0 && alertasOperacionais.length === 0 && etiquetasPreditivas.length === 0 ? (
              <p className="text-xs text-emerald-400 flex items-center gap-2 py-1">
                <CheckCircle2 className="w-4 h-4" />
                Nenhum apontamento técnico registrado. Documento em conformidade formal.
              </p>
            ) : (
              <div className="space-y-1.5 text-xs">
                {/* Alertas de Metadados/Edição */}
                {alertasSeguranca.map((al, idx) => (
                  <div key={`sec-${idx}`} className="p-2 rounded-xl bg-amber-950/20 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                    <span>{al}</span>
                  </div>
                ))}

                {/* Alertas Operacionais e Distância */}
                {alertasOperacionais.map((al, idx) => (
                  <div key={`op-${idx}`} className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 text-xs flex items-start gap-2">
                    <Compass className="w-3.5 h-3.5 text-sky-400 flex-shrink-0 mt-0.5" />
                    <span>{al}</span>
                  </div>
                ))}

                {/* Etiquetas Preditivas */}
                {etiquetasPreditivas.map((tag, idx) => (
                  <div key={`tag-${idx}`} className="p-2 rounded-xl bg-indigo-950/30 border border-indigo-500/30 text-indigo-300 text-xs flex items-start gap-2">
                    <Calendar className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0 mt-0.5" />
                    <span>{tag}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 2. FORMULÁRIO DE DIGITAÇÃO ASSISTIDA & CONSULTA AO VIVO DO CRM */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-bold text-white text-xs flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-emerald-400" />
                Formulário de Digitação Assistida (OCR & Conferência)
              </span>
              {flagDigitacaoAssistida && (
                <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30 font-semibold">
                  Campos pendentes de checagem
                </span>
              )}
            </div>

            <div className="space-y-3 text-xs">
              {/* Linha 1: Dados do Colaborador */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 text-[11px] mb-1">Nome do Colaborador:</label>
                  <input
                    type="text"
                    value={colaboradorNome}
                    onChange={(e) => setColaboradorNome(e.target.value)}
                    placeholder="Nome completo"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-[11px] mb-1">CPF do Colaborador:</label>
                  <input
                    type="text"
                    value={colaboradorCpf}
                    onChange={(e) => setColaboradorCpf(e.target.value)}
                    placeholder="000.000.000-00"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-white font-mono focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              {/* Linha 2: CRM, UF e Consulta ao Vivo no CFM */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <label className="block text-slate-400 text-[11px] mb-1">CRM do Médico Emissor:</label>
                    <input
                      type="text"
                      value={crm}
                      onChange={(e) => setCrm(e.target.value.replace(/\D/g, ''))}
                      placeholder="Número do CRM"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-white font-mono font-bold text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1">UF:</label>
                    <input
                      type="text"
                      maxLength={2}
                      value={uf}
                      onChange={(e) => setUf(e.target.value.toUpperCase())}
                      placeholder="UF"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-white font-mono uppercase font-bold text-xs"
                    />
                  </div>
                </div>

                {/* INDICADOR VISUAL EM TEMPO REAL: VERDE [CRM ATIVO] OU VERMELHO [INCONSISTENTE] */}
                <div className="pt-1">
                  {crmStatus === 'LOADING' && (
                    <div className="p-2 rounded-lg bg-sky-950/30 border border-sky-500/30 text-sky-300 text-[11px] flex items-center gap-2">
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      <span>Consultando registro profissional no CFM...</span>
                    </div>
                  )}

                  {crmStatus === 'ACTIVE' && (
                    <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-[11px] flex items-center justify-between shadow-sm">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        <div>
                          <span className="font-bold uppercase tracking-wider text-[10px] bg-emerald-500/20 px-1.5 py-0.5 rounded mr-1.5">
                            CRM ATIVO
                          </span>
                          <strong className="text-white">{cfmDoctorName || medicoNome}</strong>
                        </div>
                      </div>
                      <span className="text-[10px] text-emerald-400 font-semibold hidden sm:inline">Validado CFM</span>
                    </div>
                  )}

                  {crmStatus === 'INCONSISTENT' && (
                    <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-500/40 text-rose-300 text-[11px] flex items-center justify-between shadow-sm">
                      <div className="flex items-center gap-2">
                        <XCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                        <div>
                          <span className="font-bold uppercase tracking-wider text-[10px] bg-rose-500/20 px-1.5 py-0.5 rounded mr-1.5">
                            INCONSISTENTE
                          </span>
                          <span>{cfmStatusMessage || 'CRM não localizado ou com divergência cadastral.'}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Nome do Médico Digitado/Confirmado */}
                <div>
                  <label className="block text-slate-400 text-[11px] mb-1">Nome Completo do Médico:</label>
                  <input
                    type="text"
                    value={medicoNome}
                    onChange={(e) => setMedicoNome(e.target.value)}
                    placeholder="Dr(a). Nome completo"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-white"
                  />
                </div>
              </div>

              {/* Linha 3: Período, Data e CID */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-400 text-[11px] mb-1">Dias Afastamento:</label>
                  <input
                    type="number"
                    min="1"
                    value={diasAfastamento}
                    onChange={(e) => setDiasAfastamento(parseInt(e.target.value, 10) || 1)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-white font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-[11px] mb-1">Data de Emissão:</label>
                  <input
                    type="date"
                    value={dataEmissao}
                    onChange={(e) => setDataEmissao(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2 py-1.5 text-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-[11px] mb-1">CID (Opcional):</label>
                  <input
                    type="text"
                    value={cid}
                    onChange={(e) => setCid(e.target.value.toUpperCase())}
                    placeholder="Ex: M54.5"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-white font-mono uppercase"
                  />
                </div>
              </div>

              {/* Local de Atendimento */}
              <div>
                <label className="block text-slate-400 text-[11px] mb-1">Instituição de Saúde / Local de Atendimento:</label>
                <input
                  type="text"
                  value={localAtendimento}
                  onChange={(e) => setLocalAtendimento(e.target.value)}
                  placeholder="Nome da Clínica, Pronto-Socorro ou Hospital"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-white"
                />
              </div>
            </div>
          </div>

          {/* 3. CARD DE RESUMO: SNAPSHOT DA PASTA DIGITAL DO COLABORADOR */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-950/30 border border-indigo-500/20 space-y-3 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <span className="font-bold text-white text-xs flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-indigo-400" />
                Snapshot: Pasta Digital do Colaborador (Permanente por CPF)
              </span>
              <span className="text-[10px] text-indigo-300 font-mono">
                {colaboradorCpf ? `CPF: ${colaboradorCpf}` : colaboradorNome || 'Sem Identificador'}
              </span>
            </div>

            {loadingFolder ? (
              <p className="text-xs text-slate-400 flex items-center gap-2">
                <RefreshCw className="w-3 h-3 animate-spin" /> Carregando histórico permanente...
              </p>
            ) : permanentFolder ? (
              <div className="space-y-3 text-xs">
                {/* Métricas Principais */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 bg-slate-950 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Atestados no Ano</span>
                    <span className="text-lg font-black text-white">{permanentFolder.totalAtestadosAno}</span>
                  </div>
                  <div className="p-2 bg-slate-950 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Dias no Ano</span>
                    <span className="text-lg font-black text-sky-400">{permanentFolder.totalDiasAno} dias</span>
                  </div>
                  <div className="p-2 bg-slate-950 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Histórico Geral</span>
                    <span className="text-lg font-black text-slate-300">{permanentFolder.totalAtestadosHistoricoGeral}</span>
                  </div>
                </div>

                {/* Histórico Descritivo de Inconsistências Anteriores */}
                {permanentFolder.historicoDescritivo && permanentFolder.historicoDescritivo.length > 0 ? (
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <span className="font-bold text-slate-300 text-[10px] uppercase block">
                      Ocorrências Anteriores Registradas:
                    </span>
                    <ul className="space-y-1 max-h-24 overflow-y-auto">
                      {permanentFolder.historicoDescritivo.slice(0, 4).map((desc, idx) => (
                        <li key={idx} className="text-[11px] text-slate-400 border-l-2 border-indigo-500/50 pl-2">
                          {desc}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 italic">
                    Nenhum registro de divergência ou atestado ilegível anterior no CPF deste colaborador.
                  </p>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">
                Informe o CPF ou Nome do colaborador acima para exibir o snapshot histórico do DP.
              </p>
            )}
          </div>

          {/* 4. BARRA DE DECISÃO DO DP: BOTÕES OPERACIONAIS */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 shadow-2xl">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white text-xs uppercase tracking-wider">
                Barra de Decisão do Departamento Pessoal
              </span>
              <span className="text-[10px] text-slate-400">Clique para oficializar</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {/* Botão 1: Aprovar Atestado */}
              <button
                onClick={() => handleRecordDecision('APROVADO')}
                disabled={submittingDecision}
                className="py-3 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Aprovar Atestado</span>
              </button>

              {/* Botão 2: Aprovar com Observação */}
              <button
                onClick={() => setObservationModalOpen(true)}
                disabled={submittingDecision}
                className="py-3 px-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md disabled:opacity-50"
              >
                <AlertTriangle className="w-4 h-4" />
                <span>Aprovar c/ Observação</span>
              </button>

              {/* Botão 3: Solicitar Documento Físico */}
              <button
                onClick={() => handleRecordDecision('SOLICITADO_DOCUMENTO_FISICO')}
                disabled={submittingDecision}
                className="py-3 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-300 border border-sky-500/30 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md disabled:opacity-50"
              >
                <FileText className="w-4 h-4 text-sky-400" />
                <span>Solicitar Doc. Físico</span>
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* MODAL DE OBSERVAÇÃO PARA "APROVAR COM OBSERVAÇÃO" */}
      {observationModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 animate-scaleUp shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                Aprovação com Observação do DP
              </h3>
              <button onClick={() => setObservationModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-300">
                Insira a justificativa neutra de RH (ex: homologação administrativa com ciência de distância, revalidação telefônica na clínica ou termo assinado):
              </p>
              <textarea
                rows={4}
                value={observationText}
                onChange={(e) => setObservationText(e.target.value)}
                placeholder="Ex: Homologado pelo DP mediante confirmação verbal com a clínica receptora. Documento original arquivado na pasta."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setObservationModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleRecordDecision('APROVADO_COM_OBSERVACAO', observationText)}
                disabled={submittingDecision || !observationText.trim()}
                className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs transition-all shadow disabled:opacity-50"
              >
                Confirmar Aprovação com Observação
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
