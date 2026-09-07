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
  FileSpreadsheet,
  MapPin,
  Sliders,
  Compass,
  Zap,
  CheckCircle,
  ArrowRight,
  Eye,
  Settings,
  Scale
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

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<'validation' | 'audit' | 'inquiries' | 'doctor' | 'geo' | 'policies' | 'pricing'>('validation');
  
  // Tab 1: Validação Instantânea & Showcase
  const [logs, setLogs] = useState<ValidationLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [lastResult, setLastResult] = useState<any | null>(null);
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // Simulador Interativo ao Vivo (Hero Showcase)
  const [simScenario, setSimScenario] = useState<'icp' | 'paper' | 'geo' | 'future'>('icp');
  const [isScanning, setIsScanning] = useState(false);

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

  // Tab 7: Planos & Faturamento
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

  const triggerLiveSim = (scenario: 'icp' | 'paper' | 'geo' | 'future') => {
    setSimScenario(scenario);
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
    }, 700);
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
      
      {/* Top Navbar Executiva */}
      <header className="border-b border-slate-800/60 bg-slate-900/70 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 via-indigo-600 to-emerald-500 flex items-center justify-center shadow-lg shadow-sky-500/10">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-xl tracking-tight text-white">VURIO</span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Forense v2.4
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">Perícia de Atestados • ICP-Brasil & CFM 27 Estados</p>
            </div>
          </div>

          {/* Navegação por Abas Desktop */}
          <nav className="hidden xl:flex items-center space-x-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800/80">
            <button
              onClick={() => setActiveTab('validation')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'validation'
                  ? 'bg-sky-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Validador</span>
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
              <span>Passivo & ROI</span>
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

            <button
              onClick={() => setActiveTab('geo')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'geo'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'text-amber-300 hover:text-white hover:bg-slate-900'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Geo-Shield (Add-on)</span>
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
              <span>Políticas RH</span>
            </button>

            <button
              onClick={() => setActiveTab('pricing')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'pricing'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-emerald-300 hover:text-white hover:bg-slate-900'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Planos & Avulso (R$ 10)</span>
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

        {/* Barra de Abas Mobile */}
        <div className="xl:hidden flex overflow-x-auto px-4 py-2 border-t border-slate-800/80 space-x-2 scrollbar-none bg-slate-950/60">
          <button onClick={() => setActiveTab('validation')} className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap ${activeTab === 'validation' ? 'bg-sky-600 text-white' : 'text-slate-400 bg-slate-900'}`}>Validador</button>
          <button onClick={() => setActiveTab('audit')} className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap ${activeTab === 'audit' ? 'bg-sky-600 text-white' : 'text-slate-400 bg-slate-900'}`}>Passivo</button>
          <button onClick={() => setActiveTab('inquiries')} className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap ${activeTab === 'inquiries' ? 'bg-sky-600 text-white' : 'text-slate-400 bg-slate-900'}`}>Diligências</button>
          <button onClick={() => setActiveTab('doctor')} className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap ${activeTab === 'doctor' ? 'bg-sky-600 text-white' : 'text-slate-400 bg-slate-900'}`}>Doctor Shield</button>
          <button onClick={() => setActiveTab('geo')} className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap ${activeTab === 'geo' ? 'bg-amber-600 text-white' : 'text-amber-300 bg-slate-900'}`}>Geo-Shield</button>
          <button onClick={() => setActiveTab('policies')} className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap ${activeTab === 'policies' ? 'bg-sky-600 text-white' : 'text-slate-400 bg-slate-900'}`}>Políticas RH</button>
          <button onClick={() => setActiveTab('pricing')} className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap ${activeTab === 'pricing' ? 'bg-emerald-600 text-white' : 'text-emerald-300 bg-slate-900'}`}>Planos & Avulso</button>
        </div>
      </header>

      {/* HERO SECTION DE ALTO IMPACTO (CALM EXECUTIVE UX) */}
      <section className="relative overflow-hidden border-b border-slate-800/60 pt-10 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-8">
          
          {/* Coluna Esquerda: Headline e Proposta de Valor */}
          <div className="space-y-4 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Homologado ICP-Brasil • Consulta CFM Nacional • Proteção Trabalhista</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
              Segurança Jurídica e Perícia em <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-indigo-300 to-emerald-400">Atestados Médicos</span>
            </h1>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
              Elimine o estresse e a incerteza no Departamento Pessoal. O Vurio audita a assinatura criptográfica, valida o CRM do médico em todos os 27 estados do CFM, analisa inconsistências de datas e distâncias — entregando laudos sóbrios para respaldar decisões de RH sem conflitos.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <a
                href="#scanner-interativo"
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-sky-500/20 transition-all flex items-center gap-2"
              >
                <span>Experimentar Scanner ao Vivo</span>
                <ArrowRight className="w-4 h-4" />
              </a>

              <button
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/api/webhook/whatsapp`);
                  setCopiedWebhook(true);
                  setTimeout(() => setCopiedWebhook(false), 2500);
                }}
                className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs sm:text-sm font-semibold border border-slate-700/80 transition-all flex items-center gap-2"
              >
                {copiedWebhook ? <Check className="w-4 h-4 text-emerald-400" /> : <MessageSquare className="w-4 h-4 text-sky-400" />}
                <span>{copiedWebhook ? 'Webhook Copiado!' : 'Conectar via WhatsApp'}</span>
              </button>
            </div>
          </div>

          {/* Coluna Direita: Live Interactive Scanner Widget (O "UAU" Prazeroso) */}
          <div id="scanner-interativo" className="w-full lg:max-w-md glass-panel rounded-2xl p-5 border border-slate-700/60 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-3">
              <div className="flex items-center space-x-2">
                <Zap className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">Scanner Forense Interativo</span>
              </div>
              <span className="text-[10px] text-slate-400">Clique para testar:</span>
            </div>

            {/* 4 Botões de Demonstração Imediata */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <button
                onClick={() => triggerLiveSim('icp')}
                className={`px-2.5 py-2 rounded-lg text-[11px] font-bold text-left transition-all border ${
                  simScenario === 'icp'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm'
                    : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:bg-slate-800'
                }`}
              >
                🟢 1. ICP-Brasil Válido
              </button>

              <button
                onClick={() => triggerLiveSim('paper')}
                className={`px-2.5 py-2 rounded-lg text-[11px] font-bold text-left transition-all border ${
                  simScenario === 'paper'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm'
                    : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:bg-slate-800'
                }`}
              >
                🟡 2. Papel Manuscrito
              </button>

              <button
                onClick={() => triggerLiveSim('geo')}
                className={`px-2.5 py-2 rounded-lg text-[11px] font-bold text-left transition-all border ${
                  simScenario === 'geo'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm'
                    : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:bg-slate-800'
                }`}
              >
                📍 3. Santos x Ribeirão
              </button>

              <button
                onClick={() => triggerLiveSim('future')}
                className={`px-2.5 py-2 rounded-lg text-[11px] font-bold text-left transition-all border ${
                  simScenario === 'future'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm'
                    : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:bg-slate-800'
                }`}
              >
                📅 4. Data Posterior
              </button>
            </div>

            {/* Simulação Visual do Atestado com Feixe de Laser */}
            <div className="relative bg-slate-950/90 rounded-xl p-4 border border-slate-800/80 min-h-[220px] overflow-hidden">
              
              {/* Linha do Laser em Movimento */}
              {isScanning && (
                <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-sky-400 to-transparent shadow-[0_0_15px_#38bdf8] animate-laser z-20 pointer-events-none"></div>
              )}

              {simScenario === 'icp' && (
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">Hospital São Lucas</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-extrabold">ICP-Brasil ÍNTEGRO</span>
                  </div>
                  <p className="text-slate-400 text-[11px]">Dr. Carlos Eduardo Silva • CRM 789101/SP</p>
                  <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 text-[11px] space-y-1">
                    <p className="text-emerald-400 font-semibold">🩺 CREMESP: Registro Ativo & Regular</p>
                    <p className="text-slate-300">Afastamento: 05 dias • CID-10 J06.9</p>
                    <p className="text-slate-400">Assinatura: ICP-Brasil PAdES X.509</p>
                  </div>
                  <p className="text-[10px] text-slate-400">✓ Orientação DP: Documento apto para abono regular na folha.</p>
                </div>
              )}

              {simScenario === 'paper' && (
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">Clínica Médica São José</span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-extrabold">FOTO DE PAPEL</span>
                  </div>
                  <p className="text-slate-400 text-[11px]">Dr. Roberto Santos • CRM 54321/SP</p>
                  <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 text-[11px] space-y-1">
                    <p className="text-emerald-400 font-semibold">🩺 CREMESP: Titular Regular no CFM</p>
                    <p className="text-slate-300">Carimbo Físico e Assinatura Manuscrita Detectados</p>
                    <p className="text-amber-300/90 font-medium">ℹ️ Sem assinatura digital criptográfica nativa</p>
                  </div>
                  <p className="text-[10px] text-slate-400">✓ Orientação DP: Conferir carimbo físico ou solicitar PDF original da clínica.</p>
                </div>
              )}

              {simScenario === 'geo' && (
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">Clínica Central de Ribeirão</span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-extrabold">GEO-SHIELD ALERTA</span>
                  </div>
                  <p className="text-slate-400 text-[11px]">Atendimento Presencial a ~431 km</p>
                  <div className="p-2.5 rounded-lg bg-amber-950/30 border border-amber-700/40 text-[11px] space-y-1">
                    <p className="text-amber-200 font-semibold">📍 Deslocamento Incompatível Detectado</p>
                    <p className="text-slate-300">Colaborador sediado em Santos • Consulta em Ribeirão Preto</p>
                    <p className="text-slate-400">Sem registro de telemedicina no cabeçalho</p>
                  </div>
                  <p className="text-[10px] text-slate-400">✓ Orientação DP: Confirmar se estava em viagem ou se o atendimento foi remoto.</p>
                </div>
              )}

              {simScenario === 'future' && (
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">Conferência Cronológica</span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 text-[10px] font-bold border border-amber-500/30">PARA AVERIGUAÇÃO</span>
                  </div>
                  <p className="text-slate-400 text-[11px]">Emissão no Documento: 12/09 • Data da Análise: 07/09</p>
                  <div className="p-2.5 rounded-lg bg-amber-950/20 border border-amber-800/30 text-[11px] space-y-1">
                    <p className="text-amber-300 font-semibold flex items-center gap-1.5">📌 Apontamento Cronológico</p>
                    <p className="text-slate-300">Data de emissão registrada é posterior ao dia da análise</p>
                    <p className="text-slate-400">Parâmetro técnico: Resolução CFM 2.217/2018</p>
                  </div>
                  <p className="text-[10px] text-slate-400">✓ Sugestão DP: Confirmar junto ao emissor se houve equívoco material de digitação.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* CONTEÚDO PRINCIPAL POR ABA */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* ========================================================================= */}
        {/* ABA 1: VALIDAÇÃO INSTANTÂNEA                                              */}
        {/* ========================================================================= */}
        {activeTab === 'validation' && (
          <div className="space-y-8 animate-fadeIn">
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
                      ? 'border-sky-500 bg-sky-500/10'
                      : 'border-slate-800 bg-slate-900/40 hover:border-slate-700'
                  }`}
                >
                  <div className="w-12 h-12 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center mx-auto mb-3">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-semibold text-white">Upload de Perícia Unitária</h3>
                  <p className="text-xs text-slate-400 mt-1 mb-4">
                    Arraste o PDF original ou a foto do atestado
                  </p>

                  <label className="inline-block px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-xl cursor-pointer shadow transition-all">
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
                    <div className="mt-4 flex items-center justify-center space-x-2 text-xs text-sky-400">
                      <Clock className="w-4 h-4 animate-spin" />
                      <span>Analisando assinatura digital e registros no CFM...</span>
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
                    Nenhum diagnóstico, CID ou dado clínico sigiloso é exposto. O Vurio atua com total sobriedade, auditando parâmetros legais e de autenticidade para a folha de pagamento.
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
                          Laudo Pericial de Autenticidade
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
                          <span className="inline-flex items-center px-3 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 text-xs font-bold">
                            <AlertTriangle className="w-4 h-4 mr-1.5" /> INCONSISTÊNCIA REGISTRADA
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
                        <p className="font-bold text-sky-400 mt-1">
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
                        <span className="text-slate-500">Auditoria CFM:</span>
                        <p className="font-bold text-emerald-400 mt-1">
                          {lastResult.report?.cfmAudit?.status || 'Consultado'}
                        </p>
                      </div>
                    </div>

                    {/* Mensagem Gerada para WhatsApp */}
                    <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                      <span className="text-xs font-semibold text-slate-300">Resposta Automática Enviada no WhatsApp:</span>
                      <pre className="text-xs text-slate-300 font-mono whitespace-pre-wrap bg-slate-900 p-3 rounded-lg border border-slate-800">
                        {lastResult.whatsappMessage}
                      </pre>
                    </div>
                  </div>
                ) : (
                  <div className="h-full bg-slate-900/30 border border-slate-800/60 rounded-2xl flex flex-col items-center justify-center p-8 text-center text-slate-500">
                    <FileText className="w-12 h-12 mb-3 text-slate-700" />
                    <p className="text-sm font-semibold text-slate-400">Nenhum documento sob análise no momento</p>
                    <p className="text-xs text-slate-500 max-w-sm mt-1">
                      Envie um arquivo pelo box ao lado ou envie qualquer atestado diretamente no WhatsApp para acompanhar o laudo aqui em tempo real.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Tabela de Logs Recentes */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-base font-bold text-white">Histórico de Atestados Submetidos</h3>
                  <p className="text-xs text-slate-400">Trilha de auditoria em conformidade com a LGPD e fiscalização trabalhista.</p>
                </div>
                <button
                  onClick={fetchLogs}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium border border-slate-700 transition-colors"
                >
                  Atualizar
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider border-b border-slate-800 font-semibold">
                    <tr>
                      <th className="py-3 px-4">Arquivo</th>
                      <th className="py-3 px-4">Médico</th>
                      <th className="py-3 px-4">CRM / UF</th>
                      <th className="py-3 px-4">Afastamento</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Data</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {logs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-6 text-slate-500">
                          Nenhum atestado processado ainda. Envie o primeiro arquivo para testar.
                        </td>
                      </tr>
                    ) : (
                      logs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-900/40 transition-colors">
                          <td className="py-3 px-4 font-medium text-white">{log.file_name}</td>
                          <td className="py-3 px-4">{log.doctor_name || 'Não identificado'}</td>
                          <td className="py-3 px-4">{log.crm ? `${log.crm}/${log.uf || 'SP'}` : '-'}</td>
                          <td className="py-3 px-4 text-sky-400 font-semibold">{log.rest_days ? `${log.rest_days} dias` : '-'}</td>
                          <td className="py-3 px-4">
                            {log.is_authentic ? (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                                Válido
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[10px] font-bold">
                                Inconsistência
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-slate-500">{new Date(log.created_at).toLocaleDateString('pt-BR')}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* ABA 5: GEO-SHIELD (PRODUTO ADICIONAL / ADD-ON)                            */}
        {/* ========================================================================= */}
        {activeTab === 'geo' && (
          <div className="space-y-8 animate-fadeIn">
            <div className="p-6 rounded-2xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border border-amber-800/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-extrabold uppercase">
                  <MapPin className="w-3 h-3 text-amber-400" />
                  <span>Produto Adicional • Módulo Geo-Shield</span>
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-white">
                  Auditoria de Deslocamento & Endereço do CFM
                </h2>
                <p className="text-xs text-slate-300 max-w-2xl">
                  Proteja sua empresa contra o comércio clandestino de atestados na internet. O Geo-Shield cruza o local de trabalho/moradia do colaborador com o endereço físico da clínica emissora.
                </p>
              </div>

              <div className="px-4 py-2 rounded-xl bg-slate-950/80 border border-amber-500/30 text-right">
                <span className="text-[10px] text-slate-400">Valor do Add-on:</span>
                <p className="text-base font-extrabold text-amber-400">R$ 49/mês <span className="text-xs font-normal text-slate-400">ou R$ 3/avulso</span></p>
              </div>
            </div>

            {/* Testador Interativo de Distância */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Compass className="w-4 h-4 text-amber-400" />
                  Simulador de Compatibilidade Geográfica
                </h3>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-slate-400 mb-1">Cidade Sede / Posto de Trabalho do Colaborador:</label>
                    <input
                      type="text"
                      value={geoWorkCity}
                      onChange={(e) => {
                        setGeoWorkCity(e.target.value);
                        setGeoResult(auditGeoDistance({ clinicAddressOrCity: geoClinicCity, employeeWorkCity: e.target.value }));
                      }}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                      placeholder="Ex: Santos/SP"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Endereço ou Município da Clínica / Hospital do Atestado:</label>
                    <input
                      type="text"
                      value={geoClinicCity}
                      onChange={(e) => {
                        setGeoClinicCity(e.target.value);
                        setGeoResult(auditGeoDistance({ clinicAddressOrCity: e.target.value, employeeWorkCity: geoWorkCity }));
                      }}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                      placeholder="Ex: Ribeirão Preto/SP"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={() => setGeoResult(auditGeoDistance({ clinicAddressOrCity: geoClinicCity, employeeWorkCity: geoWorkCity }))}
                      className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition-all shadow"
                    >
                      Calcular Coerência de Deslocamento
                    </button>
                  </div>
                </div>
              </div>

              {/* Resultado do Geo-Shield */}
              <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-2xl flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Parecer Pericial de Localização
                  </span>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-400">Distância Rodoviária Estimada:</p>
                      <p className="text-2xl font-black text-white">~{geoResult.distanceKm} km</p>
                    </div>

                    <div>
                      {geoResult.isCompatible ? (
                        <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-bold">
                          ✓ DESLOCAMENTO COERENTE
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 text-xs font-bold">
                          ⚠️ DESLOCAMENTO INCOMPATÍVEL
                        </span>
                      )}
                    </div>
                  </div>

                  {geoResult.alert ? (
                    <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-800/40 text-xs space-y-1.5 text-amber-200">
                      <p className="font-bold">{geoResult.alert.title}</p>
                      <p className="text-slate-300 leading-relaxed">{geoResult.alert.description}</p>
                      <p className="text-slate-400 italic">Orientação: {geoResult.alert.recommendation}</p>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-800/40 text-xs text-emerald-300">
                      O atendimento ocorreu dentro do raio aceitável em relação à base de trabalho do colaborador.
                    </div>
                  )}
                </div>

                <div className="text-[11px] text-slate-400 border-t border-slate-800 pt-3">
                  ⚖️ <strong>Fundamentação TST:</strong> O Art. 482 da CLT ampara a apuração prévia de atestados emitidos em localidades incongruentes com o expediente presencial do empregado.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* ABA 6: POLÍTICAS DA EMPRESA & CCT                                         */}
        {/* ========================================================================= */}
        {activeTab === 'policies' && (
          <div className="space-y-8 animate-fadeIn">
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1">
                <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-sky-400" />
                  Políticas Internas de RH & Convenção Coletiva (CCT)
                </h2>
                <p className="text-xs text-slate-400">
                  Configure os limites de tolerância para que o motor pericial do Vurio audite os atestados estritamente de acordo com as regras da sua empresa.
                </p>
              </div>

              {policySaved && (
                <div className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5 animate-fadeIn">
                  <CheckCircle className="w-4 h-4" />
                  <span>Configurações Salvas!</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-4">
                <h3 className="text-sm font-bold text-white">1. Prazo de Apresentação Retroativa</h3>
                <p className="text-xs text-slate-400">
                  Tempo máximo tolerado entre a data de emissão do atestado e o envio pelo colaborador (estipulado na CCT ou regulamento):
                </p>

                <div className="space-y-2 text-xs">
                  <select
                    value={policyConfig.maxRetroactiveHours}
                    onChange={(e) => setPolicyConfig({ ...policyConfig, maxRetroactiveHours: parseInt(e.target.value, 10) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white"
                  >
                    <option value={24}>24 horas (1 dia útil)</option>
                    <option value={48}>48 horas (2 dias - Padrão CCT)</option>
                    <option value={72}>72 horas (3 dias)</option>
                    <option value={120}>120 horas (5 dias)</option>
                  </select>
                </div>

                <div className="pt-4 border-t border-slate-800">
                  <h3 className="text-sm font-bold text-white">2. Sede e Município de Operação</h3>
                  <p className="text-xs text-slate-400 mb-2">
                    Cidade principal de lotação para cruzamento com o Add-on Geo-Shield:
                  </p>
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

              <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-4 text-xs">
                <h3 className="text-sm font-bold text-white">Como a auditoria se comporta com essas regras:</h3>
                <ul className="space-y-3 text-slate-300">
                  <li className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                    <strong>📅 Regra de Tolerância ({policyConfig.maxRetroactiveHours}h):</strong> Atestados enviados após {policyConfig.maxRetroactiveHours} horas da emissão receberão uma nota técnica suave orientando o DP a verificar se houve justificativa de internação.
                  </li>
                  <li className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                    <strong>📍 Base Geográfica ({policyConfig.workCity}):</strong> Consultas presenciais fora do raio de {policyConfig.maxAllowedDistanceKm} km serão identificadas para que o DP cheque se o colaborador estava de folga ou em deslocamento.
                  </li>
                  <li className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                    <strong>⚖️ Princípio da Boa-Fé:</strong> Todas as mensagens evitam termos acusatórios, resguardando o clima organizacional e a segurança jurídica da empresa.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* ABA 7: PLANOS & CONSULTA AVULSA (R$ 10,00)                                */}
        {/* ========================================================================= */}
        {activeTab === 'pricing' && (
          <div className="space-y-8 animate-fadeIn">
            
            {/* Header da Página de Preços */}
            <div className="text-center max-w-3xl mx-auto space-y-3">
              <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold">
                <CreditCard className="w-3.5 h-3.5" />
                <span>Planos Flexíveis e Pagamento sob Demanda</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                Transparência e ROI Imediato para Cada Tipo de Empresa
              </h2>
              <p className="text-xs sm:text-sm text-slate-400">
                Desde o microempreendedor e MEI até grandes indústrias com milhares de colaboradores. Sem contratos engessados.
              </p>
            </div>

            {/* Grid dos Planos Principais */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-stretch">
              
              {/* CARTÃO 1: NOVO - CONSULTA AVULSA (MEI / DOMÉSTICA / MICROEMPRESA) */}
              <div className="p-6 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-700/80 flex flex-col justify-between relative hover:border-slate-600 transition-all">
                <span className="absolute -top-3 left-4 px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-200 text-[10px] font-bold uppercase border border-slate-700">
                  Sem Mensalidade
                </span>

                <div className="space-y-3 pt-2">
                  <h3 className="text-lg font-bold text-white">Consulta Avulsa</h3>
                  <p className="text-xs text-slate-400">
                    Ideal para MEIs, donas de casa e microempresas com 1 ou 2 funcionários.
                  </p>
                  <div>
                    <span className="text-3xl font-extrabold text-white">R$ 10,00</span>
                    <span className="text-xs text-slate-500 font-normal"> / consulta</span>
                  </div>
                  <ul className="space-y-2 text-xs text-slate-300 pt-3">
                    <li className="flex items-center"><Check className="w-3.5 h-3.5 text-emerald-400 mr-2" /> Validação ICP-Brasil na hora</li>
                    <li className="flex items-center"><Check className="w-3.5 h-3.5 text-emerald-400 mr-2" /> Consulta no CFM do estado</li>
                    <li className="flex items-center"><Check className="w-3.5 h-3.5 text-emerald-400 mr-2" /> Checagem de datas futuras</li>
                    <li className="flex items-center"><Check className="w-3.5 h-3.5 text-emerald-400 mr-2" /> Laudo enviado no seu WhatsApp</li>
                    <li className="flex items-center text-amber-300/90 font-medium"><MapPin className="w-3.5 h-3.5 text-amber-400 mr-2" /> Opcional: + R$ 3 com Geo-Shield</li>
                  </ul>
                </div>

                <div className="pt-6">
                  <button
                    onClick={() => alert('Consulta Avulsa via PIX instantâneo (R$ 10,00)...')}
                    className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all"
                  >
                    Consultar por R$ 10
                  </button>
                </div>
              </div>

              {/* CARTÃO 2: STARTER RH */}
              <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition-all">
                <div className="space-y-3">
                  <h3 className="text-lg font-bold text-white">Starter RH</h3>
                  <p className="text-xs text-slate-400">
                    Para pequenas empresas com até 30 colaboradores.
                  </p>
                  <div>
                    <span className="text-3xl font-extrabold text-white">R$ 149</span>
                    <span className="text-xs text-slate-500 font-normal"> / mês</span>
                  </div>
                  <ul className="space-y-2 text-xs text-slate-300 pt-3">
                    <li className="flex items-center"><Check className="w-3.5 h-3.5 text-emerald-400 mr-2" /> Até 30 validações mensais</li>
                    <li className="flex items-center"><Check className="w-3.5 h-3.5 text-emerald-400 mr-2" /> WhatsApp corporativo integrado</li>
                    <li className="flex items-center"><Check className="w-3.5 h-3.5 text-emerald-400 mr-2" /> Auditoria de CRM 27 Estados</li>
                    <li className="flex items-center"><Check className="w-3.5 h-3.5 text-emerald-400 mr-2" /> Suporte técnico dedicado</li>
                  </ul>
                </div>

                <div className="pt-6">
                  <button
                    onClick={() => alert('Assinatura Starter RH iniciada...')}
                    className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition-all shadow"
                  >
                    Assinar Starter
                  </button>
                </div>
              </div>

              {/* CARTÃO 3: COMPLIANCE PRO (DESTAQUE) */}
              <div className="p-6 rounded-2xl bg-gradient-to-b from-sky-950/40 via-slate-900 to-slate-950 border-2 border-sky-500/60 flex flex-col justify-between relative shadow-xl shadow-sky-500/10">
                <span className="absolute -top-3 left-4 px-2.5 py-0.5 rounded-full bg-sky-500 text-slate-950 text-[10px] font-black uppercase">
                  Mais Escolhido
                </span>

                <div className="space-y-3 pt-2">
                  <h3 className="text-lg font-bold text-white">Compliance Pro</h3>
                  <p className="text-xs text-slate-300">
                    Empresas médias de 50 a 300 funcionários com alta rotatividade.
                  </p>
                  <div>
                    <span className="text-3xl font-extrabold text-sky-400">R$ 399</span>
                    <span className="text-xs text-slate-500 font-normal"> / mês</span>
                  </div>
                  <ul className="space-y-2 text-xs text-slate-200 pt-3">
                    <li className="flex items-center"><Check className="w-3.5 h-3.5 text-emerald-400 mr-2" /> <strong>100 validações mensais</strong></li>
                    <li className="flex items-center"><Check className="w-3.5 h-3.5 text-emerald-400 mr-2" /> <strong>Diligências 1-Clique Ilimitadas</strong></li>
                    <li className="flex items-center"><Check className="w-3.5 h-3.5 text-emerald-400 mr-2" /> Rollover de sobras por 60 dias</li>
                    <li className="flex items-center"><Check className="w-3.5 h-3.5 text-emerald-400 mr-2" /> Relatório de auditoria de passivo</li>
                  </ul>
                </div>

                <div className="pt-6">
                  <button
                    onClick={() => alert('Assinatura Compliance Pro iniciada...')}
                    className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-sky-600/30"
                  >
                    Assinar Pro
                  </button>
                </div>
              </div>

              {/* CARTÃO 4: ENTERPRISE CUSTOM */}
              <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition-all">
                <div className="space-y-3">
                  <h3 className="text-lg font-bold text-white">Enterprise</h3>
                  <p className="text-xs text-slate-400">
                    Grandes corporações, redes varejistas e indústrias.
                  </p>
                  <div>
                    <span className="text-3xl font-extrabold text-white">Sob Medida</span>
                  </div>
                  <ul className="space-y-2 text-xs text-slate-300 pt-3">
                    <li className="flex items-center"><Check className="w-3.5 h-3.5 text-emerald-400 mr-2" /> 1.000+ validações mensais</li>
                    <li className="flex items-center"><Check className="w-3.5 h-3.5 text-emerald-400 mr-2" /> Múltiplas instâncias de WhatsApp</li>
                    <li className="flex items-center"><Check className="w-3.5 h-3.5 text-emerald-400 mr-2" /> API REST integrada ao ERP/Folha</li>
                    <li className="flex items-center"><Check className="w-3.5 h-3.5 text-emerald-400 mr-2" /> Gestor de conta exclusivo</li>
                  </ul>
                </div>

                <div className="pt-6">
                  <button
                    onClick={() => alert('Falar com Consultor Enterprise...')}
                    className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all"
                  >
                    Falar com Consultor
                  </button>
                </div>
              </div>
            </div>

            {/* SEÇÃO DE PRODUTOS ADICIONAIS (ADD-ONS DE ALTO VALOR) */}
            <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 border border-amber-500/20 space-y-4 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-3 gap-2">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <h3 className="text-base font-bold text-white">Produtos Adicionais (Add-ons Independentes)</h3>
                </div>
                <span className="text-xs text-amber-300/80 font-medium">Contrate avulso ou agregue a qualquer plano</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                {/* Add-on 1: Geo-Shield */}
                <div className="p-4 bg-slate-950/80 rounded-xl border border-amber-500/30 space-y-2 relative">
                  <span className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[9px] font-bold border border-amber-500/30 uppercase">
                    Add-on Opcional
                  </span>
                  <div className="flex items-center justify-between pt-1">
                    <span className="font-bold text-amber-300 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> Geo-Shield</span>
                    <div className="text-right">
                      <span className="font-extrabold text-white text-sm">R$ 49/mês</span>
                      <span className="block text-[10px] text-slate-400">ou +R$ 3 na consulta avulsa</span>
                    </div>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    Auditoria de rota e distância geográfica entre o posto de trabalho/moradia e a clínica do atestado. Identifica incompatibilidades de deslocamento (ex: Santos x Ribeirão Preto) amparado no Art. 482 da CLT.
                  </p>
                </div>

                {/* Add-on 2: Doctor Shield & Dossiê B.O. */}
                <div className="p-4 bg-slate-950/80 rounded-xl border border-emerald-500/30 space-y-2 relative">
                  <span className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[9px] font-bold border border-emerald-500/30 uppercase">
                    Add-on Pericial
                  </span>
                  <div className="flex items-center justify-between pt-1">
                    <span className="font-bold text-emerald-300 flex items-center gap-1.5"><Stethoscope className="w-3.5 h-3.5" /> Dossiê Jurídico & B.O.</span>
                    <div className="text-right">
                      <span className="font-extrabold text-white text-sm">R$ 49 / caso</span>
                      <span className="block text-[10px] text-slate-400">R$ 89 se avulso</span>
                    </div>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    Certidão pericial completa com hash SHA-256 inalterável, carimbo de tempo ICP-Brasil e histórico de incidentes do CRM, formatada para abertura direta de Notícia-Crime na Polícia Civil e justa causa trabalhista.
                  </p>
                </div>

                {/* Add-on 3: Diligência Formal CFM */}
                <div className="p-4 bg-slate-950/80 rounded-xl border border-sky-500/30 space-y-2 relative">
                  <span className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 text-[9px] font-bold border border-sky-500/30 uppercase">
                    Add-on 1-Clique
                  </span>
                  <div className="flex items-center justify-between pt-1">
                    <span className="font-bold text-sky-300 flex items-center gap-1.5"><Scale className="w-3.5 h-3.5" /> Diligência Formal CFM</span>
                    <div className="text-right">
                      <span className="font-extrabold text-white text-sm">R$ 15 / ofício</span>
                      <span className="block text-[10px] text-emerald-400">Ilimitado no Pro</span>
                    </div>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    Emissão e envio automático de ofício administrativo respaldado na Resolução CFM 1.658/2002 para confirmação de atendimento diretamente com a secretaria do consultório ou hospital.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Demais Abas: Passivo, Diligências, Doctor Shield (Mantidas e Alinhadas) */}
        {activeTab === 'audit' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-rose-400" />
                Auditoria de Passivo Trabalhista em Arquivo Morto
              </h2>
              <p className="text-xs text-slate-400">
                Calcule quanto sua empresa já pagou indevidamente por afastamentos de atestados falsos ou sem comprovação legal.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Salário Médio da Empresa (R$):</label>
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
                    <option value="SIMPLES">Simples Nacional (15% encargos)</option>
                    <option value="LUCRO_PRESUMIDO">Lucro Presumido (35% encargos)</option>
                    <option value="LUCRO_REAL">Lucro Real (45% encargos)</option>
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
                onClick={() => handleBatchAudit()}
                disabled={auditLoading}
                className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all shadow"
              >
                {auditLoading ? 'Processando Lote...' : 'Simular Auditoria de 50 Atestados'}
              </button>

              {auditSummary && (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                  <p className="text-white font-bold">Resultado da Auditoria em Lote:</p>
                  <p className="text-slate-300">Total de Atestados Auditados: {auditSummary.totalAudited}</p>
                  <p className="text-rose-400 font-bold">Passivo Indevido Identificado: R$ {auditSummary.estimatedFinancialLoss?.toFixed(2)}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'inquiries' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Send className="w-5 h-5 text-sky-400" />
                Esteira de Diligências Médicas 1-Clique
              </h2>
              <p className="text-xs text-slate-400">
                Ofícios automáticos de conferência de autenticidade emitidos em estrita conformidade com a Resolução CFM 1.658/2002.
              </p>

              <div className="overflow-x-auto pt-2">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider border-b border-slate-800 font-semibold">
                    <tr>
                      <th className="py-3 px-4">Médico</th>
                      <th className="py-3 px-4">CRM / UF</th>
                      <th className="py-3 px-4">Colaborador</th>
                      <th className="py-3 px-4">Clínica</th>
                      <th className="py-3 px-4">Status da Diligência</th>
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
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                              Autenticidade Confirmada
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-bold">
                              Repudiado pelo Médico
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

        {activeTab === 'doctor' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-emerald-400" />
                Vurio Doctor Shield: Proteção ao Médico
              </h2>
              <p className="text-xs text-slate-400">
                Consulte se seu CRM foi indevidamente utilizado por falsários em atestados apresentados a empresas clientes do Vurio.
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
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-2">
                  <p className="text-white font-bold">Relatório do CRM {searchCrm}/{searchUf}:</p>
                  <p className="text-slate-300">Status no CFM: {crmReport.status}</p>
                  <p className="text-slate-400">Exposições Registradas: {crmReport.incidentsCount || 0}</p>
                </div>
              )}
            </div>
          </div>
        )}

      </main>

      {/* Footer Executivo & LGPD */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-8 px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-500 space-y-2">
        <p className="font-medium text-slate-400">
          Vurio Compliance & Perícia Digital LTDA • CNPJ 00.000.000/0001-00
        </p>
        <p>
          Respaldo legal: Medida Provisória nº 2.200-2/2001 (ICP-Brasil), Lei 14.510/2023, Resoluções CFM 1.658/2002 e 2.299/2021, Art. 482 da CLT e LGPD (Lei 13.709/2018).
        </p>
      </footer>
    </div>
  );
}
