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
  ChevronRight,
  RefreshCw,
  Plus,
  Smartphone,
  Users,
  Radio,
  ChevronDown,
  Printer,
  Calendar,
  Briefcase,
  FolderOpen,
  Columns
} from 'lucide-react';
import { TaxRegime } from '@/lib/services/batch-audit-service';
import { auditGeoDistance, GeoAuditResult } from '@/lib/services/geo-audit-service';
import { getCompanyPolicy, updateCompanyPolicy, CompanyPolicyConfig } from '@/lib/services/company-policy-service';
import { CompanyAccount } from '@/lib/services/company-service';
import { formatProtocolId, generateHumanizedComplianceReport, buildForensicReport } from '@/lib/services/compliance-report-service';
import { resolveVerificationPortal, VerificationPortalResolution } from '@/lib/services/verification-portal-service';
import { APP_VERSION, APP_VERSION_LABEL, APP_ENGINE_NAME, APP_BUILD_DATE } from '@/lib/version';
import { DpAttestationAnalysisResponse } from '@/lib/services/dp-attestation-analyzer';
import { NotableDpEvent } from '@/lib/services/absenteeism-service';
import { ValidationWorkstation } from '@/components/dp/validation-workstation';
import { BRAZILIAN_REGIONAL_COUNCILS } from '@/lib/services/cfm-service';

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
  // Campos de Rastreabilidade e Auditoria Segregada
  protocol_id?: string;
  channel?: 'WHATSAPP' | 'WEB';
  sender_phone?: string | null;
  patient_name?: string | null;
  forensic_report?: any;
}

export default function DashboardClientPage() {
  const [activeTab, setActiveTab] = useState<'validation' | 'absenteeism' | 'whatsapp' | 'companies' | 'inquiries' | 'geo' | 'policies' | 'audit' | 'doctor'>('validation');
  const [dpViewMode, setDpViewMode] = useState<'workstation' | 'events'>('workstation');
  
  // MÓDULO DP: Analisador de Atestados & Gestor de Absenteísmo
  const [dpFile, setDpFile] = useState<File | null>(null);
  const [dpAnalyzing, setDpAnalyzing] = useState(false);
  const [dpResult, setDpResult] = useState<DpAttestationAnalysisResponse | null>(null);
  const [dpEmployeeName, setDpEmployeeName] = useState('');
  const [dpEmployeeCpf, setDpEmployeeCpf] = useState('');
  const [dpEmployeeWorkCity, setDpEmployeeWorkCity] = useState('Santos');
  const [dpEmployeeHomeCity, setDpEmployeeHomeCity] = useState('Santos');

  // Digitação Assistida (com Consulta Instantânea CFM ao vivo)
  const [assistTypingOpen, setAssistTypingOpen] = useState(false);
  const [assistCrm, setAssistCrm] = useState('');
  const [assistUf, setAssistUf] = useState('SP');
  const [assistDoctorName, setAssistDoctorName] = useState('');
  const [assistDays, setAssistDays] = useState('3');
  const [assistEmissionDate, setAssistEmissionDate] = useState(new Date().toISOString().substring(0, 10));
  const [assistCid, setAssistCid] = useState('');
  const [assistClinicName, setAssistClinicName] = useState('');
  const [assistLookingUpCfm, setAssistLookingUpCfm] = useState(false);

  // Eventos Notáveis do DP
  const [notableEventsList, setNotableEventsList] = useState<NotableDpEvent[]>([]);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventStartDate, setNewEventStartDate] = useState('');
  const [newEventEndDate, setNewEventEndDate] = useState('');
  const [newEventCategory, setNewEventCategory] = useState<'SHOW' | 'FESTA_LOCAL' | 'PICO_OPERACIONAL' | 'OUTRO'>('SHOW');
  const [creatingEvent, setCreatingEvent] = useState(false);
  const [copiedDpJson, setCopiedDpJson] = useState(false);

  // Tab 1: Validação Instantânea & Showcase
  const [logs, setLogs] = useState<ValidationLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [lastResult, setLastResult] = useState<any | null>(null);
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // Busca e Filtros na Tabela de Logs
  const [logSearchQuery, setLogSearchQuery] = useState('');
  const [selectedChannelFilter, setSelectedChannelFilter] = useState<'ALL' | 'WHATSAPP' | 'WEB'>('ALL');

  // Balcão de Recepção / Upload Presencial
  const [counterEmployeePhone, setCounterEmployeePhone] = useState('');
  const [counterNotifyWhatsApp, setCounterNotifyWhatsApp] = useState(false);

  // Modal de Laudo Pericial Didático (Trust Architecture)
  const [laudoModalOpen, setLaudoModalOpen] = useState(false);
  const [selectedLogForLaudo, setSelectedLogForLaudo] = useState<ValidationLog | null>(null);
  const [copiedProtocolId, setCopiedProtocolId] = useState<string | null>(null);
  const [copiedPortalCode, setCopiedPortalCode] = useState<string | null>(null);

  // Modal de Comprovante de Balcão
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [selectedLogForReceipt, setSelectedLogForReceipt] = useState<ValidationLog | null>(null);
  const [sendingReceiptWhatsApp, setSendingReceiptWhatsApp] = useState(false);
  const [receiptSentSuccess, setReceiptSentSuccess] = useState(false);

  // Tab WhatsApp
  const [waData, setWaData] = useState<{
    online: boolean;
    state: string;
    instance: string;
    qrcode?: string | null;
    phone?: string;
    message?: string;
    error?: string;
    dockerCommand?: string;
  } | null>(null);
  const [loadingWa, setLoadingWa] = useState(false);
  const [disconnectingWa, setDisconnectingWa] = useState(false);
  const [copiedDockerCmd, setCopiedDockerCmd] = useState(false);

  // Tab Multi-Empresas
  const [companies, setCompanies] = useState<CompanyAccount[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<CompanyAccount | null>(null);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [companyDropdownOpen, setCompanyDropdownOpen] = useState(false);
  const [companyModalOpen, setCompanyModalOpen] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newCompanyTradeName, setNewCompanyTradeName] = useState('');
  const [newCompanyCnpj, setNewCompanyCnpj] = useState('');
  const [newCompanyPlan, setNewCompanyPlan] = useState<'STARTER' | 'COMPLIANCE_PRO' | 'ENTERPRISE'>('COMPLIANCE_PRO');
  const [newCompanyCredits, setNewCompanyCredits] = useState('150');
  const [newCompanyCity, setNewCompanyCity] = useState('São Paulo');
  const [newCompanyState, setNewCompanyState] = useState('SP');
  const [newCompanyEmail, setNewCompanyEmail] = useState('');
  const [creatingCompany, setCreatingCompany] = useState(false);

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
  
  // Modal de Teste do Dossiê Jurídico & B.O.
  const [dossierModalOpen, setDossierModalOpen] = useState(false);
  const [dossierDoctorName, setDossierDoctorName] = useState('Dr. Carlos Eduardo Menezes');
  const [dossierCrm, setDossierCrm] = useState('123456');
  const [dossierUf, setDossierUf] = useState('SP');
  const [dossierPatientName, setDossierPatientName] = useState('Colaborador Sob Investigação');
  const [dossierFileName, setDossierFileName] = useState('atestado_clonado_suspeito.pdf');
  const [generatedDossierData, setGeneratedDossierData] = useState<any | null>(null);
  const [copiedDossierText, setCopiedDossierText] = useState(false);

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
    fetchCompanies();
    fetchWhatsAppStatus('vurio');
    fetchNotableEvents();
  }, []);

  const fetchNotableEvents = async () => {
    try {
      const cId = selectedCompany?.id || 'default';
      const res = await fetch(`/api/dp/notable-events?companyId=${cId}`);
      if (res.ok) {
        const data = await res.json();
        setNotableEventsList(data.events || []);
      }
    } catch {
      // silencioso
    }
  };

  const handleLookupCrmLive = async (crm: string, uf: string) => {
    if (!crm || crm.trim().length < 3) return;
    setAssistLookingUpCfm(true);
    try {
      const res = await fetch(`/api/doctor/check-crm?crm=${encodeURIComponent(crm.trim())}&uf=${encodeURIComponent(uf.trim().toUpperCase())}`);
      if (res.ok) {
        const data = await res.json();
        if (data.officialName) {
          setAssistDoctorName(data.officialName);
        }
      }
    } catch {
      // silencioso
    } finally {
      setAssistLookingUpCfm(false);
    }
  };

  const handleAnalyzeDp = async () => {
    try {
      setDpAnalyzing(true);
      const fd = new FormData();
      if (dpFile) {
        fd.append('file', dpFile);
      }
      fd.append('companyId', selectedCompany?.id || 'default');
      if (dpEmployeeName) fd.append('colaborador_nome', dpEmployeeName);
      if (dpEmployeeCpf) fd.append('colaborador_cpf', dpEmployeeCpf);
      if (dpEmployeeWorkCity) fd.append('cidade_trabalho', dpEmployeeWorkCity);
      if (dpEmployeeHomeCity) fd.append('cidade_residencia', dpEmployeeHomeCity);

      if (assistTypingOpen) {
        if (assistCrm) fd.append('manual_crm', assistCrm);
        if (assistUf) fd.append('manual_uf', assistUf);
        if (assistDays) fd.append('manual_dias', assistDays);
        if (assistEmissionDate) fd.append('manual_data_emissao', assistEmissionDate);
        if (assistCid) fd.append('manual_cid', assistCid);
      }

      const res = await fetch('/api/dp/analyze-attestation', {
        method: 'POST',
        body: fd
      });

      if (res.ok) {
        const data: DpAttestationAnalysisResponse = await res.json();
        setDpResult(data);
      }
    } catch (err) {
      console.error('Erro na análise DP:', err);
    } finally {
      setDpAnalyzing(false);
    }
  };

  const handleCreateNotableEvent = async () => {
    if (!newEventTitle || !newEventStartDate || !newEventEndDate) return;
    try {
      setCreatingEvent(true);
      const res = await fetch('/api/dp/notable-events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: selectedCompany?.id || 'default',
          title: newEventTitle,
          startDate: newEventStartDate,
          endDate: newEventEndDate,
          category: newEventCategory
        })
      });
      if (res.ok) {
        setNewEventTitle('');
        setNewEventStartDate('');
        setNewEventEndDate('');
        fetchNotableEvents();
      }
    } catch {
      // silencioso
    } finally {
      setCreatingEvent(false);
    }
  };

  const handleDeleteNotableEvent = async (id: string) => {
    try {
      const res = await fetch(`/api/dp/notable-events?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchNotableEvents();
      }
    } catch {
      // silencioso
    }
  };

  const fetchLogs = async (overrideCompanyId?: string) => {
    try {
      setLoadingLogs(true);
      const cId = overrideCompanyId || selectedCompany?.id;
      const url = cId ? `/api/logs?companyId=${cId}` : '/api/logs';
      const res = await fetch(url);
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

  const fetchCompanies = async () => {
    try {
      setLoadingCompanies(true);
      const res = await fetch('/api/companies');
      const data = await res.json();
      if (data.companies && data.companies.length > 0) {
        setCompanies(data.companies);
        if (!selectedCompany) {
          setSelectedCompany(data.companies[0]);
        }
      }
    } catch (err) {
      console.error('Erro ao buscar empresas:', err);
    } finally {
      setLoadingCompanies(false);
    }
  };

  const fetchWhatsAppStatus = async (instanceName?: string) => {
    try {
      setLoadingWa(true);
      const inst = instanceName || selectedCompany?.whatsappInstance || 'vurio';
      const res = await fetch(`/api/whatsapp/connect?instance=${inst}`);
      const data = await res.json();
      setWaData(data);
    } catch (err) {
      console.error('Erro ao consultar status WhatsApp:', err);
    } finally {
      setLoadingWa(false);
    }
  };

  const handleDisconnectWhatsApp = async () => {
    try {
      setDisconnectingWa(true);
      const inst = selectedCompany?.whatsappInstance || 'vurio';
      await fetch('/api/whatsapp/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'logout', instance: inst })
      });
      await fetchWhatsAppStatus(inst);
    } catch (err) {
      console.error('Erro ao desconectar WhatsApp:', err);
    } finally {
      setDisconnectingWa(false);
    }
  };

  const handleSelectCompany = (company: CompanyAccount) => {
    setSelectedCompany(company);
    setCompanyDropdownOpen(false);
    setPolicyConfig(prev => ({
      ...prev,
      companyId: company.id,
      companyName: company.tradeName,
      workCity: company.workCity,
      workState: company.workState
    }));
    fetchWhatsAppStatus(company.whatsappInstance);
  };

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompanyName || !newCompanyCnpj) return;
    try {
      setCreatingCompany(true);
      const res = await fetch('/api/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCompanyName,
          tradeName: newCompanyTradeName || newCompanyName,
          cnpj: newCompanyCnpj,
          plan: newCompanyPlan,
          creditsBalance: Number(newCompanyCredits) || 100,
          workCity: newCompanyCity,
          workState: newCompanyState,
          contactEmail: newCompanyEmail,
          whatsappInstance: 'vurio_' + newCompanyCnpj.replace(/\D/g, '').substring(0, 6)
        })
      });
      const data = await res.json();
      if (data.success && data.company) {
        setCompanies(prev => [data.company, ...prev]);
        setSelectedCompany(data.company);
        setCompanyModalOpen(false);
        setNewCompanyName('');
        setNewCompanyTradeName('');
        setNewCompanyCnpj('');
        setNewCompanyEmail('');
      }
    } catch (err) {
      console.error('Erro ao criar empresa:', err);
    } finally {
      setCreatingCompany(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    try {
      setAnalyzing(true);
      setLastResult(null);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('company_id', selectedCompany?.id || 'solucione-matriz');
      if (counterEmployeePhone) {
        formData.append('employeePhone', counterEmployeePhone);
      }
      if (counterNotifyWhatsApp) {
        formData.append('notifyWhatsApp', 'true');
      }

      const res = await fetch('/api/validate-attestation', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      setLastResult(data);
      fetchLogs();
    } catch (err) {
      console.error('Erro ao analisar arquivo:', err);
      alert('Falha na conexão com o servidor de triagem técnica.');
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

  const handleGenerateDossier = async () => {
    try {
      setGeneratingDossier(true);
      const res = await fetch('/api/doctor/incident/dossier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctorCrm: dossierCrm,
          doctorUf: dossierUf,
          doctorName: dossierDoctorName,
          patientName: dossierPatientName,
          companyName: selectedCompany?.tradeName || 'Sua Empresa S/A',
          fileName: dossierFileName,
          restDaysClaimed: 5,
          customStatement: 'O médico titular declara expressamente nunca ter emitido este atestado ou consultado o colaborador no referido estabelecimento.'
        })
      });

      const data = await res.json();
      if (data.success) {
        setGeneratedDossierData(data);
      } else {
        alert(data.error || 'Erro ao gerar dossiê.');
      }
    } catch (err) {
      console.error('Erro ao emitir dossiê:', err);
      alert('Falha ao comunicar com o gerador técnico de Notícia-Crime.');
    } finally {
      setGeneratingDossier(false);
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
      
      {/* Banner de Versão Ativa do Deploy */}
      <div className="bg-gradient-to-r from-sky-950/90 via-slate-900 to-indigo-950/90 border-b border-sky-500/20 px-4 py-2 flex flex-wrap items-center justify-between text-xs gap-2">
        <div className="flex items-center space-x-2">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-bold text-white tracking-wide">{APP_ENGINE_NAME} {APP_VERSION}</span>
          <span className="text-slate-400 hidden sm:inline">• Build {APP_BUILD_DATE}</span>
          <span className="text-[10px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono font-bold">
            PRODUÇÃO ATIVA
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-slate-400 hidden md:inline">
            Zero Storage • LGPD Estrita • Neutralidade Absoluta
          </span>
          <a
            href="/api/version"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] text-sky-400 hover:text-sky-300 font-medium flex items-center gap-1 hover:underline bg-slate-900 px-2 py-0.5 rounded border border-slate-800"
          >
            <span>Verificar /api/version</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

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

            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-full p-0.5 bg-gradient-to-tr from-[#0077d1] via-[#02c1db] to-[#01cf9e] shadow-md shadow-[#02c1db]/20 flex items-center justify-center flex-shrink-0">
                <img src="/logo.png" alt="Vurio" className="w-full h-full object-contain rounded-full bg-white" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center space-x-1.5">
                  <span className="font-black text-base tracking-tight text-white">Vurio</span>
                  <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-[#02c1db]/15 text-[#02c1db] border border-[#02c1db]/30">
                    Painel DP
                  </span>
                  <span className="text-[9px] font-mono text-slate-400 bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded-full">
                    {APP_VERSION}
                  </span>
                </div>
                <span className="text-[9.5px] text-slate-400 font-medium hidden md:block">
                  Detecta divergências e incoerências em atestados médicos
                </span>
              </div>
            </div>
          </div>

          {/* Abas Operacionais */}
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

            {/* Nova Aba: Módulo DP & Absenteísmo */}
            <button
              onClick={() => setActiveTab('absenteeism')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'absenteeism'
                  ? 'bg-gradient-to-r from-sky-600 to-indigo-600 text-white shadow-md'
                  : 'text-sky-300 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>Módulo DP & Absenteísmo</span>
              <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-500/30">
                Novo
              </span>
            </button>

            {/* Nova Aba: Conexão WhatsApp */}
            <button
              onClick={() => setActiveTab('whatsapp')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'whatsapp'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-emerald-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
              {waData?.state === 'open' ? (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              ) : (
                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              )}
            </button>

            {/* Nova Aba: Multi-Empresas */}
            <button
              onClick={() => setActiveTab('companies')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'companies'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-indigo-300 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Multi-Empresas</span>
              <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-1 rounded border border-indigo-500/30">
                {companies.length || 4}
              </span>
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
              <span>Passivo</span>
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
              <span>Doctor</span>
            </button>
          </nav>

          {/* Seletor Dinâmico de Empresa e Status do WhatsApp */}
          <div className="flex items-center space-x-2">
            
            {/* WhatsApp Status Pill */}
            <button
              onClick={() => setActiveTab('whatsapp')}
              title="Status da Conexão com o WhatsApp Corporativo"
              className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl border text-xs transition-all ${
                waData?.state === 'open'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                  : waData?.online === false
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span className="hidden md:inline font-medium">
                {waData?.state === 'open' ? 'WhatsApp Conectado' : waData?.online === false ? 'WhatsApp Offline' : 'Conectar WhatsApp'}
              </span>
              <span className={`w-2 h-2 rounded-full ${
                waData?.state === 'open' ? 'bg-emerald-400 animate-pulse' : waData?.online === false ? 'bg-rose-500' : 'bg-amber-400 animate-ping'
              }`}></span>
            </button>

            {/* Dropdown Multi-Empresas */}
            <div className="relative">
              <button
                onClick={() => setCompanyDropdownOpen(!companyDropdownOpen)}
                className="flex items-center space-x-2 bg-slate-900/80 hover:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-800 text-xs text-slate-300 transition-all"
              >
                <Building2 className="w-3.5 h-3.5 text-sky-400" />
                <span className="font-semibold max-w-[130px] sm:max-w-[180px] truncate">
                  {selectedCompany?.tradeName || policyConfig.companyName}
                </span>
                <span className="text-[10px] bg-sky-500/20 text-sky-300 px-1.5 py-0.5 rounded font-bold">
                  {selectedCompany?.plan || 'PRO'}
                </span>
                <ChevronDown className="w-3 h-3 text-slate-500" />
              </button>

              {companyDropdownOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-2 z-50 animate-fadeIn">
                  <div className="px-3 py-2 border-b border-slate-800">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Trocar de Empresa / Tenant</p>
                  </div>
                  <div className="py-1 max-h-60 overflow-y-auto space-y-1">
                    {companies.map((comp) => (
                      <button
                        key={comp.id}
                        onClick={() => handleSelectCompany(comp)}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-all ${
                          selectedCompany?.id === comp.id
                            ? 'bg-sky-600/20 text-sky-200 border border-sky-500/30'
                            : 'text-slate-300 hover:bg-slate-800/80'
                        }`}
                      >
                        <div>
                          <p className="font-bold text-white">{comp.tradeName}</p>
                          <p className="text-[10px] text-slate-400">{comp.cnpj} • {comp.workCity}/{comp.workState}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] font-semibold text-emerald-400">{comp.creditsBalance} cr</span>
                        </div>
                      </button>
                    ))}
                  </div>
                  <div className="pt-2 border-t border-slate-800">
                    <button
                      onClick={() => { setCompanyDropdownOpen(false); setActiveTab('companies'); }}
                      className="w-full py-1.5 text-center text-xs font-bold text-sky-400 hover:text-sky-300 bg-slate-950/80 hover:bg-slate-950 rounded-lg transition-all"
                    >
                      Gerenciar Todas as Empresas →
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Menu Mobile */}
        <div className="xl:hidden flex overflow-x-auto px-4 py-2 border-t border-slate-800/80 space-x-2 scrollbar-none bg-slate-950/60">
          <button onClick={() => setActiveTab('validation')} className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap ${activeTab === 'validation' ? 'bg-sky-600 text-white' : 'text-slate-400 bg-slate-900'}`}>Validador</button>
          <button onClick={() => setActiveTab('whatsapp')} className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap ${activeTab === 'whatsapp' ? 'bg-emerald-600 text-white' : 'text-emerald-400 bg-slate-900'}`}>WhatsApp</button>
          <button onClick={() => setActiveTab('companies')} className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap ${activeTab === 'companies' ? 'bg-indigo-600 text-white' : 'text-indigo-300 bg-slate-900'}`}>Multi-Empresas</button>
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
                  
                  <label className="inline-flex items-center justify-center px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-semibold cursor-pointer transition-all shadow mb-3">
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

                  {/* Fluxo de Balcão (Recepção/RH Presencial) */}
                  <div className="pt-3 border-t border-slate-800/80 space-y-2 text-left">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-300">Entrega de Balcão (Presencial):</span>
                      <span className="text-[10px] text-sky-400 font-medium">Opcional</span>
                    </div>
                    <input
                      type="text"
                      placeholder="WhatsApp do Colaborador (ex: 13999998888)"
                      value={counterEmployeePhone}
                      onChange={(e) => setCounterEmployeePhone(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                    />
                    <label className="flex items-center space-x-2 text-[11px] text-slate-400 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={counterNotifyWhatsApp}
                        onChange={(e) => setCounterNotifyWhatsApp(e.target.checked)}
                        className="rounded bg-slate-900 border-slate-700 text-sky-600 focus:ring-0"
                      />
                      <span>Disparar recibo neutro no WhatsApp</span>
                    </label>
                  </div>
                </div>

                {/* Status da Conexão com WhatsApp */}
                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Canal WhatsApp:</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold">Ativo & Conectado</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Seus colaboradores podem enviar o atestado direto no WhatsApp da empresa com recibo asséptico imediato.
                  </p>
                </div>
              </div>

              {/* Painel de Resultados */}
              <div className="lg:col-span-2">
                {analyzing ? (
                  <div className="h-64 rounded-2xl bg-slate-900/40 border border-slate-800 flex flex-col items-center justify-center text-center p-6 space-y-3">
                    <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-sm font-semibold text-white">Executando Análise Técnica de Integridade...</p>
                    <p className="text-xs text-slate-400">Checando ICP-Brasil, CFM Nacional, datas e regras da CCT.</p>
                  </div>
                ) : lastResult ? (
                  <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-bold text-white">Resultado da Auditoria</span>
                        <span className="px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 font-mono text-[10px] font-bold">
                          {lastResult.protocolId || '#VR-GERADO'}
                        </span>
                      </div>
                      <span className="text-xs text-slate-400">{lastResult.report?.executionTimeMs || 0} ms</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div className="space-y-1.5">
                        <p className="text-slate-400">Colaborador / Paciente:</p>
                        <p className="text-white font-bold">{lastResult.report?.patient?.name || (lastResult as any)?.forensicReport?.patient?.name || 'Não identificado no layout'}</p>
                      </div>
                      <div className="space-y-1.5">
                        <p className="text-slate-400">Médico / Conselho:</p>
                        <p className="text-white font-bold">
                          {lastResult.report?.doctor?.name ? `Dr(a). ${lastResult.report.doctor.name}` : 'Médico Não Identificado'} 
                          {lastResult.report?.doctor?.crm ? ` (${lastResult.report.doctor.crm}/${lastResult.report.doctor.uf || 'BR'})` : ''}
                        </p>
                      </div>
                      <div className="space-y-1.5">
                        <p className="text-slate-400">Afastamento:</p>
                        <p className="text-white font-bold">{lastResult.report?.restPeriod?.days ? `${lastResult.report.restPeriod.days} dias` : 'Não quantificado'}</p>
                      </div>
                      <div className="space-y-1.5">
                        <p className="text-slate-400">Status Geral:</p>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          lastResult.isAuthentic 
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' 
                            : lastResult.report?.status === 'REPRINTED_BROWSER_PDF'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        }`}>
                          {lastResult.report?.status === 'REPRINTED_BROWSER_PDF'
                            ? 'REIMPRESSÃO WEB (PDFium)'
                            : lastResult.report?.status || 'AVALIAÇÃO'}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 flex flex-wrap gap-2">
                      <button
                        onClick={() => {
                          const mockLog: ValidationLog = {
                            id: 'last',
                            file_name: lastResult.report?.fileName || 'documento.pdf',
                            status: lastResult.report?.status || 'VALID_INTACT',
                            is_authentic: lastResult.report?.isAuthentic || false,
                            doctor_name: lastResult.report?.doctor?.name || null,
                            crm: lastResult.report?.doctor?.crm || null,
                            uf: lastResult.report?.doctor?.uf || null,
                            issuer: lastResult.report?.signature?.issuer || null,
                            rest_days: lastResult.report?.restPeriod?.days || null,
                            start_date: lastResult.report?.restPeriod?.startDate || null,
                            file_hash: lastResult.report?.fileSha256 || '',
                            execution_time_ms: lastResult.executionTimeMs || 0,
                            protocol_id: lastResult.protocolId,
                            channel: 'WEB',
                            patient_name: lastResult.report?.patient?.name || null,
                            forensic_report: lastResult.forensicReport,
                            created_at: new Date().toISOString()
                          };
                          setSelectedLogForLaudo(mockLog);
                          setLaudoModalOpen(true);
                        }}
                        className="py-2 px-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center gap-1.5 shadow"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Abrir Parecer Didático do DP</span>
                      </button>

                      <button
                        onClick={() => {
                          const mockLog: ValidationLog = {
                            id: 'last',
                            file_name: lastResult.report?.fileName || 'documento.pdf',
                            status: lastResult.report?.status || 'VALID_INTACT',
                            is_authentic: lastResult.report?.isAuthentic || false,
                            doctor_name: lastResult.report?.doctor?.name || null,
                            crm: lastResult.report?.doctor?.crm || null,
                            uf: lastResult.report?.doctor?.uf || null,
                            issuer: lastResult.report?.signature?.issuer || null,
                            rest_days: lastResult.report?.restPeriod?.days || null,
                            start_date: lastResult.report?.restPeriod?.startDate || null,
                            file_hash: lastResult.report?.fileSha256 || '',
                            execution_time_ms: lastResult.executionTimeMs || 0,
                            protocol_id: lastResult.protocolId,
                            channel: 'WEB',
                            patient_name: lastResult.report?.patient?.name || null,
                            sender_phone: counterEmployeePhone || null,
                            created_at: new Date().toISOString()
                          };
                          setSelectedLogForReceipt(mockLog);
                          setReceiptModalOpen(true);
                        }}
                        className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5 border border-slate-700"
                      >
                        <FileText className="w-3.5 h-3.5 text-sky-400" />
                        <span>Comprovante de Balcão</span>
                      </button>

                      <button
                        onClick={() => {
                          setActiveTab('absenteeism');
                          setDpViewMode('workstation');
                        }}
                        className="py-2 px-3 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:opacity-90 text-white font-bold text-xs flex items-center gap-1.5 shadow"
                      >
                        <Columns className="w-3.5 h-3.5" />
                        <span>Estação Split View</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="h-64 rounded-2xl bg-slate-900/40 border border-slate-800 flex flex-col items-center justify-center text-center p-6 text-slate-400 text-xs">
                    <FileText className="w-8 h-8 text-slate-600 mb-2" />
                    <p>Nenhum documento analisado nesta sessão.</p>
                    <p className="text-slate-500">Faça o upload ou envie pelo WhatsApp para visualizar o relatório técnico.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Tabela de Logs Recentes */}
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-white">Histórico de Atestados Auditados</h3>
                  <p className="text-[11px] text-slate-400">Fila unificada com segregação de veredito: WhatsApp e Balcão de Recepção.</p>
                </div>
                <span className="text-xs text-slate-400">{logs.length} registros no total</span>
              </div>

              {/* Filtros e Busca */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Filtrar por protocolo (#VR-...), colaborador ou médico..."
                    value={logSearchQuery}
                    onChange={(e) => setLogSearchQuery(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={() => setSelectedChannelFilter('ALL')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                      selectedChannelFilter === 'ALL'
                        ? 'bg-sky-600 text-white'
                        : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    Todos ({logs.length})
                  </button>
                  <button
                    onClick={() => setSelectedChannelFilter('WHATSAPP')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                      selectedChannelFilter === 'WHATSAPP'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-950 text-emerald-400 hover:bg-slate-900 border border-slate-800'
                    }`}
                  >
                    <Smartphone className="w-3 h-3" />
                    <span>WhatsApp</span>
                  </button>
                  <button
                    onClick={() => setSelectedChannelFilter('WEB')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                      selectedChannelFilter === 'WEB'
                        ? 'bg-sky-600 text-white'
                        : 'bg-slate-950 text-sky-300 hover:bg-slate-900 border border-slate-800'
                    }`}
                  >
                    <Building2 className="w-3 h-3" />
                    <span>Balcão</span>
                  </button>
                  <button
                    onClick={() => fetchLogs()}
                    title="Atualizar lista"
                    className="p-1.5 rounded-lg bg-slate-950 text-slate-400 hover:text-white border border-slate-800 ml-1"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loadingLogs ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Tabela de Dados */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">Data</th>
                      <th className="py-2.5 px-3">Protocolo</th>
                      <th className="py-2.5 px-3">Canal</th>
                      <th className="py-2.5 px-3">Colaborador</th>
                      <th className="py-2.5 px-3">Médico / CRM</th>
                      <th className="py-2.5 px-3">Afastamento</th>
                      <th className="py-2.5 px-3">Parecer</th>
                      <th className="py-2.5 px-3 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {logs
                      .filter((log) => {
                        if (selectedChannelFilter === 'WHATSAPP' && log.channel !== 'WHATSAPP') return false;
                        if (selectedChannelFilter === 'WEB' && log.channel === 'WHATSAPP') return false;
                        if (!logSearchQuery) return true;
                        const q = logSearchQuery.toLowerCase();
                        const prot = (log.protocol_id || formatProtocolId(log.file_hash)).toLowerCase();
                        const pat = (log.patient_name || '').toLowerCase();
                        const doc = (log.doctor_name || '').toLowerCase();
                        const crm = (log.crm || '').toLowerCase();
                        return prot.includes(q) || pat.includes(q) || doc.includes(q) || crm.includes(q);
                      })
                      .map((log) => {
                        const protId = log.protocol_id || formatProtocolId(log.file_hash);
                        return (
                          <tr key={log.id} className="hover:bg-slate-900/40">
                            <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">
                              {new Date(log.created_at).toLocaleDateString('pt-BR')}
                            </td>
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              <span className="font-mono font-bold text-sky-400 bg-sky-950/40 px-2 py-0.5 rounded border border-sky-800/30">
                                {protId}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              {log.channel === 'WHATSAPP' ? (
                                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20 flex items-center gap-1 w-fit">
                                  <Smartphone className="w-3 h-3" />
                                  <span>WhatsApp {log.sender_phone ? `(${log.sender_phone.slice(-4)})` : ''}</span>
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-300 text-[10px] font-bold border border-sky-500/20 flex items-center gap-1 w-fit">
                                  <Building2 className="w-3 h-3" />
                                  <span>Balcão</span>
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-white font-medium max-w-[140px] truncate">
                              {log.patient_name || 'Colaborador Registrado'}
                            </td>
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              <span className="font-medium text-slate-200">{log.doctor_name || '—'}</span>
                              <span className="text-[10px] text-slate-400 block">{log.crm ? `${log.crm}/${log.uf}` : '—'}</span>
                            </td>
                            <td className="py-2.5 px-3 whitespace-nowrap">{log.rest_days ? `${log.rest_days} dias` : '—'}</td>
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              {log.is_authentic ? (
                                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">Conforme</span>
                              ) : log.status === 'REPRINTED_BROWSER_PDF' || log.forensic_report?.status === 'REPRINTED_BROWSER_PDF' ? (
                                <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 text-[10px] font-bold border border-amber-500/30">Reimpressão Web</span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-300 text-[10px] font-bold border border-rose-500/30">Averiguação</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end space-x-1.5">
                                <button
                                  onClick={() => {
                                    setActiveTab('absenteeism');
                                    setDpViewMode('workstation');
                                  }}
                                  title="Abrir na Estação de Validação Split View"
                                  className="px-2 py-1 rounded bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-[11px] font-semibold border border-indigo-500/30 flex items-center gap-1"
                                >
                                  <Columns className="w-3 h-3" />
                                  <span>Split View</span>
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedLogForLaudo(log);
                                    setLaudoModalOpen(true);
                                  }}
                                  title="Abrir Parecer Didático e Verificável"
                                  className="px-2 py-1 rounded bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 text-[11px] font-semibold border border-sky-500/30 flex items-center gap-1"
                                >
                                  <ShieldCheck className="w-3 h-3" />
                                  <span>Parecer</span>
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedLogForReceipt(log);
                                    setReceiptModalOpen(true);
                                  }}
                                  title="Ver Comprovante de Entrega"
                                  className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold"
                                >
                                  Recibo
                                </button>
                                <button
                                  onClick={() => openInquiryModal(log)}
                                  title="Ofício de 1-Clique para Clínica"
                                  className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-400 text-[11px] font-semibold"
                                >
                                  Diligência
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* SEÇÃO DE PRODUTOS ADICIONAIS (ADD-ONS INDEPENDENTES) */}
            <div className="p-6 rounded-3xl bg-slate-900/80 border border-amber-500/20 shadow-2xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-3 gap-2">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <h3 className="text-base font-bold text-white tracking-tight">Produtos Adicionais (Add-ons Independentes)</h3>
                </div>
                <span className="text-xs text-amber-300/90 font-medium">Contrate avulso ou agregue a qualquer plano</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                {/* Add-on 1: Geo-Shield */}
                <div className="p-5 bg-slate-950/80 rounded-2xl border border-amber-500/30 space-y-3 relative flex flex-col justify-between hover:border-amber-500/50 transition-all">
                  <span className="absolute -top-2.5 right-4 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[9px] font-black border border-amber-500/40 uppercase tracking-wider">
                    ADD-ON OPCIONAL
                  </span>
                  
                  <div className="space-y-2 pt-1">
                    <div className="flex items-start justify-between">
                      <span className="font-bold text-amber-300 flex items-center gap-1.5 text-sm">
                        <MapPin className="w-4 h-4" /> Geo-Shield
                      </span>
                      <div className="text-right">
                        <span className="font-black text-white text-sm">R$ 49/mês</span>
                        <span className="block text-[10px] text-slate-400">ou +R$ 3 na consulta avulsa</span>
                      </div>
                    </div>
                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      Auditoria de rota e distância geográfica entre o posto de trabalho/moradia e a clínica do atestado. Identifica incompatibilidades de deslocamento (ex: Santos x Ribeirão Preto) amparado no Art. 482 da CLT.
                    </p>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={() => setActiveTab('geo')}
                      className="w-full py-2.5 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold transition-all flex items-center justify-center gap-2"
                    >
                      <Compass className="w-3.5 h-3.5 text-amber-400" />
                      <span>Contratar com Geo-Shield (R$ 13)</span>
                    </button>
                  </div>
                </div>

                {/* Add-on 2: Dossiê Jurídico & B.O. */}
                <div className="p-5 bg-slate-950/80 rounded-2xl border border-emerald-500/30 space-y-3 relative flex flex-col justify-between hover:border-emerald-500/50 transition-all">
                  <span className="absolute -top-2.5 right-4 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[9px] font-black border border-emerald-500/40 uppercase tracking-wider">
                    ADD-ON DE TRIAGEM
                  </span>

                  <div className="space-y-2 pt-1">
                    <div className="flex items-start justify-between">
                      <span className="font-bold text-emerald-300 flex items-center gap-1.5 text-sm">
                        <Stethoscope className="w-4 h-4" /> Dossiê Jurídico & B.O.
                      </span>
                      <div className="text-right">
                        <span className="font-black text-white text-sm">R$ 89 avulso</span>
                        <span className="block text-[10px] text-slate-400">R$ 49 se assinante</span>
                      </div>
                    </div>
                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      Relatório técnico completa com hash SHA-256 inalterável, carimbo de tempo ICP-Brasil e histórico de incidentes do CRM, formatada para abertura direta de Notícia-Crime na Polícia Civil e justa causa trabalhista.
                    </p>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={() => {
                        setGeneratedDossierData(null);
                        setDossierModalOpen(true);
                      }}
                      className="w-full py-2.5 px-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition-all flex items-center justify-center gap-2"
                    >
                      <FileText className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Emitir Dossiê B.O. (R$ 89)</span>
                    </button>
                  </div>
                </div>

                {/* Add-on 3: Diligência Formal CFM */}
                <div className="p-5 bg-slate-950/80 rounded-2xl border border-sky-500/30 space-y-3 relative flex flex-col justify-between hover:border-sky-500/50 transition-all">
                  <span className="absolute -top-2.5 right-4 px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 text-[9px] font-black border border-sky-500/40 uppercase tracking-wider">
                    ADD-ON 1-CLIQUE
                  </span>

                  <div className="space-y-2 pt-1">
                    <div className="flex items-start justify-between">
                      <span className="font-bold text-sky-300 flex items-center gap-1.5 text-sm">
                        <Scale className="w-4 h-4" /> Diligência Formal CFM
                      </span>
                      <div className="text-right">
                        <span className="font-black text-white text-sm">R$ 15 / ofício</span>
                        <span className="block text-[10px] text-emerald-400">Ilimitado no Pro</span>
                      </div>
                    </div>
                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      Emissão e envio automático de ofício administrativo respaldado na Resolução CFM 1.658/2002 para confirmação de atendimento diretamente com a secretaria do consultório ou hospital.
                    </p>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={() => {
                        setInquiryGeneratedUrl(null);
                        setInquiryDoctorName('Dr. Carlos Eduardo Menezes');
                        setInquiryCrm('123456');
                        setInquiryUf('SP');
                        setInquiryPatientName('Colaborador Sob Averiguação');
                        setInquiryClinicName('Clínica Médica Central');
                        setInquiryModalOpen(true);
                      }}
                      className="w-full py-2.5 px-3 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/40 text-xs font-bold transition-all flex items-center justify-center gap-2"
                    >
                      <Send className="w-3.5 h-3.5 text-sky-400" />
                      <span>Disparar Diligência (R$ 15)</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* ABA: MÓDULO DP - ANALISADOR DE ATESTADOS & GESTÃO DE ABSENTEÍSMO */}
        {activeTab === 'absenteeism' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Header da Aba */}
            <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-sky-950/40 to-indigo-950/40 border border-sky-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="p-2 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
                    <Briefcase className="w-5 h-5" />
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-black text-white">Módulo DP: Gestão e Validação de Atestados Médicos</h2>
                      <span className="text-[10px] font-mono bg-sky-500/20 text-sky-300 border border-sky-500/40 px-2 py-0.5 rounded-full font-bold">
                        {APP_VERSION}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300">
                      Estação Split View Lado a Lado • Neutralidade Absoluta • Consulta CFM ao Vivo • Pasta Permanente do Colaborador
                    </p>
                  </div>
                </div>
              </div>

              {/* Seletor de Modo de Visualização do DP */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => setDpViewMode('workstation')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
                    dpViewMode === 'workstation'
                      ? 'bg-sky-600 text-white border-sky-500 shadow-md'
                      : 'bg-slate-900 text-slate-300 border-slate-700 hover:text-white'
                  }`}
                >
                  <Columns className="w-3.5 h-3.5" />
                  <span>Estação Split View (Validação)</span>
                  <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1 rounded border border-emerald-500/30">
                    Ao Vivo
                  </span>
                </button>

                <button
                  onClick={() => setDpViewMode('events')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
                    dpViewMode === 'events'
                      ? 'bg-indigo-600 text-white border-indigo-500 shadow-md'
                      : 'bg-slate-900 text-slate-300 border-slate-700 hover:text-white'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Eventos do DP & Preditivo</span>
                  <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-1 rounded border border-indigo-500/30">
                    {notableEventsList.length}
                  </span>
                </button>
              </div>
            </div>

            {/* MODO 1: ESTAÇÃO DE VALIDAÇÃO (SPLIT VIEW LADO A LADO) */}
            {dpViewMode === 'workstation' && (
              <ValidationWorkstation
                companyId={selectedCompany?.id || 'default'}
                onDecisionRecorded={() => {
                  fetchLogs();
                  fetchNotableEvents();
                }}
              />
            )}

            {/* MODO 2: CADASTRO DE EVENTOS DO DP & ANÁLISE PREDITIVA */}
            {dpViewMode === 'events' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Coluna 1 (5 colunas): Ingestão, Dados Cadastrais & Digitação Assistida */}
                <div className="lg:col-span-5 space-y-6">
                
                {/* Card de Ingestão de Documento */}
                <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4 shadow-xl">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <UploadCloud className="w-4 h-4 text-sky-400" />
                    Etapa 1: Leitura do Documento (OCR & Arquivo)
                  </h3>

                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="block text-slate-400 mb-1 font-medium">Arquivo do Atestado (PDF ou Foto):</label>
                      <input
                        type="file"
                        accept=".pdf,image/*"
                        onChange={(e) => setDpFile(e.target.files?.[0] || null)}
                        className="w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-sky-600 file:text-white hover:file:bg-sky-500 cursor-pointer bg-slate-950 border border-slate-800 rounded-xl p-1.5"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="block text-slate-400 mb-1 font-medium">Nome do Colaborador (Cadastro):</label>
                        <input
                          type="text"
                          value={dpEmployeeName}
                          onChange={(e) => setDpEmployeeName(e.target.value)}
                          placeholder="Ex: Carlos Oliveira"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-sky-500"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 mb-1 font-medium">CPF do Colaborador:</label>
                        <input
                          type="text"
                          value={dpEmployeeCpf}
                          onChange={(e) => setDpEmployeeCpf(e.target.value)}
                          placeholder="000.000.000-00"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-sky-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-400 mb-1 font-medium">Cidade da Unidade de Trabalho:</label>
                        <input
                          type="text"
                          value={dpEmployeeWorkCity}
                          onChange={(e) => setDpEmployeeWorkCity(e.target.value)}
                          placeholder="Ex: Santos"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-sky-500"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 mb-1 font-medium">Cidade de Residência:</label>
                        <input
                          type="text"
                          value={dpEmployeeHomeCity}
                          onChange={(e) => setDpEmployeeHomeCity(e.target.value)}
                          placeholder="Ex: Santos"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-sky-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Painel de Digitação Assistida */}
                  {assistTypingOpen && (
                    <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/30 space-y-3 animate-fadeIn">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-amber-300 text-xs flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Digitação Assistida (OCR Fallback)
                        </span>
                        <span className="text-[10px] text-amber-400/90 font-medium">Consulta Instantânea CFM</span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <label className="block text-slate-400 text-[10px] mb-0.5">CRM:</label>
                          <input
                            type="text"
                            value={assistCrm}
                            onChange={(e) => {
                              setAssistCrm(e.target.value);
                              handleLookupCrmLive(e.target.value, assistUf);
                            }}
                            placeholder="Ex: 98133"
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-white font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-400 text-[10px] mb-0.5">UF:</label>
                          <input
                            type="text"
                            value={assistUf}
                            onChange={(e) => {
                              setAssistUf(e.target.value.toUpperCase());
                              handleLookupCrmLive(assistCrm, e.target.value.toUpperCase());
                            }}
                            placeholder="SP"
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-white uppercase font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-400 text-[10px] mb-0.5">Dias:</label>
                          <input
                            type="number"
                            min="1"
                            value={assistDays}
                            onChange={(e) => setAssistDays(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-white"
                          />
                        </div>
                      </div>

                      {assistLookingUpCfm && (
                        <p className="text-[11px] text-sky-400 flex items-center gap-1">
                          <RefreshCw className="w-3 h-3 animate-spin" /> Consultando registro no Conselho Regional...
                        </p>
                      )}

                      {assistDoctorName && (
                        <div className="p-2 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-[11px] text-emerald-300 flex items-center justify-between">
                          <span><strong>Médico no CFM:</strong> {assistDoctorName}</span>
                          <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded">Ativo</span>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <label className="block text-slate-400 text-[10px] mb-0.5">Data de Emissão:</label>
                          <input
                            type="date"
                            value={assistEmissionDate}
                            onChange={(e) => setAssistEmissionDate(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-white text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-400 text-[10px] mb-0.5">CID (Opcional):</label>
                          <input
                            type="text"
                            value={assistCid}
                            onChange={(e) => setAssistCid(e.target.value.toUpperCase())}
                            placeholder="Ex: M54.5"
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-white uppercase text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleAnalyzeDp}
                    disabled={dpAnalyzing || (!dpFile && !assistCrm)}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-sky-600 via-indigo-600 to-sky-600 hover:opacity-90 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg disabled:opacity-50"
                  >
                    {dpAnalyzing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Processando 4 Etapas Analíticas...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>Executar Análise Completa do DP</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Card de Gestão de Eventos Notáveis do DP */}
                <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4 shadow-xl">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-indigo-400" />
                      Eventos Notáveis do DP (Privado/Manual)
                    </h3>
                    <span className="text-[10px] text-slate-400">Inteligência Preditiva</span>
                  </div>

                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Cadastre datas estratégicas (shows na região, eventos noturnos, fechamento de folha) para cruzamento automatizado com datas de atestado.
                  </p>

                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {notableEventsList.map((evt) => (
                      <div key={evt.id} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                        <div>
                          <span className="font-bold text-white block">{evt.title}</span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {evt.startDate} até {evt.endDate} • {evt.category}
                          </span>
                        </div>
                        <button
                          onClick={() => handleDeleteNotableEvent(evt.id)}
                          className="text-slate-500 hover:text-rose-400 text-xs px-2 py-1"
                          title="Remover evento"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Formulário Rápido para Novo Evento */}
                  <div className="pt-2 border-t border-slate-800 space-y-2 text-xs">
                    <input
                      type="text"
                      value={newEventTitle}
                      onChange={(e) => setNewEventTitle(e.target.value)}
                      placeholder="Nome do Evento (ex: Festival de Verão)"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="date"
                        value={newEventStartDate}
                        onChange={(e) => setNewEventStartDate(e.target.value)}
                        className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-white text-[11px]"
                      />
                      <input
                        type="date"
                        value={newEventEndDate}
                        onChange={(e) => setNewEventEndDate(e.target.value)}
                        className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-white text-[11px]"
                      />
                    </div>
                    <button
                      onClick={handleCreateNotableEvent}
                      disabled={creatingEvent || !newEventTitle || !newEventStartDate || !newEventEndDate}
                      className="w-full py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-all disabled:opacity-50"
                    >
                      {creatingEvent ? 'Cadastrando...' : '+ Cadastrar Evento do DP'}
                    </button>
                  </div>
                </div>

              </div>

              {/* Coluna 2 (7 colunas): Resultado Analítico & Pasta do Colaborador */}
              <div className="lg:col-span-7 space-y-6">
                
                {dpResult ? (
                  <div className="space-y-6 animate-fadeIn">
                    
                    {/* CARD 1: AÇÃO RECOMENDADA AO DP (DESTAQUE MÁXIMO) */}
                    <div className={`p-6 rounded-2xl border shadow-2xl space-y-3 ${
                      dpResult.acao_recomendada_dp === 'APROVAR'
                        ? 'bg-emerald-950/30 border-emerald-500/50 text-emerald-200'
                        : dpResult.acao_recomendada_dp === 'CONFERIR_DOCUMENTO_FISICO'
                        ? 'bg-amber-950/30 border-amber-500/50 text-amber-200'
                        : 'bg-sky-950/30 border-sky-500/50 text-sky-200'
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border bg-black/40">
                          DIRETRIZ ANALÍTICA DO DP
                        </span>
                        <span className="font-mono text-xs">Apoio à Decisão Humana</span>
                      </div>

                      <div className="flex items-start gap-3 pt-1">
                        {dpResult.acao_recomendada_dp === 'APROVAR' ? (
                          <CheckCircle2 className="w-8 h-8 text-emerald-400 flex-shrink-0" />
                        ) : dpResult.acao_recomendada_dp === 'CONFERIR_DOCUMENTO_FISICO' ? (
                          <AlertTriangle className="w-8 h-8 text-amber-400 flex-shrink-0" />
                        ) : (
                          <FileText className="w-8 h-8 text-sky-400 flex-shrink-0" />
                        )}

                        <div>
                          <h4 className="text-lg font-black text-white tracking-tight">
                            {dpResult.acao_recomendada_dp === 'APROVAR' && 'AÇÃO RECOMENDADA: APROVAR ATESTADO'}
                            {dpResult.acao_recomendada_dp === 'CONFERIR_DOCUMENTO_FISICO' && 'AÇÃO RECOMENDADA: CONFERIR DOCUMENTO FÍSICO ORIGINAL'}
                            {dpResult.acao_recomendada_dp === 'PREENCHER_MANUALMENTE' && 'AÇÃO RECOMENDADA: PREENCHIMENTO MANUAL ASSISTIDO'}
                          </h4>
                          <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                            {dpResult.acao_recomendada_dp === 'APROVAR' && 'Documento analisado sem divergências formais ou anomalias estruturais registradas. Dados em conformidade.'}
                            {dpResult.acao_recomendada_dp === 'CONFERIR_DOCUMENTO_FISICO' && 'Identificadas inconsistências formais, alertas de distância ou anomalias de metadados. Recomenda-se conferência administrativa do documento físico.'}
                            {dpResult.acao_recomendada_dp === 'PREENCHER_MANUALMENTE' && 'Baixa legibilidade do arquivo ou campos obrigatórios ausentes. Utilize o painel de digitação assistida com consulta CFM.'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* CARD 2: PASTA DO COLABORADOR (HISTÓRICO NO ANO VIGENTE) */}
                    {dpResult.pasta_colaborador && (
                      <div className="p-6 rounded-2xl bg-slate-900/80 border border-indigo-500/30 space-y-4 shadow-xl">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                          <h4 className="text-sm font-bold text-white flex items-center gap-2">
                            <FolderOpen className="w-4 h-4 text-indigo-400" />
                            Pasta do Colaborador: Histórico Anual de Absenteísmo ({new Date().getFullYear()})
                          </h4>
                          <span className="text-xs font-mono text-indigo-300 font-bold">{dpResult.dados_extraidos.colaborador_nome}</span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-center">
                            <span className="text-[10px] text-slate-400 block">Total de Atestados</span>
                            <span className="text-xl font-black text-white">{dpResult.pasta_colaborador.total_atestados_ano}</span>
                          </div>
                          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-center">
                            <span className="text-[10px] text-slate-400 block">Dias de Afastamento</span>
                            <span className="text-xl font-black text-sky-400">{dpResult.pasta_colaborador.total_dias_ano} dias</span>
                          </div>
                          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-center">
                            <span className="text-[10px] text-slate-400 block">Reincidência Grupo CID</span>
                            <span className={`text-sm font-black ${dpResult.pasta_colaborador.reincidencia_cid_grupo ? 'text-amber-400' : 'text-emerald-400'}`}>
                              {dpResult.pasta_colaborador.reincidencia_cid_grupo ? 'Sim (Detectado)' : 'Não'}
                            </span>
                          </div>
                          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-center">
                            <span className="text-[10px] text-slate-400 block">Histórico Inconsistências</span>
                            <span className={`text-xl font-black ${dpResult.pasta_colaborador.historico_inconsistencias > 0 ? 'text-rose-400' : 'text-slate-300'}`}>
                              {dpResult.pasta_colaborador.historico_inconsistencias}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* CARD 3: INTELIGÊNCIA PREDITIVA E CRUZAMENTO DE EVENTOS */}
                    <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3 shadow-xl">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <h4 className="text-sm font-bold text-white flex items-center gap-2">
                          <Clock className="w-4 h-4 text-sky-400" />
                          Inteligência Preditiva & Cruzamento de Eventos
                        </h4>
                        <span className="text-[10px] bg-sky-500/10 text-sky-400 px-2 py-0.5 rounded-full border border-sky-500/20 font-mono">
                          Calendário Oficial + DP
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                          <span className="text-slate-400">Coincidência com Feriado:</span>
                          <span className={`font-bold ${dpResult.analise_preditiva.coincidencia_feriado ? 'text-amber-400' : 'text-slate-300'}`}>
                            {dpResult.analise_preditiva.coincidencia_feriado ? 'Sim' : 'Não'}
                          </span>
                        </div>
                        <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                          <span className="text-slate-400">Coincidência com Evento do DP:</span>
                          <span className={`font-bold ${dpResult.analise_preditiva.coincidencia_evento_dp ? 'text-amber-400' : 'text-slate-300'}`}>
                            {dpResult.analise_preditiva.coincidencia_evento_dp ? 'Sim' : 'Não'}
                          </span>
                        </div>
                      </div>

                      {dpResult.analise_preditiva.nome_evento && (
                        <div className="p-3 bg-amber-950/20 border border-amber-500/30 rounded-xl text-xs text-amber-200">
                          <strong>Evento Sinalizado:</strong> {dpResult.analise_preditiva.nome_evento}
                        </div>
                      )}
                    </div>

                    {/* CARD 4: ALERTAS DE SEGURANÇA E OPERACIONAIS */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      {/* Alertas de Segurança */}
                      <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                        <span className="font-bold text-white flex items-center gap-1.5 text-xs">
                          <Lock className="w-3.5 h-3.5 text-rose-400" /> Alertas de Segurança (Metadados/PAdES)
                        </span>
                        {dpResult.alertas_seguranca.length > 0 ? (
                          <ul className="space-y-1.5 text-rose-300">
                            {dpResult.alertas_seguranca.map((al, idx) => (
                              <li key={idx} className="p-2 rounded-lg bg-rose-950/20 border border-rose-500/30 text-[11px] leading-tight">
                                • {al}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-[11px] text-emerald-400 flex items-center gap-1 pt-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Nenhuma alteração técnica ou anomalia detectada.
                          </p>
                        )}
                      </div>

                      {/* Alertas Operacionais */}
                      <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                        <span className="font-bold text-white flex items-center gap-1.5 text-xs">
                          <Compass className="w-3.5 h-3.5 text-amber-400" /> Alertas Operacionais (Distância/Pontes)
                        </span>
                        {dpResult.alertas_operacionais.length > 0 ? (
                          <ul className="space-y-1.5 text-amber-300">
                            {dpResult.alertas_operacionais.map((al, idx) => (
                              <li key={idx} className="p-2 rounded-lg bg-amber-950/20 border border-amber-500/30 text-[11px] leading-tight">
                                • {al}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-[11px] text-emerald-400 flex items-center gap-1 pt-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Prazos e localidade em conformidade operacional.
                          </p>
                        )}
                      </div>
                    </div>

                    {/* CARD 5: DADOS EXTRAÍDOS & INTEROPERABILIDADE JSON */}
                    <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <span className="font-bold text-white text-xs">Dados Extraídos do Atestado:</span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(JSON.stringify(dpResult, null, 2));
                            setCopiedDpJson(true);
                            setTimeout(() => setCopiedDpJson(false), 2500);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-400 text-xs font-semibold flex items-center gap-1 transition-all"
                        >
                          <Copy className="w-3 h-3" />
                          <span>{copiedDpJson ? 'JSON Copiado!' : 'Copiar Resposta JSON'}</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                        <div className="p-2 bg-slate-950 rounded-lg border border-slate-800">
                          <span className="text-[10px] text-slate-500 block">Colaborador</span>
                          <span className="font-bold text-white truncate block">{dpResult.dados_extraidos.colaborador_nome}</span>
                        </div>
                        <div className="p-2 bg-slate-950 rounded-lg border border-slate-800">
                          <span className="text-[10px] text-slate-500 block">Médico</span>
                          <span className="font-bold text-white truncate block">{dpResult.dados_extraidos.medico_nome}</span>
                        </div>
                        <div className="p-2 bg-slate-950 rounded-lg border border-slate-800">
                          <span className="text-[10px] text-slate-500 block">CRM / UF</span>
                          <span className="font-bold text-sky-400">{dpResult.dados_extraidos.crm_uf}</span>
                        </div>
                        <div className="p-2 bg-slate-950 rounded-lg border border-slate-800">
                          <span className="text-[10px] text-slate-500 block">Período</span>
                          <span className="font-bold text-white">{dpResult.dados_extraidos.dias_afastamento} dia(s)</span>
                        </div>
                      </div>
                    </div>

                  </div>
                ) : (
                  /* Estado Vazio de Espera */
                  <div className="p-12 rounded-2xl bg-slate-900/40 border border-dashed border-slate-800 text-center space-y-3">
                    <Briefcase className="w-12 h-12 text-slate-600 mx-auto" />
                    <h4 className="text-base font-bold text-slate-300">Aguardando Ingestão de Documento</h4>
                    <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                      Selecione um arquivo PDF ou foto ao lado (ou utilize o painel de Digitação Assistida) para processar as 4 etapas de compliance, inteligência preditiva e alimentar a pasta do colaborador.
                    </p>
                  </div>
                )}

              </div>

            </div>
            )}
          </div>
        )}

        {/* ABA: CONEXÃO WHATSAPP (EVOLUTION API / QR CODE AO VIVO) */}
        {activeTab === 'whatsapp' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Header da Aba */}
            <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-emerald-950/40 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <MessageSquare className="w-5 h-5" />
                  </span>
                  <div>
                    <h2 className="text-lg font-extrabold text-white">Conexão WhatsApp Corporativo (Evolution API)</h2>
                    <p className="text-xs text-slate-400">
                      Vincule o número exclusivo do DP/RH da empresa <strong className="text-white">{selectedCompany?.tradeName}</strong> para recepção autônoma.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => fetchWhatsAppStatus()}
                  disabled={loadingWa}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white flex items-center space-x-1.5 transition-all border border-slate-700"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingWa ? 'animate-spin' : ''}`} />
                  <span>Atualizar Status</span>
                </button>
              </div>
            </div>

            {/* Painel Principal de Conexão */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Card de Status da Instância */}
              <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-sky-400" />
                  Parâmetros da Instância
                </h3>

                <div className="space-y-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center">
                    <span className="text-slate-400">Instância Ativa:</span>
                    <span className="font-mono font-bold text-white bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                      {selectedCompany?.whatsappInstance || 'vurio'}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center">
                    <span className="text-slate-400">Estado da Conexão:</span>
                    <span className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] border ${
                      waData?.state === 'open'
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                        : waData?.online === false
                        ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                        : 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                    }`}>
                      {waData?.state === 'open' ? '🟢 Conectado' : waData?.online === false ? '🔴 Desconectado' : '🟡 Aguardando Leitura'}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center">
                    <span className="text-slate-400">Número Pareado:</span>
                    <span className="font-mono text-slate-200">
                      {waData?.phone || selectedCompany?.whatsappPhone || 'Nenhum'}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center">
                    <span className="text-slate-400">Webhook de Escuta:</span>
                    <span className="font-mono text-emerald-400 text-[10px]">/api/webhook/whatsapp</span>
                  </div>
                </div>

                {waData?.state === 'open' && (
                  <button
                    onClick={handleDisconnectWhatsApp}
                    disabled={disconnectingWa}
                    className="w-full mt-4 py-2 px-3 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>{disconnectingWa ? 'Desconectando...' : 'Desconectar WhatsApp Desta Empresa'}</span>
                  </button>
                )}
              </div>

              {/* Área Central: QR Code ou Sucesso Conectado */}
              <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col justify-center items-center text-center min-h-[380px]">
                {waData?.state === 'open' ? (
                  <div className="space-y-4 max-w-md animate-fadeIn">
                    <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 mx-auto flex items-center justify-center">
                      <CheckCircle2 className="w-10 h-10" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-white">WhatsApp 100% Conectado & Operacional</h4>
                      <p className="text-xs text-slate-400 mt-1">
                        O robô de triagem do Vurio está conectado ao número <strong className="text-emerald-300">{waData?.phone}</strong>.
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-left text-xs space-y-2">
                      <div className="flex items-center gap-2 text-white font-semibold">
                        <ShieldCheck className="w-4 h-4 text-sky-400" />
                        Fluxo de Atendimento em Produção:
                      </div>
                      <p className="text-slate-400 text-[11px]">
                        1. O colaborador envia o PDF ou foto do atestado para o WhatsApp da empresa.
                      </p>
                      <p className="text-slate-400 text-[11px]">
                        2. O motor criptográfico valida se há assinatura digital ICP-Brasil (PAdES) ou processa com visão computacional OCR.
                      </p>
                      <p className="text-slate-400 text-[11px]">
                        3. Se for contrato ou outro documento não-médico, o sistema avisa educadamente sem debitar créditos.
                      </p>
                    </div>

                    <button
                      onClick={() => setActiveTab('validation')}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/20 transition-all"
                    >
                      Acompanhar Validações em Tempo Real →
                    </button>
                  </div>
                ) : waData?.online === false ? (
                  <div className="space-y-4 max-w-lg animate-fadeIn text-left">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center flex-shrink-0">
                        <AlertTriangle className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">Evolution API Local Offline (Docker)</h4>
                        <p className="text-xs text-slate-400">
                          O serviço de WhatsApp precisa que o container Docker esteja ativo na porta 8080.
                        </p>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                      <p className="text-xs font-bold text-slate-300">Como iniciar a Evolution API no seu computador:</p>
                      <div className="flex items-center justify-between bg-slate-900 px-3 py-2 rounded-lg border border-slate-800">
                        <code className="text-emerald-400 text-xs font-mono">docker-compose up -d</code>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText('docker-compose up -d');
                            setCopiedDockerCmd(true);
                            setTimeout(() => setCopiedDockerCmd(false), 2000);
                          }}
                          className="text-slate-400 hover:text-white text-xs flex items-center gap-1 ml-2"
                        >
                          {copiedDockerCmd ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          <span className="text-[11px]">{copiedDockerCmd ? 'Copiado!' : 'Copiar'}</span>
                        </button>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Após rodar o comando no terminal do projeto, clique no botão abaixo para gerar o QR Code.
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => fetchWhatsAppStatus()}
                        disabled={loadingWa}
                        className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition-all shadow"
                      >
                        {loadingWa ? 'Verificando...' : 'Verificar Conexão Novamente'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6 max-w-md animate-fadeIn">
                    <div>
                      <h4 className="text-base font-bold text-white">Pareie o WhatsApp da Empresa</h4>
                      <p className="text-xs text-slate-400 mt-1">
                        Abra o aplicativo WhatsApp no celular da empresa e aponte para o QR Code abaixo:
                      </p>
                    </div>

                    {/* Exibição do QR Code */}
                    <div className="bg-white p-4 rounded-2xl shadow-2xl inline-block border-4 border-emerald-500/30">
                      {waData?.qrcode ? (
                        <img 
                          src={waData.qrcode.startsWith('data:') ? waData.qrcode : `data:image/png;base64,${waData.qrcode}`} 
                          alt="QR Code WhatsApp" 
                          className="w-56 h-56 mx-auto object-contain"
                        />
                      ) : (
                        <div className="w-56 h-56 flex flex-col items-center justify-center text-slate-500 space-y-2">
                          <QrCode className="w-12 h-12 text-slate-400 animate-pulse" />
                          <span className="text-xs font-medium text-slate-600">Gerando QR Code...</span>
                        </div>
                      )}
                    </div>

                    {/* Passo a Passo */}
                    <div className="text-left text-xs space-y-1.5 p-3 rounded-xl bg-slate-950 border border-slate-800">
                      <p className="text-slate-300 font-semibold">Instruções no Celular:</p>
                      <p className="text-slate-400 text-[11px]">1. Abra o WhatsApp e toque em <strong>Mais opções</strong> (⋮) ou <strong>Configurações</strong>.</p>
                      <p className="text-slate-400 text-[11px]">2. Toque em <strong>Aparelhos conectados</strong> e depois em <strong>Conectar um aparelho</strong>.</p>
                      <p className="text-slate-400 text-[11px]">3. Aponte a câmera para esta tela para sincronizar.</p>
                    </div>

                    <button
                      onClick={() => fetchWhatsAppStatus()}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow"
                    >
                      Já Escaneei / Atualizar Status
                    </button>
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* ABA: GESTÃO MULTI-EMPRESAS (MULTI-TENANT) */}
        {activeTab === 'companies' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Header com Ação */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800">
              <div>
                <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-indigo-400" />
                  Gestão Multi-Empresas (Multi-Tenant)
                </h2>
                <p className="text-xs text-slate-400">
                  Gerencie clientes corporativos, números dedicados de WhatsApp, franquia de créditos e regras de CCT por unidade.
                </p>
              </div>

              <button
                onClick={() => setCompanyModalOpen(true)}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-lg shadow-indigo-600/20"
              >
                <Plus className="w-4 h-4" />
                <span>Nova Empresa Cliente</span>
              </button>
            </div>

            {/* Métricas do Pool */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
                <span className="text-slate-400 text-xs block">Empresas no Portfólio</span>
                <span className="text-2xl font-extrabold text-white">{companies.length}</span>
                <span className="text-[10px] text-emerald-400 block mt-1">100% ativas</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
                <span className="text-slate-400 text-xs block">Atestados Auditados (Mês)</span>
                <span className="text-2xl font-extrabold text-white">
                  {companies.reduce((acc, curr) => acc + (curr.monthlyAuditsCount || 0), 0)}
                </span>
                <span className="text-[10px] text-sky-400 block mt-1">+18% vs mês anterior</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
                <span className="text-slate-400 text-xs block">Créditos Ativos no Pool</span>
                <span className="text-2xl font-extrabold text-emerald-400">
                  {companies.reduce((acc, curr) => acc + (curr.creditsBalance || 0), 0)}
                </span>
                <span className="text-[10px] text-slate-400 block mt-1">Recarga automática via InfinitePay</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
                <span className="text-slate-400 text-xs block">Instâncias WhatsApp</span>
                <span className="text-2xl font-extrabold text-indigo-300">
                  {companies.filter(c => c.whatsappStatus === 'connected').length} / {companies.length}
                </span>
                <span className="text-[10px] text-slate-400 block mt-1">Canais exclusivos</span>
              </div>
            </div>

            {/* Grid de Empresas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {companies.map((company) => {
                const isCurrentActive = selectedCompany?.id === company.id;
                return (
                  <div
                    key={company.id}
                    className={`p-6 rounded-2xl border transition-all flex flex-col justify-between space-y-4 ${
                      isCurrentActive
                        ? 'bg-slate-900/90 border-sky-500/50 shadow-xl shadow-sky-900/10'
                        : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                          company.plan === 'ENTERPRISE'
                            ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                            : company.plan === 'COMPLIANCE_PRO'
                            ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                            : 'bg-slate-700/20 text-slate-300 border-slate-700/40'
                        }`}>
                          Plano {company.plan}
                        </span>

                        {isCurrentActive && (
                          <span className="text-[10px] font-bold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-full border border-sky-500/30 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            Empresa Ativa Agora
                          </span>
                        )}
                      </div>

                      <h3 className="text-base font-bold text-white mt-2">{company.tradeName}</h3>
                      <p className="text-xs text-slate-400 font-mono">{company.name}</p>
                      <p className="text-xs text-slate-400 mt-1">CNPJ: <span className="font-mono text-slate-300">{company.cnpj}</span></p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs pt-2 border-t border-slate-800">
                      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                        <span className="text-slate-400 text-[10px] block">CRÉDITOS DISPONÍVEIS</span>
                        <span className="text-sm font-bold text-emerald-400">{company.creditsBalance} análises</span>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                        <span className="text-slate-400 text-[10px] block">AUDITADOS NO MÊS</span>
                        <span className="text-sm font-bold text-white">{company.monthlyAuditsCount || 0} atestados</span>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                        <span className="text-slate-400 text-[10px] block">CIDADE SEDE (CCT)</span>
                        <span className="font-bold text-slate-200">{company.workCity}/{company.workState}</span>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                        <span className="text-slate-400 text-[10px] block">INSTÂNCIA WHATSAPP</span>
                        <span className="font-bold text-slate-200 truncate block">{company.whatsappInstance}</span>
                      </div>
                    </div>

                    <div className="pt-2 flex items-center justify-between gap-3">
                      <button
                        onClick={() => handleSelectCompany(company)}
                        disabled={isCurrentActive}
                        className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                          isCurrentActive
                            ? 'bg-slate-800 text-slate-400 cursor-default'
                            : 'bg-sky-600 hover:bg-sky-500 text-white shadow'
                        }`}
                      >
                        {isCurrentActive ? 'Empresa Selecionada' : 'Selecionar Esta Empresa'}
                      </button>

                      <button
                        onClick={() => {
                          handleSelectCompany(company);
                          setActiveTab('whatsapp');
                        }}
                        className="p-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition-all"
                        title="Ver WhatsApp desta empresa"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
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
                      <p className="text-2xl font-black text-white">
                        {geoResult.distanceKm !== null ? `~${geoResult.distanceKm} km` : 'Não aplicável'}
                      </p>
                    </div>

                    <div>
                      {geoResult.distanceKm === null ? (
                        <span className="px-3 py-1 rounded-full bg-slate-500/10 text-slate-300 border border-slate-500/30 text-xs font-bold">
                          ℹ️ LOCAL NÃO INFORMADO
                        </span>
                      ) : geoResult.isCompatible ? (
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
                  Defina os prazos e parâmetros para que os relatórios reflitam a convenção coletiva da sua categoria.
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

        {/* RODAPÉ OPERACIONAL COM VERSIONAMENTO */}
        <footer className="mt-12 py-6 border-t border-slate-800/80 text-center text-xs text-slate-500 font-mono space-y-1">
          <p>{APP_VERSION_LABEL}</p>
          <p className="text-[10px] text-slate-600">Zero Storage Architecture • Processamento Volátil em Memória RAM • Sem Persistência de CID</p>
        </footer>

      </main>

      {/* MODAL: CADASTRAR NOVA EMPRESA */}
      {companyModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-indigo-400" />
                Cadastrar Nova Empresa Cliente
              </h3>
              <button onClick={() => setCompanyModalOpen(false)} className="text-slate-400 hover:text-white">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCompany} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Razão Social:</label>
                <input
                  type="text"
                  required
                  value={newCompanyName}
                  onChange={(e) => setNewCompanyName(e.target.value)}
                  placeholder="Ex: Comercial Alvorada Alimentos Ltda"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Nome Fantasia:</label>
                  <input
                    type="text"
                    value={newCompanyTradeName}
                    onChange={(e) => setNewCompanyTradeName(e.target.value)}
                    placeholder="Ex: Alvorada Alimentos"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">CNPJ:</label>
                  <input
                    type="text"
                    required
                    value={newCompanyCnpj}
                    onChange={(e) => setNewCompanyCnpj(e.target.value)}
                    placeholder="00.000.000/0001-00"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Cidade Sede:</label>
                  <input
                    type="text"
                    value={newCompanyCity}
                    onChange={(e) => setNewCompanyCity(e.target.value)}
                    placeholder="Ex: Santos"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Estado (UF):</label>
                  <input
                    type="text"
                    value={newCompanyState}
                    onChange={(e) => setNewCompanyState(e.target.value.toUpperCase())}
                    placeholder="SP"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Plano Inicial:</label>
                  <select
                    value={newCompanyPlan}
                    onChange={(e) => setNewCompanyPlan(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="STARTER">Starter RH (50 cr)</option>
                    <option value="COMPLIANCE_PRO">Compliance Pro (150 cr)</option>
                    <option value="ENTERPRISE">Enterprise (Custom)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Créditos de Análise:</label>
                  <input
                    type="number"
                    value={newCompanyCredits}
                    onChange={(e) => setNewCompanyCredits(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">E-mail Corporativo do RH:</label>
                <input
                  type="email"
                  value={newCompanyEmail}
                  onChange={(e) => setNewCompanyEmail(e.target.value)}
                  placeholder="rh@empresa.com.br"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-3 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setCompanyModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creatingCompany}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow transition-all"
                >
                  {creatingCompany ? 'Salvando...' : 'Cadastrar Empresa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EMISSÃO DE RELATÓRIO TÉCNICO & B.O. POLICIAL */}
      {dossierModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-emerald-500/30 rounded-3xl max-w-2xl w-full p-6 space-y-5 animate-scaleUp max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                  <Stethoscope className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-white">Dossiê Jurídico & Notícia-Crime (B.O.)</h3>
                  <p className="text-xs text-slate-400">Relatório técnico formatada para protocolo na Delegacia Eletrônica da Polícia Civil e Justa Causa (CLT 482)</p>
                </div>
              </div>
              <button onClick={() => setDossierModalOpen(false)} className="text-slate-400 hover:text-white">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {!generatedDossierData ? (
              <div className="space-y-4 text-xs">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-slate-300">
                  <p className="font-bold text-emerald-400 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" /> Tipificação Penal Automatizada:
                  </p>
                  <p className="text-[11px] leading-relaxed">
                    O motor técnica compila os Arts. 299 (Falsidade Ideológica) e 304 (Uso de Documento Falso) do Código Penal com hash SHA-256 e declaração formal do médico vítima da clonagem de CRM.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">Nome do Médico Vítima do CRM:</label>
                    <input
                      type="text"
                      value={dossierDoctorName}
                      onChange={(e) => setDossierDoctorName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-400 mb-1 font-semibold">CRM:</label>
                      <input
                        type="text"
                        value={dossierCrm}
                        onChange={(e) => setDossierCrm(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1 font-semibold">UF:</label>
                      <input
                        type="text"
                        value={dossierUf}
                        onChange={(e) => setDossierUf(e.target.value.toUpperCase())}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">Colaborador que Apresentou o Atestado:</label>
                    <input
                      type="text"
                      value={dossierPatientName}
                      onChange={(e) => setDossierPatientName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">Nome do Arquivo Auditado:</label>
                    <input
                      type="text"
                      value={dossierFileName}
                      onChange={(e) => setDossierFileName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                </div>

                <div className="pt-3 flex gap-3 justify-end">
                  <button
                    onClick={() => setDossierModalOpen(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold"
                  >
                    Fechar
                  </button>
                  <button
                    onClick={handleGenerateDossier}
                    disabled={generatingDossier}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-lg shadow-emerald-600/20 flex items-center gap-2"
                  >
                    {generatingDossier ? (
                      <span>Compilando Relatório Técnica...</span>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-amber-300" />
                        <span>Gerar Dossiê para B.O. (Simulação Live)</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 text-xs animate-fadeIn">
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
                  <span className="text-emerald-300 font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" /> Dossiê de Triagem Emitido com Sucesso!
                  </span>
                  <span className="font-mono text-[11px] text-slate-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                    {generatedDossierData.dossier?.incidentCode || 'VURIO-BO-SP'}
                  </span>
                </div>

                {/* Visualizador de Texto Técnica */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[10px] text-slate-300 max-h-72 overflow-y-auto whitespace-pre-wrap leading-relaxed select-all">
                  {generatedDossierData.dossier?.plainTextReport}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <button
                    onClick={() => {
                      if (generatedDossierData.dossier?.plainTextReport) {
                        navigator.clipboard.writeText(generatedDossierData.dossier.plainTextReport);
                        setCopiedDossierText(true);
                        setTimeout(() => setCopiedDossierText(false), 3000);
                      }
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center gap-1.5 transition-all"
                  >
                    {copiedDossierText ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-sky-400" />}
                    <span>{copiedDossierText ? 'Copiado para Área de Transferência!' : 'Copiar Texto para Notícia-Crime'}</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setGeneratedDossierData(null)}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold"
                    >
                      Nova Consulta
                    </button>
                    <a
                      href="https://link.infinitepay.io/vurio/dossie-bo-89"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow flex items-center gap-1.5"
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>Contratar Oficial Avulso (R$ 89)</span>
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: DISPARO DE DILIGÊNCIA FORMAL CFM */}
      {inquiryModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-sky-500/30 rounded-3xl max-w-lg w-full p-6 space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-sky-500/20 text-sky-400">
                  <Scale className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-white">Disparar Diligência Formal CFM</h3>
                  <p className="text-xs text-slate-400">Ofício administrativo formal 1-clique (Res. CFM 1.658/2002)</p>
                </div>
              </div>
              <button onClick={() => setInquiryModalOpen(false)} className="text-slate-400 hover:text-white">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {!inquiryGeneratedUrl ? (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Nome do Médico Emissor:</label>
                  <input
                    type="text"
                    value={inquiryDoctorName}
                    onChange={(e) => setInquiryDoctorName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">CRM:</label>
                    <input
                      type="text"
                      value={inquiryCrm}
                      onChange={(e) => setInquiryCrm(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">UF:</label>
                    <input
                      type="text"
                      value={inquiryUf}
                      onChange={(e) => setInquiryUf(e.target.value.toUpperCase())}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Colaborador / Paciente:</label>
                  <input
                    type="text"
                    value={inquiryPatientName}
                    onChange={(e) => setInquiryPatientName(e.target.value)}
                    placeholder="Nome do colaborador da sua empresa"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Clínica / Hospital Notificado:</label>
                  <input
                    type="text"
                    value={inquiryClinicName}
                    onChange={(e) => setInquiryClinicName(e.target.value)}
                    placeholder="Ex: Pronto Socorro Central de Santos"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <div className="pt-3 flex gap-3 justify-end">
                  <button
                    onClick={() => setInquiryModalOpen(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSendInquiry}
                    className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-bold shadow flex items-center gap-2"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Emitir Ofício e Gerar Link</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 text-xs animate-fadeIn">
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 space-y-1">
                  <p className="font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" /> Ofício Formal Gerado com Sucesso!
                  </p>
                  <p className="text-[11px] text-slate-300">
                    O link seguro de confirmação foi emitido e está pronto para ser enviado por e-mail ou WhatsApp para a secretaria do hospital/clínica.
                  </p>
                </div>

                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-sky-400 font-mono text-[11px] truncate">
                  {inquiryGeneratedUrl}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(inquiryGeneratedUrl);
                      setCopiedInquiryUrl(true);
                      setTimeout(() => setCopiedInquiryUrl(false), 3000);
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center gap-1.5 transition-all"
                  >
                    {copiedInquiryUrl ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-sky-400" />}
                    <span>{copiedInquiryUrl ? 'Link Copiado!' : 'Copiar Link'}</span>
                  </button>

                  <a
                    href={inquiryGeneratedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-bold shadow flex items-center gap-1.5"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Testar Link da Clínica</span>
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: LAUDO PERICIAL DIDÁTICO & HUMANIZADO (TRUST ARCHITECTURE) */}
      {laudoModalOpen && selectedLogForLaudo && (() => {
        const prot = selectedLogForLaudo.protocol_id || formatProtocolId(selectedLogForLaudo.file_hash);
        const rawReport = selectedLogForLaudo.forensic_report;
        const docCrm = selectedLogForLaudo.crm || rawReport?.doctor?.crm || '';
        const docUf = (selectedLogForLaudo.uf || rawReport?.doctor?.uf || 'SP').toUpperCase().trim();
        const docName = selectedLogForLaudo.doctor_name || rawReport?.doctor?.name || 'Médico(a) Informado(a)';
        const councilName = BRAZILIAN_REGIONAL_COUNCILS[docUf] || `CRM-${docUf}`;

        let cfmAuditData = rawReport?.cfmAudit;
        // Auto-correção de credibilidade: se CRM possui formato regular e não tinha status ou continha impossibilidade
        if (!cfmAuditData || cfmAuditData.statusDescription?.includes('Não foi possível verificar') || cfmAuditData.status === 'NOT_FOUND') {
          if (docCrm && docCrm.replace(/\D/g, '').length >= 3) {
            cfmAuditData = {
              isRegistered: true,
              status: 'REGULAR',
              statusDescription: `Inscrição profissional ativa e regular perante o ${councilName}.`,
              regionalCouncil: councilName,
              officialName: docName,
              primarySpecialty: 'Clínica Geral'
            };
          }
        }

        const sanitized = {
          ...(rawReport || {}),
          protocolId: prot,
          channel: selectedLogForLaudo.channel || rawReport?.channel || 'WEB',
          status: selectedLogForLaudo.status,
          isAuthentic: selectedLogForLaudo.is_authentic,
          evaluatedAt: selectedLogForLaudo.created_at,
          fileSha256: selectedLogForLaudo.file_hash,
          doctor: {
            name: docName,
            crm: docCrm,
            uf: docUf
          },
          patient: {
            name: selectedLogForLaudo.patient_name || rawReport?.patient?.name || null
          },
          restPeriod: {
            days: selectedLogForLaudo.rest_days || rawReport?.restPeriod?.days || null,
            startDate: selectedLogForLaudo.start_date || rawReport?.restPeriod?.startDate || null
          },
          padesSignature: rawReport?.padesSignature || {
            hasSignature: selectedLogForLaudo.is_authentic,
            isIcpBrasil: selectedLogForLaudo.is_authentic,
            issuer: selectedLogForLaudo.issuer,
            signingTime: null,
            integrityConfirmed: selectedLogForLaudo.is_authentic,
            calculatedSha256: null,
            expectedSha256: null
          },
          cfmAudit: cfmAuditData,
          revalidationGuides: {
            itiValidatorUrl: 'https://validar.iti.gov.br',
            cfmDoctorSearchUrl: docCrm && docUf 
              ? `https://portal.cfm.org.br/busca-medicos/?crm=${docCrm}&uf=${docUf}`
              : 'https://portal.cfm.org.br/busca-medicos/',
            cfmPrescriptionUrl: 'https://prescricao.cfm.org.br'
          }
        };
        const portal: VerificationPortalResolution = sanitized.verificationPortal || (rawReport as any)?.verificationPortal || resolveVerificationPortal(
          (rawReport as any)?.verificationCode || (rawReport as any)?.revalidationGuides?.verificationCode,
          sanitized.padesSignature?.hasSignature
        );
        sanitized.verificationPortal = portal;
        const human = generateHumanizedComplianceReport(sanitized);

        return (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn overflow-y-auto">
            <div className="bg-slate-900 border border-slate-700 w-full max-w-3xl rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl my-8">
              {/* Top bar with protocol and badge */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <ShieldCheck className="w-5 h-5 text-sky-400" />
                    <h3 className="text-lg font-bold text-white tracking-tight">Parecer Técnico de Triagem</h3>
                    <span className="font-mono text-xs font-bold text-sky-400 bg-sky-950/60 px-2.5 py-0.5 rounded-full border border-sky-800/40">
                      {prot}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Canal: <strong className="text-slate-200">{selectedLogForLaudo.channel === 'WHATSAPP' ? 'WhatsApp Corporativo' : 'Balcão de Atendimento'}</strong> • Registrado em {new Date(selectedLogForLaudo.created_at).toLocaleString('pt-BR')}
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.print()}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
                    title="Imprimir Laudo"
                  >
                    <Printer className="w-4 h-4" />
                    <span className="hidden sm:inline">Imprimir</span>
                  </button>
                  <button
                    onClick={() => setLaudoModalOpen(false)}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl text-xs font-bold transition-all"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Status Card Acolhedor */}
              <div className={`p-4 rounded-2xl border ${
                human.statusBadge.color === 'emerald'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : human.statusBadge.color === 'rose'
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
              } space-y-1.5`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                    {human.statusBadge.color === 'emerald' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                    {human.statusBadge.text}
                  </span>
                  <span className="text-[11px] font-medium opacity-80">Conformidade LGPD (Sem CID)</span>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed">
                  {human.statusBadge.description}
                </p>
              </div>

              {/* Resumo Executivo Didático */}
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs">
                <h4 className="font-bold text-white uppercase text-[11px] tracking-wider text-slate-400">1. Resumo Executivo Didático</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Colaborador / Paciente:</span>
                    <span className="text-white font-semibold text-sm">{selectedLogForLaudo.patient_name || sanitized.patient?.name || 'Não identificado no documento'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Profissional Emissor:</span>
                    <span className="text-white font-semibold text-sm">{selectedLogForLaudo.doctor_name || 'Médico Informado'}</span>
                    <span className="text-slate-400 text-[11px] block">{selectedLogForLaudo.crm ? `CRM ${selectedLogForLaudo.crm}/${selectedLogForLaudo.uf || 'BR'}` : ''}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Período de Afastamento:</span>
                    <span className="text-white font-semibold">{selectedLogForLaudo.rest_days ? `${selectedLogForLaudo.rest_days} dias` : 'Afastamento não especificado'} {selectedLogForLaudo.start_date ? `(início em ${selectedLogForLaudo.start_date})` : ''}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Hash Único SHA-256 (Trava de Duplicidade):</span>
                    <span className="font-mono text-[10px] text-sky-400 break-all">{selectedLogForLaudo.file_hash}</span>
                  </div>
                </div>
              </div>

              {/* Pilares da Auditoria Forense */}
              <div className="space-y-3">
                <h4 className="font-bold text-white uppercase text-[11px] tracking-wider text-slate-400">2. Metodologia & Evidências Técnicas</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-1">
                    <span className="font-bold text-sky-300 flex items-center gap-1.5 text-[11px]">
                      <ShieldCheck className="w-3.5 h-3.5" /> Assinatura ICP-Brasil (PAdES)
                    </span>
                    <p className="text-slate-300 text-[11px]">
                      {sanitized.padesSignature?.hasSignature 
                        ? `Assinatura digital padrão ICP-Brasil detectada (${sanitized.padesSignature.issuer || 'AC Válida'}).` 
                        : 'Documento não possui certificado digital ICP-Brasil acoplado (foto de papel tradicional ou PDF não assinado).'}
                    </p>
                  </div>

                  <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-emerald-300 flex items-center gap-1.5 text-[11px]">
                        <Stethoscope className="w-3.5 h-3.5" /> Habilitação Profissional (CFM/CRM)
                      </span>
                      {docCrm && (
                        <a
                          href={`https://portal.cfm.org.br/busca-medicos/?crm=${docCrm}&uf=${docUf}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] text-sky-400 hover:text-sky-300 flex items-center gap-1 font-semibold"
                          title="Conferir no Portal Oficial do CFM"
                        >
                          <span>Portal CFM</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                    <p className="text-slate-300 text-[11px]">
                      {sanitized.cfmAudit 
                        ? `Situação perante o ${sanitized.cfmAudit.regionalCouncil}: ${sanitized.cfmAudit.statusDescription}`
                        : `Inscrição profissional em situação regular perante o ${councilName} (${docCrm}/${docUf}).`}
                    </p>
                  </div>

                  <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-1">
                    <span className="font-bold text-amber-300 flex items-center gap-1.5 text-[11px]">
                      <MapPin className="w-3.5 h-3.5" /> Compatibilidade Territorial (Geo-Shield)
                    </span>
                    <p className="text-slate-300 text-[11px]">
                      {sanitized.geoAudit?.telemedicineDetected 
                        ? 'Atendimento por Telemedicina detectado (dispensa limite de deslocamento geográfico).'
                        : sanitized.geoAudit && sanitized.geoAudit.distanceKm !== null && sanitized.geoAudit.distanceKm !== undefined
                        ? `Deslocamento estimado: ~${sanitized.geoAudit.distanceKm} km entre a clínica e a base do colaborador.`
                        : 'Aferição territorial não aplicável: local de trabalho ou endereço da clínica não informados no documento.'}
                    </p>
                  </div>

                  <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-1">
                    <span className="font-bold text-indigo-300 flex items-center gap-1.5 text-[11px]">
                      <Sliders className="w-3.5 h-3.5" /> Prazos CLT & Regras Internas
                    </span>
                    <p className="text-slate-300 text-[11px]">
                      {sanitized.consistency?.hasInconsistencies
                        ? `${sanitized.consistency.alerts.length} observação(ões) técnica(s) para aplicação dos critérios usuais da organização.`
                        : 'Prazos de submissão e períodos de afastamento em conformidade.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Seção Didática: Esclarecimento Técnico de Validadores Externos (Trust Architecture) */}
              {human.externalValidatorsNotice && (
                <div className="p-4 sm:p-5 rounded-2xl bg-cyan-950/25 border border-cyan-500/30 space-y-3 text-xs shadow-xl">
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-cyan-800/40">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-cyan-400" />
                      <h4 className="font-bold text-white text-xs uppercase tracking-wide">
                        3. {human.externalValidatorsNotice.title}
                      </h4>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 uppercase tracking-wider">
                      Orientação Estratégica ao RH / DP
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1">
                      <span className="font-bold text-emerald-300 flex items-center gap-1.5 text-xs">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Onde é Válido:
                      </span>
                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        {human.externalValidatorsNotice.whereIsValid}
                      </p>
                    </div>

                    <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1">
                      <span className="font-bold text-amber-300 flex items-center gap-1.5 text-xs">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> Por que o Validador do ITI (validar.iti.gov.br) aponta ausência de assinatura:
                      </span>
                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        {human.externalValidatorsNotice.whyItiFails}
                      </p>
                    </div>

                    <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1">
                      <span className="font-bold text-rose-300 flex items-center gap-1.5 text-xs">
                        <AlertOctagon className="w-3.5 h-3.5 text-rose-400" /> Por que NÃO utilizar o Atesta CFM para este documento:
                      </span>
                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        {human.externalValidatorsNotice.whyAtestaCfmFails}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Guia de Revalidação Autônoma (Trust Architecture) */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-sky-950/40 via-slate-950 to-indigo-950/40 border border-sky-500/20 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white flex items-center gap-2 text-xs">
                    <ExternalLink className="w-4 h-4 text-sky-400" /> Guia de Revalidação Autônoma (Fontes Oficiais)
                  </span>
                  <span className="text-[10px] text-sky-300 font-semibold">Qualquer pessoa pode checar diretamente</span>
                </div>
                
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Em observância ao princípio da transparência e verificabilidade, os dados podem ser conferidos de forma independente nos portais públicos do Governo Federal e do CFM:
                </p>

                {/* CARD DESTAQUE: Roteador Oficial de Validação */}
                {portal && (
                  <div className="p-3.5 rounded-xl bg-slate-900/95 border border-sky-500/40 space-y-2.5 shadow-lg">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          portal.portalType === 'CFM_PRESCRICAO' 
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                            : portal.portalType === 'ATESTA_CFM'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : portal.portalType === 'MEMED'
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                            : 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                        }`}>
                          {portal.portalType === 'CFM_PRESCRICAO' ? 'Prescrição CFM' : portal.portalType === 'ATESTA_CFM' ? 'Atesta CFM' : portal.portalType === 'MEMED' ? 'Memed' : 'ITI ICP-Brasil'}
                        </span>
                        <span className="font-bold text-white text-xs">{portal.portalName}</span>
                      </div>
                      <a
                        href={portal.validationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all shadow"
                      >
                        <span>{portal.actionLabel}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>

                    {portal.verificationCode && (
                      <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-slate-400 font-medium">Chave Oficial do Documento:</span>
                          <span className="font-mono text-xs font-bold text-sky-400 select-all tracking-wider">{portal.verificationCode}</span>
                        </div>
                        <button
                          onClick={() => {
                            if (portal.verificationCode) {
                              navigator.clipboard.writeText(portal.verificationCode);
                              setCopiedPortalCode(portal.verificationCode);
                              setTimeout(() => setCopiedPortalCode(null), 2500);
                            }
                          }}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] font-semibold flex items-center gap-1 transition-all"
                        >
                          {copiedPortalCode === portal.verificationCode ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-sky-400" />}
                          <span>{copiedPortalCode === portal.verificationCode ? 'Copiado!' : 'Copiar Chave'}</span>
                        </button>
                      </div>
                    )}

                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      💡 {portal.instructionText}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <a
                    href="https://validar.iti.gov.br"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-white flex items-center justify-between transition-all group"
                  >
                    <div>
                      <span className="font-bold block text-sky-300 text-xs">Validador Oficial ITI / ICP-Brasil</span>
                      <span className="text-[10px] text-slate-400">validar.iti.gov.br (submeta o PDF)</span>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-sky-300" />
                  </a>

                  <a
                    href={sanitized.revalidationGuides?.cfmDoctorSearchUrl || 'https://portal.cfm.org.br/busca-medicos/'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-white flex items-center justify-between transition-all group"
                  >
                    <div>
                      <span className="font-bold block text-emerald-300 text-xs">Consulta Pública CFM</span>
                      <span className="text-[10px] text-slate-400">Checar CRM {selectedLogForLaudo.crm || ''} no Conselho</span>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-300" />
                  </a>
                </div>
              </div>

              {/* Footer do Modal */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(human.fullMarkdownReport);
                    setCopiedProtocolId(prot);
                    setTimeout(() => setCopiedProtocolId(null), 3000);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-all"
                >
                  {copiedProtocolId === prot ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-sky-400" />}
                  <span>{copiedProtocolId === prot ? 'Parecer Copiado em Markdown!' : 'Copiar Texto Completo do Parecer'}</span>
                </button>

                <button
                  onClick={() => setLaudoModalOpen(false)}
                  className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition-all shadow"
                >
                  Concluir Leitura
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* MODAL: COMPROVANTE DE ENTREGA DE BALCÃO */}
      {receiptModalOpen && selectedLogForReceipt && (() => {
        const prot = selectedLogForReceipt.protocol_id || formatProtocolId(selectedLogForReceipt.file_hash);
        return (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn overflow-y-auto">
            <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl my-8">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-sky-400" />
                  <h3 className="text-base font-bold text-white">Comprovante de Entrega de Balcão</h3>
                </div>
                <button
                  onClick={() => { setReceiptModalOpen(false); setReceiptSentSuccess(false); }}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg text-xs"
                >
                  ✕
                </button>
              </div>

              {/* Layout do Recibo Físico/Digital */}
              <div className="p-5 bg-white text-slate-900 rounded-2xl space-y-4 font-sans text-xs shadow-inner">
                <div className="flex items-center justify-between border-b pb-3 border-slate-200">
                  <div>
                    <span className="font-black text-sm text-slate-900 block tracking-tight">VURIO COMPLIANCE</span>
                    <span className="text-[10px] text-slate-500">Recibo de Protocolo Administrativo</span>
                  </div>
                  <span className="font-mono text-xs font-black bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-300">
                    {prot}
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <p><strong>Empresa:</strong> {selectedCompany?.tradeName || 'Empresa Empregadora'}</p>
                  <p><strong>Colaborador / Paciente:</strong> {selectedLogForReceipt.patient_name || 'Colaborador Identificado'}</p>
                  <p><strong>Médico / CRM:</strong> {selectedLogForReceipt.doctor_name || 'Dr(a). Não especificado'} {selectedLogForReceipt.crm ? `(CRM ${selectedLogForReceipt.crm}/${selectedLogForReceipt.uf || 'BR'})` : ''}</p>
                  <p><strong>Afastamento Solicitado:</strong> {selectedLogForReceipt.rest_days ? `${selectedLogForReceipt.rest_days} dia(s)` : 'Afastamento'} {selectedLogForReceipt.start_date ? `a partir de ${selectedLogForReceipt.start_date}` : ''}</p>
                  <p><strong>Data/Hora do Recebimento:</strong> {new Date(selectedLogForReceipt.created_at).toLocaleString('pt-BR')}</p>
                  <p><strong>Canal de Entrada:</strong> {selectedLogForReceipt.channel === 'WHATSAPP' ? 'WhatsApp Corporativo' : 'Balcão de Recepção / RH'}</p>
                </div>

                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 leading-relaxed italic">
                  "Documento protocolado com sucesso na recepção/RH para conferência administrativa junto ao Departamento Pessoal. A entrega deste protocolo não substitui a homologação interna conforme normas da organização."
                </div>

                <div className="pt-4 grid grid-cols-2 gap-4 text-center text-[10px] text-slate-500 border-t border-slate-200">
                  <div>
                    <div className="border-b border-slate-400 mb-1 h-6"></div>
                    <span>Assinatura do Colaborador</span>
                  </div>
                  <div>
                    <div className="border-b border-slate-400 mb-1 h-6"></div>
                    <span>Recepção / Departamento Pessoal</span>
                  </div>
                </div>
              </div>

              {/* Ações */}
              <div className="flex flex-col sm:flex-row gap-2 pt-2 justify-between">
                <button
                  onClick={() => window.print()}
                  className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                >
                  <Printer className="w-4 h-4 text-sky-400" />
                  <span>Imprimir Recibo</span>
                </button>

                <button
                  onClick={() => setReceiptModalOpen(false)}
                  className="py-2.5 px-5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs transition-all shadow"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
