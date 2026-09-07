'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
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
  FileSpreadsheet,
  MapPin,
  Sliders,
  Compass,
  Zap,
  CheckCircle,
  ArrowRight,
  Eye,
  Settings,
  Scale,
  ArrowLeft,
  ChevronRight
} from 'lucide-react';
import { TaxRegime } from '@/lib/services/batch-audit-service';
import { auditGeoDistance, GeoAuditResult } from '@/lib/services/geo-audit-service';
import { getCompanyPolicy, updateCompanyPolicy, CompanyPolicyConfig } from '@/lib/services/company-policy-service';

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

export default function DashboardClientPage() {
  const [activeTab, setActiveTab] = useState<'validation' | 'audit' | 'inquiries' | 'doctor' | 'geo' | 'policies'>('validation');
  
  // Tab 1: Validação Instantânea & Showcase
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

  // Tab 5: Geo-Shield Demo
  const [geoWorkCity, setGeoWorkCity] = useState('Santos');
  const [geoClinicCity, setGeoClinicCity] = useState('Ribeirão Preto');
  const [geoResult, setGeoResult] = useState<GeoAuditResult>(() => auditGeoDistance({
    clinicAddressOrCity: 'Ribeirão Preto',
    employeeWorkCity: 'Santos'
  }));

  // Tab 6: Políticas da Empresa
  const [policyConfig, setPolicyConfig] = useState<CompanyPolicyConfig>(getCompanyPolicy());
  const [policySaved, setPolicySaved] = useState(false);

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
      const res = await fetch('/api/inquiries/send');
      const data = await res.json();
      if (data.inquiries) {
        setInquiries(data.inquiries);
      }
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
      formData.append('company_id', '00000000-0000-0000-0000-000000000001');

      const res = await fetch('/api/validate-attestation', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      setLastResult(data);
      fetchLogs();
    } catch (err) {
      console.error('Erro ao analisar arquivo:', err);
      alert('Falha na conexão com o servidor de validação pericial.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleBatchAudit = async () => {
    try {
      setAuditLoading(true);
      const res = await fetch('/api/audit/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: '00000000-0000-0000-0000-000000000001',
          salaryRange: salaryInput,
          taxRegime
        })
      });

      const data = await res.json();
      if (data.success) {
        setAuditSummary(data.summary);
      }
    } catch (err) {
      console.error('Erro ao auditar lote:', err);
    } finally {
      setAuditLoading(false);
    }
  };

  const openInquiryModal = (log: ValidationLog) => {
    setSelectedLogForInquiry(log);
    setInquiryDoctorName(log.doctor_name || '');
    setInquiryCrm(log.crm || '');
    setInquiryUf(log.uf || 'SP');
    setInquiryPatientName('');
    setInquiryClinicName('');
    setInquiryGeneratedUrl(null);
    setInquiryModalOpen(true);
  };

  const handleSendInquiry = async () => {
    try {
      const res = await fetch('/api/inquiries/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          validationLogId: selectedLogForInquiry?.id,
          companyId: '00000000-0000-0000-0000-000000000001',
          doctorName: inquiryDoctorName || 'Médico Responsável',
          doctorCrm: inquiryCrm || '000000',
          doctorUf: inquiryUf || 'SP',
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

  const handleSavePolicy = () => {
    updateCompanyPolicy(policyConfig);
    setPolicySaved(true);
    setTimeout(() => setPolicySaved(false), 2500);
  };

  const taxBurdenRate = taxRegime === 'SIMPLES' ? 0.15 : taxRegime === 'LUCRO_PRESUMIDO' ? 0.35 : 0.45;
  const calculatedDailyLaborCost = Math.round(((salaryInput * (1 + taxBurdenRate)) / 30) * 100) / 100;

  return (
    <div className="min-h-screen text-slate-100 flex flex-col font-sans selection:bg-sky-500/30 selection:text-sky-200">
      
      {/* Top Navbar do Painel do Cliente */}
      <header className="border-b border-slate-800/60 bg-slate-900/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link 
              href="/"
              className="flex items-center space-x-2 text-xs text-slate-400 hover:text-white transition-all px-2.5 py-1 rounded-lg hover:bg-slate-800"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Página Inicial</span>
            </Link>

            <div className="h-4 w-px bg-slate-800"></div>

            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-sky-500 via-indigo-600 to-emerald-500 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="font-extrabold text-base tracking-tight text-white">VURIO</span>
                <span className="ml-1.5 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-400 border border-sky-500/30">
                  Painel DP
                </span>
              </div>
            </div>
          </div>

          {/* Abas Operacionais */}
          <nav className="hidden lg:flex items-center space-x-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800/80">
            <button
              onClick={() => setActiveTab('validation')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'validation'
                  ? 'bg-sky-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Validador & Logs</span>
            </button>

            <button
              onClick={() => setActiveTab('inquiries')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'inquiries'
                  ? 'bg-sky-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>Diligências</span>
            </button>

            <button
              onClick={() => setActiveTab('geo')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'geo'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'text-amber-300 hover:text-white hover:bg-slate-900'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Geo-Shield</span>
            </button>

            <button
              onClick={() => setActiveTab('policies')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'policies'
                  ? 'bg-sky-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Sliders className="w-3.5 h-3.5 text-slate-300" />
              <span>Políticas CCT</span>
            </button>

            <button
              onClick={() => setActiveTab('audit')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'audit'
                  ? 'bg-sky-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
              <span>Passivo em Lote</span>
            </button>

            <button
              onClick={() => setActiveTab('doctor')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'doctor'
                  ? 'bg-sky-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Stethoscope className="w-3.5 h-3.5 text-emerald-400" />
              <span>Doctor Shield</span>
            </button>
          </nav>

          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-800 text-xs text-slate-300">
              <Building2 className="w-3.5 h-3.5 text-sky-400" />
              <span className="font-medium">{policyConfig.companyName}</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            </div>
          </div>
        </div>

        {/* Menu Mobile */}
        <div className="lg:hidden flex overflow-x-auto px-4 py-2 border-t border-slate-800/80 space-x-2 scrollbar-none bg-slate-950/60">
          <button onClick={() => setActiveTab('validation')} className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap ${activeTab === 'validation' ? 'bg-sky-600 text-white' : 'text-slate-400 bg-slate-900'}`}>Validador</button>
          <button onClick={() => setActiveTab('inquiries')} className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap ${activeTab === 'inquiries' ? 'bg-sky-600 text-white' : 'text-slate-400 bg-slate-900'}`}>Diligências</button>
          <button onClick={() => setActiveTab('geo')} className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap ${activeTab === 'geo' ? 'bg-amber-600 text-white' : 'text-amber-300 bg-slate-900'}`}>Geo-Shield</button>
          <button onClick={() => setActiveTab('policies')} className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap ${activeTab === 'policies' ? 'bg-sky-600 text-white' : 'text-slate-400 bg-slate-900'}`}>Políticas CCT</button>
          <button onClick={() => setActiveTab('audit')} className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap ${activeTab === 'audit' ? 'bg-sky-600 text-white' : 'text-slate-400 bg-slate-900'}`}>Passivo</button>
          <button onClick={() => setActiveTab('doctor')} className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap ${activeTab === 'doctor' ? 'bg-sky-600 text-white' : 'text-slate-400 bg-slate-900'}`}>Doctor Shield</button>
        </div>
      </header>

      {/* Conteúdo Operacional */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* ABA 1: VALIDAÇÃO & LOGS */}
        {activeTab === 'validation' && (
          <div className="space-y-8 animate-fadeIn">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Dropzone */}
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
                      ? 'border-sky-500 bg-sky-500/10'
                      : 'border-slate-800 bg-slate-900/40 hover:border-slate-700'
                  }`}
                >
                  <div className="w-12 h-12 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center mx-auto mb-3">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-white mb-1">Upload de Atestado</h3>
                  <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                    Envie o arquivo PDF original ou foto nítida do receituário.
                  </p>
                  
                  <label className="inline-flex items-center justify-center px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-semibold cursor-pointer transition-all shadow">
                    <span>Selecionar Documento</span>
                    <input
                      type="file"
                      accept=".pdf,image/*"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleFileUpload(e.target.files[0]);
                        }
                      }}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Status da Conexão com WhatsApp */}
                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Canal WhatsApp:</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold">Ativo & Conectado</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Seus colaboradores podem enviar o atestado direto no WhatsApp da empresa para auditoria em 3 segundos.
                  </p>
                </div>
              </div>

              {/* Painel de Resultados */}
              <div className="lg:col-span-2">
                {analyzing ? (
                  <div className="h-64 rounded-2xl bg-slate-900/40 border border-slate-800 flex flex-col items-center justify-center text-center p-6 space-y-3">
                    <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-sm font-semibold text-white">Executando Perícia Documental...</p>
                    <p className="text-xs text-slate-400">Checando ICP-Brasil, CFM Nacional, datas e regras da CCT.</p>
                  </div>
                ) : lastResult ? (
                  <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <span className="text-sm font-bold text-white">Resultado da Auditoria</span>
                      <span className="text-xs text-slate-400">{lastResult.report?.executionTimeMs || 0} ms</span>
                    </div>

                    <div className="space-y-3 text-xs">
                      <p className="text-slate-300"><strong>Arquivo:</strong> {lastResult.report?.fileName}</p>
                      <p className="text-slate-300"><strong>Status:</strong> {lastResult.report?.status}</p>
                      {lastResult.report?.doctor?.name && (
                        <p className="text-slate-300"><strong>Médico:</strong> {lastResult.report.doctor.name} ({lastResult.report.doctor.crm}/{lastResult.report.doctor.uf})</p>
                      )}
                      {lastResult.report?.restPeriod?.days && (
                        <p className="text-slate-300"><strong>Afastamento:</strong> {lastResult.report.restPeriod.days} dias</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="h-64 rounded-2xl bg-slate-900/40 border border-slate-800 flex flex-col items-center justify-center text-center p-6 text-slate-400 text-xs">
                    <FileText className="w-8 h-8 text-slate-600 mb-2" />
                    <p>Nenhum documento analisado nesta sessão.</p>
                    <p className="text-slate-500">Faça o upload ou envie pelo WhatsApp para visualizar o laudo técnico.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Tabela de Logs Recentes */}
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white">Histórico de Atestados Auditados</h3>
                <span className="text-xs text-slate-400">{logs.length} registros</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">Data</th>
                      <th className="py-2.5 px-3">Arquivo</th>
                      <th className="py-2.5 px-3">Médico</th>
                      <th className="py-2.5 px-3">CRM</th>
                      <th className="py-2.5 px-3">Afastamento</th>
                      <th className="py-2.5 px-3">Parecer</th>
                      <th className="py-2.5 px-3">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {logs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-900/40">
                        <td className="py-2.5 px-3 text-slate-500">{new Date(log.created_at).toLocaleDateString('pt-BR')}</td>
                        <td className="py-2.5 px-3 text-white font-medium truncate max-w-[150px]">{log.file_name}</td>
                        <td className="py-2.5 px-3">{log.doctor_name || '—'}</td>
                        <td className="py-2.5 px-3">{log.crm ? `${log.crm}/${log.uf}` : '—'}</td>
                        <td className="py-2.5 px-3">{log.rest_days ? `${log.rest_days} dias` : '—'}</td>
                        <td className="py-2.5 px-3">
                          {log.is_authentic ? (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold">Conforme</span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 text-[10px] font-bold">Averiguação</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3">
                          <button
                            onClick={() => openInquiryModal(log)}
                            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-sky-400 text-[11px] font-semibold"
                          >
                            Diligência
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ABA 2: DILIGÊNCIAS */}
        {activeTab === 'inquiries' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Send className="w-5 h-5 text-sky-400" />
                Esteira de Diligências Médicas 1-Clique
              </h2>
              <p className="text-xs text-slate-400">
                Ofícios formais automáticos emitidos nos termos da Resolução CFM 1.658/2002 para confirmação de atendimento direto com a clínica.
              </p>

              <div className="overflow-x-auto pt-2">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Médico</th>
                      <th className="py-3 px-4">CRM / UF</th>
                      <th className="py-3 px-4">Colaborador</th>
                      <th className="py-3 px-4">Clínica</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Data</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {inquiries.map((inq) => (
                      <tr key={inq.id} className="hover:bg-slate-900/40">
                        <td className="py-3 px-4 font-semibold text-white">{inq.doctorName}</td>
                        <td className="py-3 px-4">{inq.doctorCrm}/{inq.doctorUf}</td>
                        <td className="py-3 px-4">{inq.patientName}</td>
                        <td className="py-3 px-4">{inq.clinicName}</td>
                        <td className="py-3 px-4">
                          {inq.status === 'CONFIRMED_GENUINE' ? (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold">
                              Confirmado
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 text-[10px] font-bold">
                              Repudiado
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-500">{new Date(inq.createdAt).toLocaleDateString('pt-BR')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ABA 3: GEO-SHIELD */}
        {activeTab === 'geo' && (
          <div className="space-y-8 animate-fadeIn">
            <div className="p-6 rounded-2xl bg-gradient-to-r from-amber-950/30 via-slate-900 to-slate-900 border border-amber-500/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-extrabold uppercase mb-2">
                  <MapPin className="w-3 h-3 text-amber-400" />
                  <span>Produto Adicional • Módulo Geo-Shield</span>
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-white">
                  Auditoria de Deslocamento & Endereço
                </h2>
                <p className="text-xs text-slate-300 max-w-2xl">
                  Cruza a cidade do posto de trabalho com o endereço físico da clínica para identificar inconsistências de deslocamento (ex: Santos x Ribeirão Preto).
                </p>
              </div>

              <div className="px-4 py-2 rounded-xl bg-slate-950/80 border border-amber-500/30 text-right">
                <span className="text-[10px] text-slate-400">Add-on Corporativo:</span>
                <p className="text-base font-extrabold text-amber-400">R$ 49/mês <span className="text-xs font-normal text-slate-400">ou +R$ 3 avulso</span></p>
              </div>
            </div>

            {/* Simulador de Distância */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Compass className="w-4 h-4 text-amber-400" />
                  Simulador de Rota
                </h3>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-slate-400 mb-1">Cidade Sede / Posto de Trabalho:</label>
                    <input
                      type="text"
                      value={geoWorkCity}
                      onChange={(e) => {
                        setGeoWorkCity(e.target.value);
                        setGeoResult(auditGeoDistance({ clinicAddressOrCity: geoClinicCity, employeeWorkCity: e.target.value }));
                      }}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                      placeholder="Ex: Santos"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Cidade da Clínica Emissora:</label>
                    <input
                      type="text"
                      value={geoClinicCity}
                      onChange={(e) => {
                        setGeoClinicCity(e.target.value);
                        setGeoResult(auditGeoDistance({ clinicAddressOrCity: e.target.value, employeeWorkCity: geoWorkCity }));
                      }}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                      placeholder="Ex: Ribeirão Preto"
                    />
                  </div>
                </div>
              </div>

              {/* Parecer do Geo-Shield */}
              <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-2xl flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Parecer de Localização
                  </span>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-400">Distância Rodoviária Estimada:</p>
                      <p className="text-2xl font-black text-white">~{geoResult.distanceKm} km</p>
                    </div>

                    <div>
                      {geoResult.isCompatible ? (
                        <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-bold">
                          ✓ COERENTE
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 text-xs font-bold">
                          ⚠️ AVERIGUAÇÃO RECOMENDADA
                        </span>
                      )}
                    </div>
                  </div>

                  {geoResult.alert && (
                    <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-800/40 text-xs space-y-1 text-amber-200">
                      <p className="font-bold">{geoResult.alert.title}</p>
                      <p className="text-slate-300">{geoResult.alert.description}</p>
                      <p className="text-slate-400 italic">Sugestão: {geoResult.alert.recommendation}</p>
                    </div>
                  )}
                </div>

                <div className="text-[11px] text-slate-400 border-t border-slate-800 pt-3">
                  ⚖️ Amparo legal: Art. 482 da CLT para apuração preventiva de conformidade.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ABA 4: POLÍTICAS CCT */}
        {activeTab === 'policies' && (
          <div className="space-y-8 animate-fadeIn">
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-sky-400" />
                  Políticas Internas de RH & CCT
                </h2>
                <p className="text-xs text-slate-400">
                  Defina os prazos e parâmetros para que os laudos reflitam a convenção coletiva da sua categoria.
                </p>
              </div>

              {policySaved && (
                <div className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 text-xs font-bold flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4" />
                  <span>Configurações Salvas!</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-4">
                <h3 className="text-sm font-bold text-white">Prazo Limite de Entrega de Atestado</h3>
                <select
                  value={policyConfig.maxRetroactiveHours}
                  onChange={(e) => setPolicyConfig({ ...policyConfig, maxRetroactiveHours: parseInt(e.target.value, 10) })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-xs"
                >
                  <option value={24}>24 horas (1 dia útil)</option>
                  <option value={48}>48 horas (2 dias - Padrão CCT)</option>
                  <option value={72}>72 horas (3 dias)</option>
                  <option value={120}>120 horas (5 dias)</option>
                </select>

                <div className="pt-2">
                  <label className="block text-xs text-slate-400 mb-1">Cidade Principal de Lotação:</label>
                  <input
                    type="text"
                    value={policyConfig.workCity}
                    onChange={(e) => setPolicyConfig({ ...policyConfig, workCity: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs"
                    placeholder="Ex: Santos"
                  />
                </div>

                <button
                  onClick={handleSavePolicy}
                  className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition-all shadow"
                >
                  Salvar Políticas do RH
                </button>
              </div>

              <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-3 text-xs text-slate-300">
                <h3 className="text-sm font-bold text-white">Garantias de Compliance:</h3>
                <p>• Atestados entregues após {policyConfig.maxRetroactiveHours}h receberão um apontamento amigável sugerindo conferir se houve internação.</p>
                <p>• Atendimentos presenciais acima de {policyConfig.maxAllowedDistanceKm} km da sede ({policyConfig.workCity}) serão destacados com prudência.</p>
                <p>• Linguagem 100% de auditoria técnica sem atribuir dolo ao trabalhador.</p>
              </div>
            </div>
          </div>
        )}

        {/* ABA 5: PASSIVO EM LOTE */}
        {activeTab === 'audit' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-rose-400" />
                Auditoria de Passivo Trabalhista em Arquivo Morto
              </h2>
              <p className="text-xs text-slate-400">
                Identifique valores pagos indevidamente por afastamentos irregulares em lotes retroativos.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Salário Médio (R$):</label>
                  <input
                    type="number"
                    value={salaryInput}
                    onChange={(e) => setSalaryInput(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Regime Tributário:</label>
                  <select
                    value={taxRegime}
                    onChange={(e) => setTaxRegime(e.target.value as TaxRegime)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs"
                  >
                    <option value="SIMPLES">Simples Nacional (15%)</option>
                    <option value="LUCRO_PRESUMIDO">Lucro Presumido (35%)</option>
                    <option value="LUCRO_REAL">Lucro Real (45%)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Custo Diário Calculado:</label>
                  <div className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-emerald-400 font-bold text-xs">
                    R$ {calculatedDailyLaborCost.toFixed(2)} / dia
                  </div>
                </div>
              </div>

              <button
                onClick={handleBatchAudit}
                disabled={auditLoading}
                className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all shadow"
              >
                {auditLoading ? 'Processando Lote...' : 'Simular Auditoria em Lote'}
              </button>

              {auditSummary && (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1 text-xs">
                  <p className="text-white font-bold">Resultado:</p>
                  <p className="text-slate-300">Total Auditados: {auditSummary.totalAudited}</p>
                  <p className="text-rose-400 font-bold">Possível Passivo: R$ {auditSummary.estimatedFinancialLoss?.toFixed(2)}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ABA 6: DOCTOR SHIELD */}
        {activeTab === 'doctor' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-emerald-400" />
                Vurio Doctor Shield: Proteção ao Médico
              </h2>
              <p className="text-xs text-slate-400">
                Consulte se seu CRM foi clonado ou utilizado sem seu consentimento em documentos suspeitos.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <input
                  type="text"
                  value={searchCrm}
                  onChange={(e) => setSearchCrm(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs w-36"
                  placeholder="CRM"
                />
                <input
                  type="text"
                  value={searchUf}
                  onChange={(e) => setSearchUf(e.target.value.toUpperCase())}
                  className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs w-20"
                  placeholder="UF"
                />
                <button
                  onClick={handleCheckCrmExposure}
                  disabled={loadingCrmReport}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all"
                >
                  {loadingCrmReport ? 'Consultando...' : 'Consultar CRM'}
                </button>
              </div>

              {crmReport && (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
                  <p className="text-white font-bold">Relatório do CRM {searchCrm}/{searchUf}:</p>
                  <p className="text-slate-300">Status no CFM: {crmReport.status}</p>
                  <p className="text-slate-400">Ocorrências Registradas: {crmReport.incidentsCount || 0}</p>
                </div>
              )}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
