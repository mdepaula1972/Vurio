import { supabase, isSupabaseConfigured } from './client';
import { AttestationValidationReport } from '../crypto/validator';

// Fallback em memória para desenvolvimento e testes locais
const inMemoryLogs: any[] = [];
const inMemoryCompanies: Record<string, any> = {
  'demo-company': {
    id: 'demo-company-1',
    trade_name: 'Empresa Demonstração RH',
    plan: 'PRO',
    credits_balance: 100,
    created_at: new Date().toISOString()
  }
};

/**
 * Busca hashes de arquivos já analisados para verificar duplicidade
 */
export async function getCompanyDocumentHashes(companyId: string): Promise<string[]> {
  if (!isSupabaseConfigured || !supabase) {
    return inMemoryLogs.filter(l => l.company_id === companyId).map(l => l.file_hash);
  }

  try {
    const { data, error } = await supabase
      .from('validation_logs')
      .select('file_hash')
      .eq('company_id', companyId);

    if (error || !data) return [];
    return data.map(row => row.file_hash);
  } catch {
    return [];
  }
}

/**
 * Registra o log da validação realizada em conformidade com a LGPD
 */
/**
 * Extrai formato neutro ou extensão do arquivo (ex.: "pdf", "jpg"),
 * sem armazenar a nomenclatura original recebida em observância
 * à minimização de dados.
 */
function extractNeutralFileFormat(fileName?: string): string {
  if (!fileName) return 'pdf';
  const parts = fileName.split('.');
  if (parts.length > 1) {
    const ext = parts.pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || '';
    if (ext) return ext;
  }
  return 'documento';
}

export interface SaveValidationLogParams {
  companyId: string;
  report: AttestationValidationReport;
  fileName?: string;
  executionTimeMs?: number;
  protocolId?: string;
  channel?: 'WHATSAPP' | 'WEB';
  senderPhone?: string | null;
  patientName?: string | null;
  forensicReport?: any;
}

export async function saveValidationLog(
  companyIdOrParams: string | SaveValidationLogParams,
  legacyReport?: AttestationValidationReport,
  legacyFileName?: string,
  legacyExecutionTimeMs?: number
) {
  const { formatProtocolId, buildForensicReport } = require('../services/compliance-report-service');

  const params: SaveValidationLogParams = typeof companyIdOrParams === 'string'
    ? {
        companyId: companyIdOrParams,
        report: legacyReport!,
        fileName: legacyFileName,
        executionTimeMs: legacyExecutionTimeMs,
        protocolId: formatProtocolId(legacyReport?.fileSha256),
        channel: 'WEB',
        patientName: legacyReport?.patient?.name || null
      }
    : companyIdOrParams;

  const protocolId = params.protocolId || formatProtocolId(params.report.fileSha256);
  const channel = params.channel || 'WEB';
  const forensicReport = params.forensicReport || buildForensicReport(params.report, protocolId, channel);

  const logEntry = {
    id: 'log-' + Math.random().toString(36).substring(2, 10),
    company_id: params.companyId,
    protocol_id: protocolId,
    channel,
    sender_phone: params.senderPhone || null,
    patient_name: params.patientName || params.report.patient?.name || null,
    file_hash: params.report.fileSha256,
    file_name: extractNeutralFileFormat(params.fileName),
    status: params.report.status,
    is_authentic: params.report.isAuthentic,
    doctor_name: params.report.doctor.name,
    doctor_cpf: null, // Minimização de dados LGPD: não grava CPF do médico
    crm: params.report.doctor.crm,
    uf: params.report.doctor.uf,
    issuer: params.report.signature.issuer,
    rest_days: params.report.restPeriod?.days || null,
    start_date: params.report.restPeriod?.startDate || null,
    calculated_sha256: params.report.signature.calculatedSha256,
    expected_sha256: params.report.signature.expectedSha256,
    qr_code_url: params.report.qrCode?.qrData || null,
    execution_time_ms: params.executionTimeMs || 0,
    forensic_report: forensicReport,
    created_at: new Date().toISOString()
  };

  if (!isSupabaseConfigured || !supabase) {
    inMemoryLogs.unshift(logEntry);
    return logEntry;
  }

  try {
    const { data, error } = await supabase
      .from('validation_logs')
      .insert(logEntry)
      .select()
      .single();

    if (error) {
      console.error('Erro ao salvar log no Supabase:', (error as any)?.message || 'Falha de gravação');
      inMemoryLogs.unshift(logEntry);
      return logEntry;
    }

    return data;
  } catch (err) {
    console.error('Exceção ao salvar log no Supabase:', (err as any)?.message || 'Erro inesperado');
    inMemoryLogs.unshift(logEntry);
    return logEntry;
  }
}

/**
 * Debita 1 crédito da empresa cliente após o processamento
 */
export async function deductCredit(companyId: string): Promise<number | null> {
  if (!isSupabaseConfigured || !supabase) {
    if (inMemoryCompanies['demo-company']) {
      inMemoryCompanies['demo-company'].credits_balance = Math.max(0, inMemoryCompanies['demo-company'].credits_balance - 1);
      return inMemoryCompanies['demo-company'].credits_balance;
    }
    return 99;
  }

  try {
    const { data: company, error: fetchErr } = await supabase
      .from('companies')
      .select('credits_balance')
      .eq('id', companyId)
      .single();

    if (fetchErr || !company) return null;

    const newBalance = Math.max(0, (company.credits_balance || 0) - 1);

    await supabase
      .from('companies')
      .update({ credits_balance: newBalance })
      .eq('id', companyId);

    return newBalance;
  } catch {
    return null;
  }
}

/**
 * Retorna os logs recentes para exibição no dashboard da PME
 */
export async function getRecentValidationLogs(companyId?: string) {
  if (!isSupabaseConfigured || !supabase) {
    return inMemoryLogs.slice(0, 50);
  }

  try {
    let query = supabase
      .from('validation_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (companyId) {
      query = query.eq('company_id', companyId);
    }

    const { data, error } = await query;
    if (error || !data) return inMemoryLogs.slice(0, 50);
    return data;
  } catch {
    return inMemoryLogs.slice(0, 50);
  }
}
