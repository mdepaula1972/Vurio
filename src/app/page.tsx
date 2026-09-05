'use client';

import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  FileText, 
  UploadCloud, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  MessageSquare, 
  Activity, 
  Copy, 
  Check, 
  HelpCircle,
  QrCode,
  Lock,
  Layers,
  Sparkles
} from 'lucide-react';

interface ValidationLog {
  id: string;
  file_name: string;
  status: string;
  is_authentic: boolean;
  doctor_name: string | null;
  crm: string | null;
  uf: string | null;
  issuer: string | null;
  rest_days: number | null;
  start_date: string | null;
  file_hash: string;
  execution_time_ms: number;
  created_at: string;
}

export default function DashboardPage() {
  const [logs, setLogs] = useState<ValidationLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [lastResult, setLastResult] = useState<any | null>(null);
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/logs');
      const data = await res.json();
      if (data.logs) {
        setLogs(data.logs);
      }
    } catch (err) {
      console.error('Erro ao buscar logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    try {
      setAnalyzing(true);
      setLastResult(null);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('companyId', 'demo-company-1');

      const response = await fetch('/api/validate-attestation', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      setLastResult(result);
      fetchLogs();
    } catch (err) {
      console.error('Erro no upload:', err);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const copyWebhookUrl = () => {
    const url = `${window.location.origin}/api/webhook/whatsapp`;
    navigator.clipboard.writeText(url);
    setCopiedWebhook(true);
    setTimeout(() => setCopiedWebhook(false), 2000);
  };

  // Estatísticas computadas
  const totalAnalyzed = logs.length;
  const totalAuthentic = logs.filter(l => l.status === 'VALID_INTACT' || l.status === 'PHOTO_WITH_QR_CODE').length;
  const totalTampered = logs.filter(l => l.status === 'TAMPERED' || l.status === 'DUPLICATE_DOCUMENT').length;
  const totalManual = logs.filter(l => l.status === 'PHOTO_MANUAL_PAPER' || l.status === 'NO_DIGITAL_SIGNATURE').length;

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col">
      {/* Topbar */}
      <header className="border-b border-slate-800/80 bg-[#0b1220]/70 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 p-[1px] shadow-lg shadow-emerald-500/20">
              <div className="w-full h-full bg-[#070b14] rounded-xl flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-emerald-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg tracking-tight text-white">VURIO</span>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  ICP-Brasil Shield
                </span>
              </div>
              <p className="text-xs text-slate-400">Validação e Triagem Preventiva de Atestados</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="hidden sm:flex items-center space-x-2 text-xs bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-700/50">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-slate-300">Motor Criptográfico Ativo</span>
            </div>
            <div className="flex items-center space-x-1 text-xs bg-emerald-950/40 text-emerald-300 px-3 py-1.5 rounded-lg border border-emerald-800/40 font-medium">
              <span>Saldo:</span>
              <span className="font-bold text-emerald-400">99 créditos</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 space-y-8">
        
        {/* KPI Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl relative overflow-hidden group hover:border-slate-700 transition">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Atestados Analisados</p>
                <h3 className="text-2xl font-bold text-white mt-1">{totalAnalyzed}</h3>
              </div>
              <div className="p-2.5 bg-blue-500/10 rounded-xl text-blue-400">
                <Activity className="w-5 h-5" />
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-3 flex items-center">
              <Clock className="w-3.5 h-3.5 mr-1" /> Tempo médio: ~240ms
            </p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl relative overflow-hidden group hover:border-emerald-500/30 transition">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Criptograficamente Íntegros</p>
                <h3 className="text-2xl font-bold text-emerald-400 mt-1">{totalAuthentic}</h3>
              </div>
              <div className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
            </div>
            <p className="text-xs text-emerald-500/80 mt-3">
              Padrão ICP-Brasil e QR Code oficial
            </p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl relative overflow-hidden group hover:border-red-500/30 transition">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Fraudes e Adulterações</p>
                <h3 className="text-2xl font-bold text-red-400 mt-1">{totalTampered}</h3>
              </div>
              <div className="p-2.5 bg-red-500/10 rounded-xl text-red-400">
                <XCircle className="w-5 h-5" />
              </div>
            </div>
            <p className="text-xs text-red-400/80 mt-3">
              Barrados por Hash e Duplicidade
            </p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl relative overflow-hidden group hover:border-amber-500/30 transition">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Triagens Físicas (Papel)</p>
                <h3 className="text-2xl font-bold text-amber-400 mt-1">{totalManual}</h3>
              </div>
              <div className="p-2.5 bg-amber-500/10 rounded-xl text-amber-400">
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>
            <p className="text-xs text-amber-400/80 mt-3">
              Requerem checagem de carimbo físico
            </p>
          </div>
        </div>

        {/* Simulador de Upload e WhatsApp Live Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Coluna da Esquerda: Dropzone & Simulador */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-semibold text-white flex items-center">
                    <UploadCloud className="w-5 h-5 mr-2 text-emerald-400" />
                    Simulador de Validação em Tempo Real
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Faça o upload de um arquivo PDF nativo ou foto de atestado para testar o motor
                  </p>
                </div>
              </div>

              {/* Dropzone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-8 text-center transition cursor-pointer ${
                  dragActive 
                    ? 'border-emerald-500 bg-emerald-500/5' 
                    : 'border-slate-700/80 bg-slate-950/40 hover:border-slate-600'
                }`}
                onClick={() => {
                  const input = document.getElementById('attestation-file-input');
                  if (input) input.click();
                }}
              >
                <input
                  id="attestation-file-input"
                  type="file"
                  accept=".pdf,image/png,image/jpeg,image/jpg"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileUpload(e.target.files[0]);
                    }
                  }}
                />

                <div className="w-12 h-12 rounded-full bg-slate-800/80 text-emerald-400 flex items-center justify-center mx-auto mb-3">
                  {analyzing ? (
                    <div className="w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <FileText className="w-6 h-6" />
                  )}
                </div>

                {analyzing ? (
                  <p className="text-sm font-medium text-emerald-300 animate-pulse">
                    Analisando integridade criptográfica SHA-256 e assinaturas PAdES...
                  </p>
                ) : (
                  <>
                    <p className="text-sm font-medium text-slate-200">
                      Arraste e solte o atestado aqui, ou <span className="text-emerald-400 underline">clique para selecionar</span>
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Suporta arquivos PDF digitais com e-CPF/ICP-Brasil ou Fotos (JPG, PNG)
                    </p>
                  </>
                )}
              </div>

              {/* Informações Técnicas de Conformidade */}
              <div className="mt-4 p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 flex items-start space-x-3 text-xs text-slate-400">
                <Lock className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                <p>
                  <strong className="text-slate-300">Conformidade com a LGPD:</strong> Nenhum diagnóstico médico, CID ou histórico clínico é persistido nos registros. A auditoria foca estritamente na inviolabilidade documental e validade do CRM.
                </p>
              </div>
            </div>

            {/* Card de Conexão WhatsApp */}
            <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <MessageSquare className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm font-semibold text-white">Endpoint de Webhook WhatsApp</span>
                </div>
                <p className="text-xs text-slate-400">
                  Cadastre esta URL na sua instância da Z-API ou Evolution API para respostas automáticas.
                </p>
              </div>

              <button
                onClick={copyWebhookUrl}
                className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl flex items-center justify-center space-x-1.5 transition shadow-lg shadow-emerald-600/20"
              >
                {copiedWebhook ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedWebhook ? 'URL Copiada!' : 'Copiar Webhook'}</span>
              </button>
            </div>
          </div>

          {/* Coluna da Direita: Preview do WhatsApp Live Response */}
          <div className="lg:col-span-5">
            <div className="bg-[#0c1322] border border-slate-800 rounded-2xl p-5 shadow-2xl h-full flex flex-col">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Preview WhatsApp da Empresa</span>
                </div>
                <span className="text-[11px] text-slate-500">Z-API / Evolution</span>
              </div>

              <div className="flex-1 py-6 flex flex-col justify-center">
                {lastResult ? (
                  <div className="space-y-3">
                    {/* Balão do Colaborador */}
                    <div className="self-end bg-[#005c4b] text-white p-3 rounded-2xl rounded-tr-sm max-w-[85%] ml-auto text-xs shadow">
                      <div className="flex items-center space-x-2 font-medium">
                        <FileText className="w-4 h-4 text-emerald-200" />
                        <span className="truncate">{lastResult.report?.fileName || 'atestado_enviado.pdf'}</span>
                      </div>
                      <span className="text-[10px] text-emerald-200 block text-right mt-1">12:00</span>
                    </div>

                    {/* Balão de Resposta do Bot Vurio */}
                    <div className="bg-[#202c33] text-slate-100 p-4 rounded-2xl rounded-tl-sm max-w-[95%] text-xs shadow whitespace-pre-wrap font-mono leading-relaxed border border-slate-700/40">
                      {lastResult.whatsappMessage}
                      <span className="text-[10px] text-slate-400 block text-right mt-2">
                        Validado em {lastResult.executionTimeMs}ms
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-500 space-y-2">
                    <MessageSquare className="w-10 h-10 mx-auto opacity-30" />
                    <p className="text-xs">Faça o upload de um atestado ao lado para ver a resposta exata devolvida no WhatsApp.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tabela de Auditoria e Logs Recentes */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center">
                <Layers className="w-4 h-4 mr-2 text-emerald-400" />
                Histórico de Auditoria e Logs de Validação
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Rastreabilidade de integridade criptográfica para comprovação jurídica do RH
              </p>
            </div>
            <button
              onClick={fetchLogs}
              className="text-xs px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
            >
              Atualizar
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Médico / CRM</th>
                  <th className="px-5 py-3">Afastamento</th>
                  <th className="px-5 py-3">Emissor / AC</th>
                  <th className="px-5 py-3">Hash SHA-256</th>
                  <th className="px-5 py-3">Tempo</th>
                  <th className="px-5 py-3">Data/Hora</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-8 text-center text-slate-500">
                      Nenhum registro de validação localizado.
                    </td>
                  </tr>
                ) : (
                  logs.map((log, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/30 transition">
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <StatusBadge status={log.status} />
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="font-medium text-white">{log.doctor_name || 'Não identificado'}</div>
                        <div className="text-[11px] text-slate-400">
                          {log.crm ? `CRM ${log.crm}${log.uf ? `/${log.uf}` : ''}` : 'Sem CRM'}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        {log.rest_days ? (
                          <span className="font-semibold text-slate-200">
                            {log.rest_days} dia{log.rest_days > 1 ? 's' : ''}
                            {log.start_date && <span className="block text-[10px] text-slate-400">a partir de {log.start_date}</span>}
                          </span>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap text-slate-400">
                        {log.issuer || 'Desconhecido'}
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap font-mono text-[11px] text-slate-400">
                        {log.file_hash ? `${log.file_hash.substring(0, 10)}...${log.file_hash.substring(log.file_hash.length - 6)}` : '-'}
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap text-slate-400">
                        {log.execution_time_ms ? `${log.execution_time_ms}ms` : '-'}
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap text-slate-400">
                        {new Date(log.created_at).toLocaleString('pt-BR')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/60 py-6 text-center text-xs text-slate-500 bg-[#05080f]">
        <p>Vurio Shield © 2026 • Plataforma de Triagem Preventiva de Atestados Médicos Digitais (ICP-Brasil)</p>
      </footer>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'VALID_INTACT':
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Autêntico & Íntegro
        </span>
      );
    case 'PHOTO_WITH_QR_CODE':
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <QrCode className="w-3.5 h-3.5 mr-1" /> QR Code Autenticado
        </span>
      );
    case 'PHOTO_MANUAL_PAPER':
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
          <AlertTriangle className="w-3.5 h-3.5 mr-1" /> Foto de Papel (Triagem)
        </span>
      );
    case 'DUPLICATE_DOCUMENT':
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
          <XCircle className="w-3.5 h-3.5 mr-1" /> Documento Duplicado
        </span>
      );
    case 'TAMPERED':
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
          <XCircle className="w-3.5 h-3.5 mr-1" /> Documento Adulterado
        </span>
      );
    case 'NO_DIGITAL_SIGNATURE':
    default:
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-700/30 text-slate-400 border border-slate-700/50">
          <HelpCircle className="w-3.5 h-3.5 mr-1" /> Sem Assinatura Digital
        </span>
      );
  }
}
