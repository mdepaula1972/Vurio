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
  Sparkles,
  DollarSign,
  TrendingDown,
  Building2,
  Stethoscope,
  Send,
  ExternalLink,
  CreditCard,
  Percent,
  Download,
  Search,
  UserCheck,
  AlertOctagon,
  FileSpreadsheet
} from 'lucide-react';
import { TaxRegime } from '@/lib/services/batch-audit-service';

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
  inquiry_status?: string;
  created_at: string;
}

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<'validation' | 'audit' | 'inquiries' | 'doctor' | 'pricing'>('validation');
  
  // Tab 1: Validação Instantânea
  const [logs, setLogs] = useState<ValidationLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [lastResult, setLastResult] = useState<any | null>(null);
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // Tab 2: Auditoria Retroativa de Passivo
  const [salaryInput, setSalaryInput] = useState<number>(3200);
  const [taxRegime, setTaxRegime] = useState<TaxRegime>('LUCRO_PRESUMIDO');
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditSummary, setAuditSummary] = useState<any | null>(null);

  // Tab 3: Diligências
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [loadingInquiries, setLoadingInquiries] = useState(false);
  const [inquiryModalOpen, setInquiryModalOpen] = useState(false);
  const [selectedLogForInquiry, setSelectedLogForInquiry] = useState<ValidationLog | null>(null);
  const [inquiryDoctorName, setInquiryDoctorName] = useState('');
  const [inquiryCrm, setInquiryCrm] = useState('');
  const [inquiryUf, setInquiryUf] = useState('SP');
  const [inquiryPatientName, setInquiryPatientName] = useState('');
  const [inquiryClinicName, setInquiryClinicName] = useState('');
  const [inquiryGeneratedUrl, setInquiryGeneratedUrl] = useState<string | null>(null);
  const [copiedInquiryUrl, setCopiedInquiryUrl] = useState(false);

  // Tab 4: Doctor Shield
  const [searchCrm, setSearchCrm] = useState('123456');
  const [searchUf, setSearchUf] = useState('SP');
  const [crmReport, setCrmReport] = useState<any | null>(null);
  const [loadingCrmReport, setLoadingCrmReport] = useState(false);
  const [dossierPreview, setDossierPreview] = useState<any | null>(null);
  const [generatingDossier, setGeneratingDossier] = useState(false);

  // Tab 5: Planos & Faturamento
  const [billingCycle, setBillingCycle] = useState<'MONTHLY' | 'ANNUAL'>('ANNUAL');

  useEffect(() => {
    fetchLogs();
    fetchInquiries();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoadingLogs(true);
      const res = await fetch('/api/logs');
      const data = await res.json();
      if (data.logs) {
        setLogs(data.logs);
      }
    } catch (err) {
      console.error('Erro ao buscar logs:', err);
    } finally {
      setLoadingLogs(false);
    }
  };

  const fetchInquiries = async () => {
    try {
      setLoadingInquiries(true);
      const res = await fetch('/api/inquiries/respond?token=list-mock');
      // Mock inicial caso a lista venha vazia
      setInquiries([
        {
          id: 'inq-1',
          token: 'demo-token-confirmado',
          doctorCrm: '142857',
          doctorUf: 'SP',
          doctorName: 'Dr. Roberto Silveira',
          patientName: 'Marcos Vinicius Pereira',
          clinicName: 'Clínica Ortopédica Central',
          status: 'CONFIRMED_GENUINE',
          createdAt: new Date(Date.now() - 3600000 * 4).toISOString()
        },
        {
          id: 'inq-2',
          token: 'demo-token-repudiado',
          doctorCrm: '987654',
          doctorUf: 'RJ',
          doctorName: 'Dra. Mariana Costa',
          patientName: 'Lucas Ferreira Ramos',
          clinicName: 'Hospital e Maternidade São Lucas',
          status: 'REPUDIATED_BY_DOCTOR',
          createdAt: new Date(Date.now() - 3600000 * 18).toISOString()
        }
      ]);
    } catch (err) {
      console.error('Erro ao buscar diligências:', err);
    } finally {
      setLoadingInquiries(false);
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

  const handleBatchAudit = async (files?: FileList | File[]) => {
    try {
      setAuditLoading(true);
      const formData = new FormData();
      formData.append('averageMonthlySalary', salaryInput.toString());
      formData.append('taxRegime', taxRegime);
      formData.append('companyId', 'demo-company-1');

      if (files && files.length > 0) {
        Array.from(files).forEach(f => formData.append('files', f));
      }

      const res = await fetch('/api/audit/batch', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      if (data.summary) {
        setAuditSummary(data.summary);
      }
    } catch (err) {
      console.error('Erro na auditoria retroativa:', err);
    } finally {
      setAuditLoading(false);
    }
  };

  const handleTriggerInquiry = async () => {
    try {
      const res = await fetch('/api/inquiries/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: 'demo-company-1',
          validationLogId: selectedLogForInquiry?.id,
          doctorCrm: inquiryCrm || selectedLogForInquiry?.crm || '123456',
          doctorUf: inquiryUf || selectedLogForInquiry?.uf || 'SP',
          doctorName: inquiryDoctorName || selectedLogForInquiry?.doctor_name || 'Dr(a). Médico Subscritor',
          patientName: inquiryPatientName || 'Colaborador da Empresa',
          clinicName: inquiryClinicName || 'Hospital/Clínica Emissora'
        })
      });

      const data = await res.json();
      if (data.success) {
        setInquiryGeneratedUrl(data.inquiryUrl);
        setInquiries(prev => [data.inquiry, ...prev]);
      }
    } catch (err) {
      console.error('Erro ao enviar diligência:', err);
    }
  };

  const handleCheckCrmExposure = async () => {
    try {
      setLoadingCrmReport(true);
      const res = await fetch(`/api/doctor/check-crm?crm=${searchCrm}&uf=${searchUf}`);
      const data = await res.json();
      if (data.success) {
        setCrmReport(data.report);
      }
    } catch (err) {
      console.error('Erro ao consultar CRM:', err);
    } finally {
      setLoadingCrmReport(false);
    }
  };

  const handleGenerateDossierDemo = async () => {
    try {
      setGeneratingDossier(true);
      const res = await fetch('/api/doctor/incident/dossier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctorCrm: searchCrm,
          doctorUf: searchUf,
          doctorName: 'Dr. Médico Titular Cadastrado',
          patientName: 'Colaborador Notificado',
          companyName: 'Empresa Cliente Vurio',
          fileName: 'atestado_questionado_sha256.pdf',
          fileSha256: 'a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0',
          restDaysClaimed: 5,
          customStatement: 'Declaro para os devidos fins de direito e efeitos penais que NÃO realizei o atendimento e NÃO emiti o referido atestado, tratando-se de clonagem de carimbo e falsificação grosseira.'
        })
      });

      const data = await res.json();
      if (data.success) {
        setDossierPreview(data.dossier);
      }
    } catch (err) {
      console.error('Erro ao gerar dossiê:', err);
    } finally {
      setGeneratingDossier(false);
    }
  };

  // Cálculo da diária estimada em tempo real para os inputs
  const taxBurdenRate = taxRegime === 'SIMPLES' ? 0.15 : taxRegime === 'LUCRO_PRESUMIDO' ? 0.35 : 0.45;
  const calculatedDailyLaborCost = Math.round(((salaryInput * (1 + taxBurdenRate)) / 30) * 100) / 100;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navbar Corporativa */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-emerald-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-xl tracking-tight text-white">VURIO</span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Compliance Pro
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Validação Criptográfica ICP-Brasil & Antifraude Trabalhista</p>
            </div>
          </div>

          {/* Navegação por Abas */}
          <nav className="hidden lg:flex items-center space-x-1 bg-slate-950/70 p-1.5 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('validation')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'validation'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>Validação Instantânea</span>
            </button>

            <button
              onClick={() => setActiveTab('audit')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'audit'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <TrendingDown className="w-4 h-4 text-rose-400" />
              <span>Auditoria de Passivo & ROI</span>
            </button>

            <button
              onClick={() => setActiveTab('inquiries')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'inquiries'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Send className="w-4 h-4" />
              <span>Diligências 1-Clique</span>
            </button>

            <button
              onClick={() => setActiveTab('doctor')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'doctor'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Stethoscope className="w-4 h-4 text-emerald-400" />
              <span>Vurio Doctor Shield</span>
            </button>

            <button
              onClick={() => setActiveTab('pricing')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'pricing'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <CreditCard className="w-4 h-4 text-amber-300" />
              <span>Planos & Desconto 15%</span>
            </button>
          </nav>

          <div className="flex items-center space-x-3">
            <div className="hidden sm:flex items-center space-x-2 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800 text-xs text-slate-300">
              <Building2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>Empresa Demo RH</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            </div>
          </div>
        </div>

        {/* Barra de Abas Mobile */}
        <div className="lg:hidden flex overflow-x-auto px-4 py-2 border-t border-slate-800 space-x-2 scrollbar-none">
          <button
            onClick={() => setActiveTab('validation')}
            className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap ${
              activeTab === 'validation' ? 'bg-indigo-600 text-white' : 'text-slate-400 bg-slate-900'
            }`}
          >
            Validação
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap ${
              activeTab === 'audit' ? 'bg-indigo-600 text-white' : 'text-slate-400 bg-slate-900'
            }`}
          >
            Auditoria Passivo
          </button>
          <button
            onClick={() => setActiveTab('inquiries')}
            className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap ${
              activeTab === 'inquiries' ? 'bg-indigo-600 text-white' : 'text-slate-400 bg-slate-900'
            }`}
          >
            Diligências
          </button>
          <button
            onClick={() => setActiveTab('doctor')}
            className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap ${
              activeTab === 'doctor' ? 'bg-indigo-600 text-white' : 'text-slate-400 bg-slate-900'
            }`}
          >
            Doctor Shield
          </button>
          <button
            onClick={() => setActiveTab('pricing')}
            className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap ${
              activeTab === 'pricing' ? 'bg-emerald-600 text-white' : 'text-slate-400 bg-slate-900'
            }`}
          >
            Planos
          </button>
        </div>
      </header>

      {/* Conteúdo Principal por Aba */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* ========================================================================= */}
        {/* ABA 1: VALIDAÇÃO INSTANTÂNEA                                              */}
        {/* ========================================================================= */}
        {activeTab === 'validation' && (
          <div className="space-y-8 animate-fadeIn">
            {/* Banner de Boas-Vindas */}
            <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-950/60 via-slate-900 to-slate-900 border border-indigo-900/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1">
                <h1 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-6 h-6 text-emerald-400" />
                  Painel de Conformidade de Atestados
                </h1>
                <p className="text-xs text-slate-400">
                  Validação matemática de assinaturas digitais ICP-Brasil (PAdES), leitura de QR Code oficial e extração de dias de afastamento.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/api/webhook/whatsapp`);
                    setCopiedWebhook(true);
                    setTimeout(() => setCopiedWebhook(false), 2500);
                  }}
                  className="inline-flex items-center space-x-2 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-2 rounded-xl border border-slate-700 transition-colors"
                >
                  {copiedWebhook ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedWebhook ? 'Webhook Copiado!' : 'Copiar URL do Webhook WhatsApp'}</span>
                </button>
              </div>
            </div>

            {/* Grid de Upload & Resultado */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Dropzone de Upload */}
              <div className="lg:col-span-1 space-y-4">
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                  onDragLeave={() => setDragActive(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragActive(false);
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      handleFileUpload(e.dataTransfer.files[0]);
                    }
                  }}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
                    dragActive
                      ? 'border-indigo-500 bg-indigo-500/10'
                      : 'border-slate-800 bg-slate-900/40 hover:border-slate-700'
                  }`}
                >
                  <div className="w-12 h-12 rounded-xl bg-indigo-600/10 text-indigo-400 flex items-center justify-center mx-auto mb-3">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-semibold text-white">Upload de Teste Unitário</h3>
                  <p className="text-xs text-slate-400 mt-1 mb-4">
                    Arraste o PDF ou foto do atestado médico
                  </p>

                  <label className="inline-block px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl cursor-pointer shadow transition-all">
                    Selecionar Arquivo
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleFileUpload(e.target.files[0]);
                        }
                      }}
                    />
                  </label>

                  {analyzing && (
                    <div className="mt-4 flex items-center justify-center space-x-2 text-xs text-indigo-400">
                      <Clock className="w-4 h-4 animate-spin" />
                      <span>Analisando assinatura e criptografia...</span>
                    </div>
                  )}
                </div>

                {/* Card de Regra de Segurança */}
                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs space-y-2 text-slate-400">
                  <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-emerald-400" />
                    LGPD e Blindagem Trabalhista:
                  </span>
                  <p className="leading-relaxed">
                    Nenhum diagnóstico, CID ou dado clínico é armazenado. O Vurio retém exclusivamente dados funcionais do médico e prazos administrativos para abono da folha.
                  </p>
                </div>
              </div>

              {/* Resultado do Último Processamento */}
              <div className="lg:col-span-2">
                {lastResult ? (
                  <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-5">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                      <div>
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                          Laudo de Validação Técnica
                        </span>
                        <h3 className="text-lg font-bold text-white mt-0.5">
                          {lastResult.report?.doctor?.name ? `Dr(a). ${lastResult.report.doctor.name}` : 'Documento Analisado'}
                        </h3>
                      </div>
                      <div className="flex items-center space-x-2">
                        {lastResult.isAuthentic ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-bold">
                            <CheckCircle2 className="w-4 h-4 mr-1.5" /> AUTÊNTICO & ÍNTEGRO
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30 text-xs font-bold">
                            <AlertTriangle className="w-4 h-4 mr-1.5" /> INCONSISTÊNCIA DETECTADA
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                      <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
                        <span className="text-slate-500">CRM / UF:</span>
                        <p className="font-bold text-white mt-1">
                          {lastResult.report?.doctor?.crm || 'Não detectado'} {lastResult.report?.doctor?.uf ? `/${lastResult.report.doctor.uf}` : ''}
                        </p>
                      </div>

                      <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
                        <span className="text-slate-500">Afastamento:</span>
                        <p className="font-bold text-indigo-400 mt-1">
                          {lastResult.report?.restPeriod?.days ? `${lastResult.report.restPeriod.days} dias` : 'Não especificado'}
                        </p>
                      </div>

                      <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
                        <span className="text-slate-500">Assinatura ICP:</span>
                        <p className="font-bold text-white mt-1">
                          {lastResult.report?.signature?.hasSignature ? 'Presente (X.509)' : 'Ausente'}
                        </p>
                      </div>

                      <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
                        <span className="text-slate-500">Tempo de Resposta:</span>
                        <p className="font-bold text-emerald-400 mt-1">
                          {lastResult.executionTimeMs} ms
                        </p>
                      </div>
                    </div>

                    {/* Alerta e Detalhes */}
                    <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                      <span className="text-xs font-semibold text-slate-300">Mensagem Gerada para WhatsApp:</span>
                      <pre className="text-xs text-slate-300 font-mono whitespace-pre-wrap bg-slate-900 p-3 rounded-lg border border-slate-800">
                        {lastResult.whatsappMessage}
                      </pre>
                    </div>

                    {/* Botão de Diligência se Inconforme */}
                    {!lastResult.isAuthentic && (
                      <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-between">
                        <div className="text-xs text-amber-200">
                          <p className="font-bold">O atestado não possui assinatura digital válida?</p>
                          <p className="opacity-90">Dispare uma diligência formal de 1 clique para a clínica confirmar a emissão.</p>
                        </div>
                        <button
                          onClick={() => {
                            setInquiryDoctorName(lastResult.report?.doctor?.name || '');
                            setInquiryCrm(lastResult.report?.doctor?.crm || '');
                            setInquiryUf(lastResult.report?.doctor?.uf || 'SP');
                            setActiveTab('inquiries');
                            setInquiryModalOpen(true);
                          }}
                          className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition-all shadow"
                        >
                          Disparar Diligência
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-full bg-slate-900/30 border border-slate-800/60 rounded-2xl flex flex-col items-center justify-center p-8 text-center text-slate-500">
                    <FileText className="w-12 h-12 mb-3 text-slate-700" />
                    <p className="text-sm font-medium text-slate-400">Nenhuma análise realizada nesta sessão.</p>
                    <p className="text-xs mt-1">Faça o upload de um arquivo ou aguarde o envio via WhatsApp para ver o laudo aqui.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Tabela de Logs Recentes */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-400" />
                  Histórico de Validações Recentes
                </h3>
                <button
                  onClick={fetchLogs}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
                >
                  Atualizar Lista
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-400">
                  <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Documento</th>
                      <th className="py-3 px-4">Médico / CRM</th>
                      <th className="py-3 px-4">Afastamento</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Data/Hora</th>
                      <th className="py-3 px-4 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {logs.length > 0 ? (
                      logs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="py-3 px-4 font-medium text-slate-200">{log.file_name}</td>
                          <td className="py-3 px-4">
                            {log.doctor_name || 'Não identificado'}{' '}
                            {log.crm ? <span className="text-slate-500 font-mono">({log.crm}/{log.uf})</span> : ''}
                          </td>
                          <td className="py-3 px-4 text-indigo-300 font-bold">
                            {log.rest_days ? `${log.rest_days} dias` : '-'}
                          </td>
                          <td className="py-3 px-4">
                            {log.is_authentic ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                Válido
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                                {log.status}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-slate-500">
                            {new Date(log.created_at).toLocaleString('pt-BR')}
                          </td>
                          <td className="py-3 px-4 text-right">
                            {!log.is_authentic && (
                              <button
                                onClick={() => {
                                  setSelectedLogForInquiry(log);
                                  setInquiryDoctorName(log.doctor_name || '');
                                  setInquiryCrm(log.crm || '');
                                  setInquiryUf(log.uf || 'SP');
                                  setActiveTab('inquiries');
                                  setInquiryModalOpen(true);
                                }}
                                className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
                              >
                                Diligenciar
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-slate-500">
                          {loadingLogs ? 'Carregando histórico...' : 'Nenhum log registrado ainda.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* ABA 2: AUDITORIA RETROATIVA DE PASSIVO & ROI                              */}
        {/* ========================================================================= */}
        {activeTab === 'audit' && (
          <div className="space-y-8 animate-fadeIn">
            {/* Header da Seção de Auditoria */}
            <div className="p-6 rounded-2xl bg-gradient-to-r from-rose-950/40 via-slate-900 to-indigo-950/40 border border-rose-900/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-bold mb-2">
                  <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
                  <span>CALCULADORA DE SANGRIA FINANCEIRA & ROI EMPRESARIAL</span>
                </div>
                <h2 className="text-2xl font-bold text-white">
                  Auditoria Retroativa de Passivo Trabalhista
                </h2>
                <p className="text-xs text-slate-400 max-w-2xl mt-1">
                  Suba o lote de atestados passados (arquivos PDF ou pasta compactada .ZIP) para quantificar o valor total pago indevidamente em dias abonados sem respaldo pericial.
                </p>
              </div>

              <button
                onClick={() => handleBatchAudit()}
                disabled={auditLoading}
                className="px-5 py-3 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-lg shadow-rose-900/30 flex items-center space-x-2 transition-all active:scale-95"
              >
                {auditLoading ? <Clock className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
                <span>{auditLoading ? 'Auditando Lote...' : 'Simular Auditoria Demonstrativa'}</span>
              </button>
            </div>

            {/* Banner Freemium de Atração de Leads / Propaganda Impulsionada */}
            <div className="p-5 bg-gradient-to-r from-emerald-950/60 via-slate-900 to-indigo-950/60 border-2 border-dashed border-emerald-500/40 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>Campanha Diagnóstico Gratuito (Freemium)</span>
                </div>
                <h3 className="text-base font-bold text-white">
                  Audite Gratuitamente até 15 Atestados da sua Empresa
                </h3>
                <p className="text-xs text-slate-300 max-w-2xl">
                  Descubra em 2 minutos se o seu RH absorveu atestados adulterados ou sem assinatura digital ICP-Brasil nos últimos meses. Nós geramos o laudo executivo de sangria financeira para a sua diretoria sem custo.
                </p>
              </div>
              <label className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs rounded-xl cursor-pointer shadow-lg shadow-emerald-500/20 transition-all whitespace-nowrap">
                Subir 15 Atestados Grátis
                <input
                  type="file"
                  multiple
                  accept=".pdf,.zip,.jpg,.jpeg,.png"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      const limited = Array.from(e.target.files).slice(0, 15);
                      handleBatchAudit(limited);
                    }
                  }}
                />
              </label>
            </div>

            {/* Configuração de Custos de Folha (Inputs Solicitados pelo Usuário) */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                Parâmetros Reais da Folha de Pagamento da Empresa
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Média Salarial Mensal dos Colaboradores (R$):
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-slate-500 text-xs">R$</span>
                    <input
                      type="number"
                      value={salaryInput}
                      onChange={(e) => setSalaryInput(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Regime Tributário & Encargos Patronais:
                  </label>
                  <select
                    value={taxRegime}
                    onChange={(e) => setTaxRegime(e.target.value as TaxRegime)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  >
                    <option value="SIMPLES">Simples Nacional (Encargos ~15%)</option>
                    <option value="LUCRO_PRESUMIDO">Lucro Presumido (Encargos ~35%)</option>
                    <option value="LUCRO_REAL">Lucro Real / CLT Padrão (Encargos ~45%)</option>
                  </select>
                </div>

                <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex flex-col justify-center">
                  <span className="text-slate-500 text-xs">Custo Diário Real por Colaborador:</span>
                  <p className="text-xl font-extrabold text-emerald-400 mt-0.5">
                    R$ {calculatedDailyLaborCost.toFixed(2)}{' '}
                    <span className="text-[10px] text-slate-500 font-normal">/ dia útil</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Dropzone para Arquivo ZIP ou Lote */}
            <div className="border-2 border-dashed border-slate-800 hover:border-slate-700 bg-slate-900/40 rounded-2xl p-8 text-center space-y-3">
              <UploadCloud className="w-10 h-10 text-indigo-400 mx-auto" />
              <h4 className="text-sm font-bold text-white">Carregar Lote de Atestados (.ZIP ou múltiplos PDFs)</h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Selecione os arquivos dos últimos 6 ou 12 meses da sua empresa. O motor descompacta e processa centenas de documentos em minutos.
              </p>
              <label className="inline-block px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold cursor-pointer transition-all shadow">
                Selecionar Pasta ou Arquivos
                <input
                  type="file"
                  multiple
                  accept=".zip,.pdf,.jpg,.jpeg,.png"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      handleBatchAudit(e.target.files);
                    }
                  }}
                />
              </label>
            </div>

            {/* Dossiê de Sangria Financeira Gerado */}
            {auditSummary && (
              <div className="space-y-6 animate-fadeIn">
                {/* 4 Cards de Métricas de Alto Impacto */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl">
                    <span className="text-xs text-slate-400 font-medium">Documentos Auditados:</span>
                    <p className="text-2xl font-extrabold text-white mt-1">{auditSummary.totalFiles} atestados</p>
                    <div className="mt-2 text-[11px] text-emerald-400 font-medium flex items-center">
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> {auditSummary.authenticCount} conformes ({100 - auditSummary.inconsistencyRate}%)
                    </div>
                  </div>

                  <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl">
                    <span className="text-xs text-slate-400 font-medium">Inconformes / Adulterados:</span>
                    <p className="text-2xl font-extrabold text-rose-400 mt-1">{auditSummary.inconsistentCount} documentos</p>
                    <div className="mt-2 text-[11px] text-rose-400 font-medium flex items-center">
                      <AlertTriangle className="w-3.5 h-3.5 mr-1" /> Taxa de divergência: {auditSummary.inconsistencyRate}%
                    </div>
                  </div>

                  <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl">
                    <span className="text-xs text-slate-400 font-medium">Dias Pagos Indevidamente:</span>
                    <p className="text-2xl font-extrabold text-amber-400 mt-1">{auditSummary.totalDaysLost} dias</p>
                    <p className="mt-2 text-[11px] text-slate-500">Equivale a {Math.round(auditSummary.totalDaysLost / 30 * 10) / 10} meses de trabalho</p>
                  </div>

                  <div className="p-5 bg-gradient-to-br from-rose-950/60 to-slate-900 border border-rose-800/40 rounded-2xl shadow-xl">
                    <span className="text-xs text-rose-300 font-bold uppercase">Sangria Financeira Total:</span>
                    <p className="text-2xl font-black text-rose-400 mt-1">
                      R$ {auditSummary.laborEconomics.totalFinancialLoss.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <div className="mt-2 inline-flex items-center px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[11px] font-bold">
                      ROI Vurio: {auditSummary.laborEconomics.roiRatio}x no ano
                    </div>
                  </div>
                </div>

                {/* Pitch de Fechamento de Vendas B2B */}
                <div className="p-6 bg-gradient-to-r from-indigo-950/80 via-slate-900 to-emerald-950/80 border border-indigo-800/40 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h4 className="text-base font-bold text-white flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-amber-400" />
                      Proposta de Valor Irrecusável para a Diretoria Financeira (CFO):
                    </h4>
                    <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
                      Sua empresa absorveu uma perda de <strong className="text-rose-400">R$ {auditSummary.laborEconomics.totalFinancialLoss.toLocaleString('pt-BR')}</strong> por ausência de triagem criptográfica nos atestados. Ao contratar o plano anual do Vurio, o investimento se paga integralmente em menos de <strong>30 dias de operação</strong>.
                    </p>
                  </div>

                  <button
                    onClick={() => setActiveTab('pricing')}
                    className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs rounded-xl transition-all shadow-lg shadow-emerald-500/20 whitespace-nowrap"
                  >
                    Estancar Sangria Financeira
                  </button>
                </div>

                {/* Tabela de Arquivos Inconformes Identificados */}
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Detalhamento dos Atestados com Inconsistências
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-400">
                      <thead className="bg-slate-950 text-slate-400 uppercase border-b border-slate-800">
                        <tr>
                          <th className="py-2.5 px-4">Arquivo</th>
                          <th className="py-2.5 px-4">Médico / CRM</th>
                          <th className="py-2.5 px-4">Dias Abonados</th>
                          <th className="py-2.5 px-4">Prejuízo Calculado</th>
                          <th className="py-2.5 px-4">Motivo da Inconsistência</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/50">
                        {auditSummary.items.filter((i: any) => !i.isAuthentic).map((item: any, idx: number) => (
                          <tr key={idx} className="hover:bg-slate-800/30">
                            <td className="py-2.5 px-4 font-medium text-slate-200">{item.fileName}</td>
                            <td className="py-2.5 px-4">{item.doctorName || 'Não identificado'} {item.crm ? `(${item.crm})` : ''}</td>
                            <td className="py-2.5 px-4 text-amber-400 font-bold">{item.restDays} dias</td>
                            <td className="py-2.5 px-4 text-rose-400 font-bold">R$ {item.individualLoss.toFixed(2)}</td>
                            <td className="py-2.5 px-4 text-slate-500 text-[11px]">{item.reasons[0]}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* ABA 3: DILIGÊNCIAS MÉDICAS 1-CLIQUE                                       */}
        {/* ========================================================================= */}
        {activeTab === 'inquiries' && (
          <div className="space-y-8 animate-fadeIn">
            <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-950/60 via-slate-900 to-slate-900 border border-indigo-900/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-bold mb-2">
                  <Send className="w-3.5 h-3.5 text-indigo-400" />
                  <span>DILIGÊNCIAS FORMAIS PARA CLÍNICAS E MÉDICOS</span>
                </div>
                <h2 className="text-2xl font-bold text-white">Ofícios de Confirmação em 1 Clique</h2>
                <p className="text-xs text-slate-400 max-w-2xl mt-1">
                  Elimine o trabalho manual do DP de ligar para hospitais. O Vurio envia a consulta formal ao emissor e gera a certidão com valor probatório para a empresa e para o trabalhador.
                </p>
              </div>

              <button
                onClick={() => {
                  setSelectedLogForInquiry(null);
                  setInquiryModalOpen(true);
                }}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow transition-all flex items-center space-x-2"
              >
                <Send className="w-4 h-4" />
                <span>Nova Diligência Manual</span>
              </button>
            </div>

            {/* Modal de Criação de Diligência */}
            {inquiryModalOpen && (
              <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4 animate-fadeIn">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Send className="w-4 h-4 text-indigo-400" />
                  Disparo de Ofício de Diligência (Resolução CFM 1.658/2002)
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Nome do Médico:</label>
                    <input
                      type="text"
                      value={inquiryDoctorName}
                      onChange={(e) => setInquiryDoctorName(e.target.value)}
                      placeholder="Dr. Nome Sobrenome"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1">CRM e UF:</label>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={inquiryCrm}
                        onChange={(e) => setInquiryCrm(e.target.value)}
                        placeholder="123456"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                      />
                      <input
                        type="text"
                        value={inquiryUf}
                        onChange={(e) => setInquiryUf(e.target.value)}
                        placeholder="SP"
                        className="w-16 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white text-center uppercase"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Nome do Paciente / Colaborador:</label>
                    <input
                      type="text"
                      value={inquiryPatientName}
                      onChange={(e) => setInquiryPatientName(e.target.value)}
                      placeholder="Nome do Funcionário"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Clínica / Hospital:</label>
                    <input
                      type="text"
                      value={inquiryClinicName}
                      onChange={(e) => setInquiryClinicName(e.target.value)}
                      placeholder="Hospital Municipal / Clínica"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                  <button
                    onClick={() => setInquiryModalOpen(false)}
                    className="text-xs text-slate-400 hover:text-white"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleTriggerInquiry}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow"
                  >
                    Gerar Link de 1 Clique
                  </button>
                </div>

                {inquiryGeneratedUrl && (
                  <div className="p-4 bg-emerald-950/40 border border-emerald-800/40 rounded-xl space-y-2">
                    <span className="text-xs font-semibold text-emerald-300">Link de Resposta da Diligência Gerado:</span>
                    <div className="flex items-center space-x-2">
                      <input
                        readOnly
                        value={inquiryGeneratedUrl}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-300"
                      />
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(inquiryGeneratedUrl);
                          setCopiedInquiryUrl(true);
                          setTimeout(() => setCopiedInquiryUrl(false), 2500);
                        }}
                        className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg"
                      >
                        {copiedInquiryUrl ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      </button>
                      <a
                        href={inquiryGeneratedUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Lista de Diligências Disparadas */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Diligências em Andamento e Concluídas
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {inquiries.map((inq) => (
                  <div key={inq.id} className="p-5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono text-indigo-400">CRM {inq.doctorCrm}/{inq.doctorUf}</span>
                      {inq.status === 'CONFIRMED_GENUINE' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3 mr-1" /> Procedência Confirmada
                        </span>
                      ) : inq.status === 'REPUDIATED_BY_DOCTOR' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                          <AlertTriangle className="w-3 h-3 mr-1" /> Repúdio / Inautêntico
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          <Clock className="w-3 h-3 mr-1" /> Aguardando Médico
                        </span>
                      )}
                    </div>

                    <div className="text-xs space-y-1">
                      <p className="font-bold text-white">{inq.doctorName}</p>
                      <p className="text-slate-400">Paciente: <strong className="text-slate-300">{inq.patientName}</strong></p>
                      {inq.clinicName && <p className="text-slate-500 text-[11px]">{inq.clinicName}</p>}
                    </div>

                    {inq.status === 'CONFIRMED_GENUINE' && (
                      <div className="p-2.5 bg-emerald-950/30 border border-emerald-800/30 rounded-lg text-[11px] text-emerald-300 leading-relaxed">
                        🛡️ <strong>Laudo de Boa-Fé Emitido:</strong> O médico confirmou a emissão formalmente. O DP foi instruído a abonar o período sem qualquer prejuízo ao colaborador.
                      </div>
                    )}

                    {inq.status === 'REPUDIATED_BY_DOCTOR' && (
                      <div className="p-2.5 bg-rose-950/30 border border-rose-800/30 rounded-lg text-[11px] text-rose-300 leading-relaxed">
                        🚨 <strong>Falsidade Declarada pelo Emissor:</strong> O médico repudiou a emissão. Dossiê pronto para B.O. Policial e aplicação de justa causa blindada (Art. 482 CLT).
                      </div>
                    )}

                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">{new Date(inq.createdAt).toLocaleDateString('pt-BR')}</span>
                      <a
                        href={`/diligencia/${inq.token}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
                      >
                        Abrir Tela de Resposta <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* ABA 4: VURIO DOCTOR SHIELD (CRM & B.O.)                                    */}
        {/* ========================================================================= */}
        {activeTab === 'doctor' && (
          <div className="space-y-8 animate-fadeIn">
            <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-950/50 via-slate-900 to-indigo-950/50 border border-emerald-900/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-bold mb-2">
                  <Stethoscope className="w-3.5 h-3.5 text-emerald-400" />
                  <span>PROTEÇÃO PROFISSIONAL PARA MÉDICOS & CLÍNICAS</span>
                </div>
                <h2 className="text-2xl font-bold text-white">Vurio Doctor Shield</h2>
                <p className="text-xs text-slate-400 max-w-2xl mt-1">
                  Monitoramento contínuo de CRM contra clonagem de carimbo, exercício ilegal da medicina e geração automática do Dossiê para Boletim de Ocorrência Policial.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-xs px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-bold">
                  Apenas R$ 29/mês para Médicos
                </span>
              </div>
            </div>

            {/* Consulta Raio-X Histórico de CRM */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Search className="w-4 h-4 text-emerald-400" />
                  Raio-X Histórico: Saiba se seu CRM já foi envolvido em fraudes
                </h3>
                <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Base Corporativa Vurio
                </span>
              </div>
              
              <div className="p-3 bg-indigo-950/30 border border-indigo-800/30 rounded-xl text-xs text-indigo-200">
                <p className="font-semibold flex items-center gap-1.5 text-indigo-300">
                  <Lock className="w-3.5 h-3.5 text-indigo-400" />
                  Transparência de Escopo & Base de Dados:
                </p>
                <p className="text-slate-400 text-[11px] leading-relaxed mt-0.5">
                  A pesquisa e o monitoramento em tempo real operam sobre o <strong>banco de dados de documentos submetidos nas empresas clientes contratantes do Vurio em todo o Brasil</strong> (e não varredura irrestrita externa de prontuários ou sistemas de terceiros). A cada nova empresa que adota o Vurio, a rede de proteção ao seu CRM se expande automaticamente.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 max-w-md">
                <input
                  type="text"
                  value={searchCrm}
                  onChange={(e) => setSearchCrm(e.target.value)}
                  placeholder="Número do CRM"
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
                <input
                  type="text"
                  value={searchUf}
                  onChange={(e) => setSearchUf(e.target.value)}
                  placeholder="UF"
                  className="w-20 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm font-bold text-white text-center uppercase"
                />
                <button
                  onClick={handleCheckCrmExposure}
                  disabled={loadingCrmReport}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow"
                >
                  {loadingCrmReport ? 'Consultando...' : 'Consultar CRM'}
                </button>
              </div>

              {crmReport && (
                <div className="p-5 bg-slate-950 border border-slate-800 rounded-xl space-y-4 animate-fadeIn">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <span className="text-xs font-bold text-slate-300">
                      Resultado da Auditoria de Exposição • CRM {crmReport.crm}/{crmReport.uf}
                    </span>
                    <span className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded ${
                      crmReport.exposureRiskLevel === 'CRITICO' || crmReport.exposureRiskLevel === 'ALTO'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}>
                      Risco de Clonagem: {crmReport.exposureRiskLevel}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-3 bg-slate-900 rounded-lg">
                      <span className="text-slate-500">Ocorrências Totais:</span>
                      <p className="text-lg font-bold text-white mt-0.5">{crmReport.totalOccurrences}</p>
                    </div>
                    <div className="p-3 bg-slate-900 rounded-lg">
                      <span className="text-slate-500">Emissões Legítimas:</span>
                      <p className="text-lg font-bold text-emerald-400 mt-0.5">{crmReport.authenticOccurrences}</p>
                    </div>
                    <div className="p-3 bg-slate-900 rounded-lg">
                      <span className="text-slate-500">Inconsistências / Suspeitas:</span>
                      <p className="text-lg font-bold text-rose-400 mt-0.5">{crmReport.inconsistentOccurrences}</p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    {crmReport.recommendation}
                  </p>
                </div>
              )}
            </div>

            {/* Simulação do Alerta Passivo e B.O. */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Alerta Passivo no WhatsApp */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-emerald-400" />
                  Experiência do Médico: Alerta Passivo no WhatsApp
                </h3>
                <p className="text-xs text-slate-400">
                  O médico só age quando há fraude real, valorizando o seu tempo no consultório:
                </p>

                <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl font-mono text-xs text-slate-300 space-y-3">
                  <div className="flex items-center space-x-1.5 text-emerald-400 text-[11px] font-bold">
                    <span>🛡️ Vurio Doctor Shield • Notificação</span>
                  </div>
                  <p>Olá, Dr(a). Carlos Eduardo (CRM 123456/SP).</p>
                  <p>Identificamos a apresentação de um atestado sob seu registro profissional no dia de hoje em Santos/SP (Paciente: M.V.P.).</p>
                  <p className="text-emerald-300 bg-emerald-950/40 p-2 rounded border border-emerald-900/40">
                    👉 <strong>Caso tenha procedência legítima, por gentileza apenas IGNORE esta mensagem.</strong>
                  </p>
                  <p className="text-rose-300 bg-rose-950/40 p-2 rounded border border-rose-900/40">
                    🚨 <strong>SE NÃO FOI VOCÊ QUEM EMITIU:</strong> Toque no link abaixo para repudiar e emitir seu Dossiê de B.O. Policial em 1 clique.
                  </p>
                </div>

                <button
                  onClick={handleGenerateDossierDemo}
                  disabled={generatingDossier}
                  className="w-full py-3 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow"
                >
                  {generatingDossier ? 'Montando Dossiê...' : 'Simular Clique do Médico: "Não Fui Eu" (Gerar Dossiê B.O.)'}
                </button>
              </div>

              {/* Dossiê para B.O. Policial */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-400" />
                    Dossiê Pericial para Delegacia Eletrônica
                  </h3>
                  {dossierPreview && (
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(dossierPreview.plainTextReport);
                        alert('Dossiê copiado! Pronto para colar na Delegacia Eletrônica da Polícia Civil.');
                      }}
                      className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
                    >
                      <Copy className="w-3.5 h-3.5" /> Copiar Texto
                    </button>
                  )}
                </div>

                {dossierPreview ? (
                  <div className="space-y-3 animate-fadeIn">
                    <div className="p-3 bg-emerald-950/30 border border-emerald-800/30 rounded-xl text-xs text-emerald-300">
                      ✅ <strong>Dossiê Gerado:</strong> Código de Auditoria {dossierPreview.incidentCode}. Tipificação penal preliminar sugerida: Arts. 299 e 304 do Código Penal.
                    </div>
                    <pre className="h-64 overflow-y-auto p-4 bg-slate-950 border border-slate-800 rounded-xl text-[11px] font-mono text-slate-300 whitespace-pre-wrap leading-relaxed">
                      {dossierPreview.plainTextReport}
                    </pre>
                  </div>
                ) : (
                  <div className="h-64 border border-dashed border-slate-800 rounded-xl flex flex-col items-center justify-center text-center p-6 text-slate-500">
                    <AlertOctagon className="w-10 h-10 text-slate-700 mb-2" />
                    <p className="text-xs text-slate-400 font-medium">Nenhum dossiê gerado ainda.</p>
                    <p className="text-[11px] mt-1">Clique no botão de simulação ao lado para ver a peça técnica pericial pronta para a polícia.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* ABA 5: PLANOS & DIFERENCIAIS DE ASSINATURA (DESCONTO ANUAL DE 15%)         */}
        {/* ========================================================================= */}
        {activeTab === 'pricing' && (
          <div className="space-y-12 animate-fadeIn pb-12">
            {/* Header de Preços */}
            <div className="text-center max-w-3xl mx-auto space-y-3">
              <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-bold">
                <Percent className="w-3.5 h-3.5 text-emerald-400" />
                <span>TABELA DE PLANOS & CONTRATAÇÃO B2B</span>
              </div>
              <h2 className="text-3xl font-extrabold text-white tracking-tight">
                Previsibilidade, Compliance e ROI Imediato
              </h2>
              <p className="text-xs text-slate-400 max-w-xl mx-auto">
                Pagamento antecipado via Cartão de Crédito ou PIX com a tecnologia da <strong>InfinitePay</strong>, ou faturado via <strong>Boleto Bancário</strong> para contratos Enterprise.
              </p>

              {/* Toggle de Ciclo: Mensal vs Anual (-15%) */}
              <div className="inline-flex items-center p-1.5 bg-slate-900 border border-slate-800 rounded-2xl mt-4">
                <button
                  onClick={() => setBillingCycle('MONTHLY')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    billingCycle === 'MONTHLY' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Mensal
                </button>
                <button
                  onClick={() => setBillingCycle('ANNUAL')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                    billingCycle === 'ANNUAL' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span>Anual</span>
                  <span className="px-1.5 py-0.5 text-[10px] font-extrabold bg-amber-400 text-slate-950 rounded-full">
                    -15% OFF
                  </span>
                </button>
              </div>
            </div>

            {/* Grid dos 3 Planos Corporativos com Tetos Rígidos e Saudáveis */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
              {/* Plano Starter */}
              <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-2xl flex flex-col justify-between space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pequenas Empresas</span>
                    <span className="text-[10px] px-2 py-0.5 bg-slate-800 text-slate-300 rounded font-semibold">PIX ou Cartão</span>
                  </div>
                  <h3 className="text-xl font-bold text-white">Starter RH</h3>
                  <p className="text-xs text-slate-400">Ideal para empresas com até 50 colaboradores ativos.</p>
                  
                  <div className="pt-3 border-t border-slate-800">
                    <p className="text-3xl font-extrabold text-white">
                      R$ {billingCycle === 'ANNUAL' ? '126' : '149'}
                      <span className="text-xs text-slate-400 font-normal"> / mês</span>
                    </p>
                    {billingCycle === 'ANNUAL' && (
                      <span className="text-[10px] text-emerald-400 font-semibold">Cobrado R$ 1.519/ano (economia de R$ 269)</span>
                    )}
                  </div>

                  <ul className="space-y-2.5 text-xs text-slate-300 pt-3">
                    <li className="flex items-start"><Check className="w-4 h-4 text-emerald-400 mr-2 flex-shrink-0 mt-0.5" /> <span><strong>50 validações</strong> mensais inclusas</span></li>
                    <li className="flex items-start"><Check className="w-4 h-4 text-emerald-400 mr-2 flex-shrink-0 mt-0.5" /> <span>Excedente: <strong>R$ 3,50</strong> por atestado extra</span></li>
                    <li className="flex items-start"><Check className="w-4 h-4 text-emerald-400 mr-2 flex-shrink-0 mt-0.5" /> <span><strong>Rollover 30 dias:</strong> créditos não usados acumulam por 1 ciclo</span></li>
                    <li className="flex items-start"><Check className="w-4 h-4 text-emerald-400 mr-2 flex-shrink-0 mt-0.5" /> <span><strong>Auditoria de Entrada:</strong> até 50 atestados passados</span></li>
                    <li className="flex items-start"><Check className="w-4 h-4 text-emerald-400 mr-2 flex-shrink-0 mt-0.5" /> <span>1 Instância WhatsApp corporativa</span></li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <button
                    onClick={() => alert('Redirecionando para Checkout Seguro InfinitePay...')}
                    className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all"
                  >
                    Assinar Starter
                  </button>
                  <p className="text-[10px] text-center text-slate-500">Pagamento antecipado via PIX ou Cartão</p>
                </div>
              </div>

              {/* Plano Pro (Destaque) */}
              <div className="p-6 bg-gradient-to-b from-indigo-950/80 via-slate-900 to-slate-900 border-2 border-indigo-500 rounded-2xl flex flex-col justify-between space-y-6 shadow-2xl relative">
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-indigo-500 to-emerald-500 text-white text-[10px] font-black uppercase tracking-wider rounded-full shadow">
                  Mais Escolhido por RHs
                </span>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Médias Empresas</span>
                    <span className="text-[10px] px-2 py-0.5 bg-indigo-500/20 text-indigo-300 rounded font-semibold">PIX ou Cartão</span>
                  </div>
                  <h3 className="text-xl font-bold text-white">Compliance Pro</h3>
                  <p className="text-xs text-slate-400">Até 250 colaboradores com esteira completa de diligência.</p>
                  
                  <div className="pt-3 border-t border-slate-800">
                    <p className="text-3xl font-extrabold text-white">
                      R$ {billingCycle === 'ANNUAL' ? '339' : '399'}
                      <span className="text-xs text-slate-400 font-normal"> / mês</span>
                    </p>
                    {billingCycle === 'ANNUAL' && (
                      <span className="text-[10px] text-emerald-400 font-semibold">Cobrado R$ 4.069/ano (economia de R$ 719)</span>
                    )}
                  </div>

                  <ul className="space-y-2.5 text-xs text-slate-300 pt-3">
                    <li className="flex items-start"><Check className="w-4 h-4 text-emerald-400 mr-2 flex-shrink-0 mt-0.5" /> <span><strong>250 validações</strong> mensais inclusas</span></li>
                    <li className="flex items-start"><Check className="w-4 h-4 text-emerald-400 mr-2 flex-shrink-0 mt-0.5" /> <span>Excedente: <strong>R$ 2,00</strong> por atestado extra</span></li>
                    <li className="flex items-start"><Check className="w-4 h-4 text-emerald-400 mr-2 flex-shrink-0 mt-0.5" /> <span><strong>Rollover 60 dias</strong> (teto máximo de 1 mensalidade de reserva)</span></li>
                    <li className="flex items-start"><Check className="w-4 h-4 text-emerald-400 mr-2 flex-shrink-0 mt-0.5" /> <span><strong>Auditoria de Entrada:</strong> até 250 atestados do último ano</span></li>
                    <li className="flex items-start"><Check className="w-4 h-4 text-emerald-400 mr-2 flex-shrink-0 mt-0.5" /> <span><strong>Diligências 1-Clique Ilimitadas</strong> para clínicas</span></li>
                    <li className="flex items-start"><Check className="w-4 h-4 text-emerald-400 mr-2 flex-shrink-0 mt-0.5" /> <span>Laudo formal de Boa-Fé para DP e funcionário</span></li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <button
                    onClick={() => alert('Redirecionando para Checkout Seguro InfinitePay...')}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-extrabold transition-all shadow-lg shadow-indigo-600/30"
                  >
                    Assinar Compliance Pro
                  </button>
                  <p className="text-[10px] text-center text-slate-400">Recarga automática opcional para o RH não parar</p>
                </div>
              </div>

              {/* Plano Enterprise */}
              <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-2xl flex flex-col justify-between space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Grandes Corporações</span>
                    <span className="text-[10px] px-2 py-0.5 bg-slate-800 text-amber-300 rounded font-semibold">Boleto B2B Faturado</span>
                  </div>
                  <h3 className="text-xl font-bold text-white">Enterprise</h3>
                  <p className="text-xs text-slate-400">Grandes operações, indústrias, varejo e terceirizadas.</p>
                  
                  <div className="pt-3 border-t border-slate-800">
                    <p className="text-3xl font-extrabold text-white">
                      R$ {billingCycle === 'ANNUAL' ? '849' : '999'}
                      <span className="text-xs text-slate-400 font-normal"> / mês</span>
                    </p>
                    {billingCycle === 'ANNUAL' && (
                      <span className="text-[10px] text-emerald-400 font-semibold">Cobrado R$ 10.189/ano (economia de R$ 1.799)</span>
                    )}
                  </div>

                  <ul className="space-y-2.5 text-xs text-slate-300 pt-3">
                    <li className="flex items-start"><Check className="w-4 h-4 text-emerald-400 mr-2 flex-shrink-0 mt-0.5" /> <span><strong>1.000 validações</strong> mensais inclusas (expansível)</span></li>
                    <li className="flex items-start"><Check className="w-4 h-4 text-emerald-400 mr-2 flex-shrink-0 mt-0.5" /> <span>Excedente mais baixo: <strong>R$ 1,20</strong> por atestado</span></li>
                    <li className="flex items-start"><Check className="w-4 h-4 text-emerald-400 mr-2 flex-shrink-0 mt-0.5" /> <span><strong>Rollover 60 dias</strong> (teto máximo controlado)</span></li>
                    <li className="flex items-start"><Check className="w-4 h-4 text-emerald-400 mr-2 flex-shrink-0 mt-0.5" /> <span><strong>Auditoria de Entrada:</strong> até 1.000 atestados (extra R$ 0,80/doc)</span></li>
                    <li className="flex items-start"><Check className="w-4 h-4 text-emerald-400 mr-2 flex-shrink-0 mt-0.5" /> <span><strong>Múltiplas Instâncias de WhatsApp:</strong> filiais e turnos segregados</span></li>
                    <li className="flex items-start"><Check className="w-4 h-4 text-emerald-400 mr-2 flex-shrink-0 mt-0.5" /> <span>API REST dedicada + Gestor de Conta Exclusivo</span></li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <button
                    onClick={() => alert('Entrando em contato com nosso time corporativo...')}
                    className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all"
                  >
                    Falar com Consultor B2B
                  </button>
                  <p className="text-[10px] text-center text-slate-500">Faturamento a 15/30 dias via Boleto Bancário</p>
                </div>
              </div>
            </div>

            {/* TABELA COMPARATIVA DE RECURSOS (FEATURE MATRIX COMPLETA) */}
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 space-y-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-base font-bold text-white">Matriz Comparativa de Recursos</h3>
                  <p className="text-xs text-slate-400">Detalhamento técnico de limites, franquias e políticas de uso.</p>
                </div>
                <span className="text-xs text-slate-400 font-medium">Todos os planos incluem conformidade integral com a LGPD</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider border-b border-slate-800 font-semibold">
                    <tr>
                      <th className="py-3 px-4">Recurso ou Capacidade</th>
                      <th className="py-3 px-4 text-center">Starter RH</th>
                      <th className="py-3 px-4 text-center text-indigo-300">Compliance Pro</th>
                      <th className="py-3 px-4 text-center">Enterprise</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    <tr>
                      <td className="py-3 px-4 font-semibold text-white">Validações Mensais Inclusas</td>
                      <td className="py-3 px-4 text-center">50 / mês</td>
                      <td className="py-3 px-4 text-center font-bold text-indigo-400">250 / mês</td>
                      <td className="py-3 px-4 text-center font-bold text-emerald-400">1.000 / mês (expansível)</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-semibold text-white">Custo do Atestado Excedente</td>
                      <td className="py-3 px-4 text-center">R$ 3,50</td>
                      <td className="py-3 px-4 text-center text-indigo-400">R$ 2,00</td>
                      <td className="py-3 px-4 text-center text-emerald-400">R$ 1,20</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-semibold text-white">Acúmulo de Sobras (Rollover)</td>
                      <td className="py-3 px-4 text-center">30 dias (1 ciclo)</td>
                      <td className="py-3 px-4 text-center">60 dias (teto de 1 mensalidade)</td>
                      <td className="py-3 px-4 text-center">60 dias (teto rígido de reserva)</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-semibold text-white">Auditoria Retroativa Inclusa</td>
                      <td className="py-3 px-4 text-center">Até 50 atestados</td>
                      <td className="py-3 px-4 text-center font-bold text-indigo-400">Até 250 atestados</td>
                      <td className="py-3 px-4 text-center font-bold text-emerald-400">Até 1.000 atestados</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-semibold text-white">Excedente de Auditoria em Lote</td>
                      <td className="py-3 px-4 text-center">R$ 1,50 / doc extra</td>
                      <td className="py-3 px-4 text-center">R$ 1,00 / doc extra</td>
                      <td className="py-3 px-4 text-center text-emerald-400">R$ 0,80 / doc extra</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-semibold text-white">Diligências 1-Clique para Clínicas</td>
                      <td className="py-3 px-4 text-center">10 / mês</td>
                      <td className="py-3 px-4 text-center text-emerald-400 font-bold">Ilimitadas</td>
                      <td className="py-3 px-4 text-center text-emerald-400 font-bold">Ilimitadas</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-semibold text-white">Laudo Formal de Boa-Fé (DP e Funcionário)</td>
                      <td className="py-3 px-4 text-center text-emerald-400">Incluso</td>
                      <td className="py-3 px-4 text-center text-emerald-400">Incluso</td>
                      <td className="py-3 px-4 text-center text-emerald-400">Incluso</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-semibold text-white">Instâncias de WhatsApp Conectadas</td>
                      <td className="py-3 px-4 text-center">1 número corporativo</td>
                      <td className="py-3 px-4 text-center">1 número corporativo</td>
                      <td className="py-3 px-4 text-center font-bold text-indigo-400">Múltiplas filiais e turnos</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-semibold text-white">Formas de Pagamento</td>
                      <td className="py-3 px-4 text-center">Cartão ou PIX</td>
                      <td className="py-3 px-4 text-center">Cartão ou PIX</td>
                      <td className="py-3 px-4 text-center font-bold text-amber-300">Boleto B2B ou Cartão</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-semibold text-white">Suporte Técnico</td>
                      <td className="py-3 px-4 text-center">E-mail (até 24h)</td>
                      <td className="py-3 px-4 text-center text-indigo-400">WhatsApp Prioritário</td>
                      <td className="py-3 px-4 text-center text-emerald-400">Gestor de Conta Exclusivo</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* SEÇÃO DE SERVIÇOS AVULSOS & ADD-ONS (ALTA RENTABILIDADE) */}
            <div className="space-y-4">
              <div className="space-y-1">
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Flexibilidade Sob Demanda</span>
                <h3 className="text-xl font-bold text-white">Serviços Avulsos & Pacotes Adicionais</h3>
                <p className="text-xs text-slate-400">Contrate serviços pontuais sem alterar sua mensalidade.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col justify-between space-y-3">
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300">
                      Peça Pericial Formal
                    </span>
                    <h4 className="text-sm font-bold text-white">Dossiê para B.O. Policial Avulso</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Elaboração da notícia-crime estruturada com prova técnica de hash SHA-256 e enquadramento nos Arts. 299 e 304 do Código Penal para a Delegacia Eletrônica.
                    </p>
                  </div>
                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-500">Por ocorrência:</span>
                      <p className="text-lg font-extrabold text-white">R$ 89,00</p>
                    </div>
                    <button
                      onClick={() => alert('Emissão avulsa de Dossiê Policial iniciada')}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold"
                    >
                      Emitir Peça
                    </button>
                  </div>
                </div>

                {/* Card 2: Compra Única Avulsa Sem Assinatura */}
                <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col justify-between space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
                        Sem Assinatura (Avulso)
                      </span>
                      <span className="text-[10px] text-slate-500">R$ 5,00 / consulta</span>
                    </div>
                    <h4 className="text-sm font-bold text-white">Pacote Único: 30 Validações</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Compra única sem mensalidade. Validação criptográfica pontual ICP-Brasil sem esteira de diligências contínuas ou benefícios de planos recorrentes.
                    </p>
                  </div>
                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-500">30 consultas avulsas:</span>
                      <p className="text-lg font-extrabold text-amber-400">R$ 150,00</p>
                    </div>
                    <button
                      onClick={() => alert('Checkout de Pacote Avulso de 30 consultas via InfinitePay (R$ 150,00)...')}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold"
                    >
                      Comprar Avulso
                    </button>
                  </div>
                </div>

                {/* Card 3: Auditoria em Lote Avulsa (Não-Assinantes) */}
                <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col justify-between space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                        Diagnóstico Pontual
                      </span>
                      <span className="text-[10px] text-slate-500">R$ 3,00 / doc</span>
                    </div>
                    <h4 className="text-sm font-bold text-white">Auditoria em Lote Avulsa</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Para empresas não-assinantes que desejam apenas uma perícia pontual de passivo em arquivo morto (mínimo de 50 atestados = R$ 150,00). Assinantes têm franquias inclusas e excedente a R$ 0,80.
                    </p>
                  </div>
                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-500">Valor avulso:</span>
                      <p className="text-lg font-extrabold text-white">R$ 3,00 <span className="text-xs text-slate-500 font-normal">/ doc</span></p>
                    </div>
                    <button
                      onClick={() => alert('Solicitação de Auditoria Avulsa iniciada')}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold"
                    >
                      Auditar Lote
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* SEÇÃO VURIO DOCTOR SHIELD (PLANOS REFINADOS PARA MÉDICOS) */}
            <div className="p-6 bg-gradient-to-r from-emerald-950/60 via-slate-900 to-indigo-950/60 border border-emerald-800/40 rounded-2xl space-y-6">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
                <div className="space-y-1">
                  <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold uppercase">
                    <Stethoscope className="w-3 h-3 text-emerald-400" />
                    <span>Proteção e Economia de Tempo para Médicos</span>
                  </div>
                  <h4 className="text-xl font-bold text-white">Vurio Doctor Shield</h4>
                  <p className="text-xs text-slate-300 max-w-2xl">
                    Evite perder R$ 1.500 em consultas não atendidas por ter que se deslocar a uma delegacia. O Vurio monitora seu CRM e você só age quando houver clonagem de carimbo.
                  </p>
                  <p className="text-[11px] text-slate-400 italic">
                    ℹ️ Transparência de Escopo: A pesquisa e alertas baseiam-se continuamente na base corporativa de atestados apresentados nas empresas clientes contratantes da rede Vurio em todo o Brasil.
                  </p>
                </div>

                <span className="text-xs text-slate-400">Cobrança individual por profissional médico</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Doctor Shield Básico */}
                <div className="p-5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <h5 className="font-bold text-white text-base">Doctor Shield Básico</h5>
                    <p className="text-xl font-extrabold text-emerald-400">R$ 29 <span className="text-xs text-slate-500 font-normal">/ mês</span></p>
                  </div>
                  <ul className="space-y-2 text-xs text-slate-300">
                    <li className="flex items-center"><Check className="w-3.5 h-3.5 text-emerald-400 mr-2" /> Monitoramento de CRM em todo o Brasil</li>
                    <li className="flex items-center"><Check className="w-3.5 h-3.5 text-emerald-400 mr-2" /> Alerta passivo no WhatsApp (*"Ignore se procedente..."*)</li>
                    <li className="flex items-center"><Check className="w-3.5 h-3.5 text-emerald-400 mr-2" /> Raio-X Histórico de exposições passadas</li>
                    <li className="flex items-center text-slate-400"><AlertOctagon className="w-3.5 h-3.5 text-amber-400 mr-2" /> Dossiê para B.O. Policial contratado à parte por R$ 89 quando houver fraude</li>
                  </ul>
                  <button
                    onClick={() => alert('Assinatura Doctor Shield Básico via InfinitePay')}
                    className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all"
                  >
                    Assinar Básico (R$ 29/mês)
                  </button>
                </div>

                {/* Doctor Shield VIP */}
                <div className="p-5 bg-gradient-to-b from-emerald-950/40 to-slate-950/80 border-2 border-emerald-500/50 rounded-xl space-y-4 relative">
                  <span className="absolute -top-2.5 right-4 px-2 py-0.5 bg-emerald-500 text-slate-950 text-[10px] font-black uppercase rounded-full">
                    Mais Tranquilidade
                  </span>
                  <div className="flex items-center justify-between">
                    <h5 className="font-bold text-white text-base">Doctor Shield VIP</h5>
                    <p className="text-xl font-extrabold text-emerald-400">R$ 59 <span className="text-xs text-slate-500 font-normal">/ mês</span></p>
                  </div>
                  <ul className="space-y-2 text-xs text-slate-300">
                    <li className="flex items-center"><Check className="w-3.5 h-3.5 text-emerald-400 mr-2" /> Todos os recursos do plano Básico</li>
                    <li className="flex items-center"><Check className="w-3.5 h-3.5 text-emerald-400 mr-2" /> <strong>2 Dossiês de B.O. Policial Inclusos por ano</strong> (sem taxa de R$ 89)</li>
                    <li className="flex items-center"><Check className="w-3.5 h-3.5 text-emerald-400 mr-2" /> Notificação prioritária automática à empresa</li>
                    <li className="flex items-center"><Check className="w-3.5 h-3.5 text-emerald-400 mr-2" /> Suporte técnico pericial especializado</li>
                  </ul>
                  <button
                    onClick={() => alert('Assinatura Doctor Shield VIP via InfinitePay')}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-600/30"
                  >
                    Assinar VIP (R$ 59/mês)
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
