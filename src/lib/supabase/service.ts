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
export async function saveValidationLog(
  companyId: string,
  report: AttestationValidationReport,
  fileName?: string,
  executionTimeMs?: number
) {
  const logEntry = {
    company_id: companyId,
    file_hash: report.fileSha256,
    file_name: fileName || 'atestado_recebido',
    status: report.status,
    is_authentic: report.isAuthentic,
    doctor_name: report.doctor.name,
    doctor_cpf: report.doctor.cpf,
    crm: report.doctor.crm,
    uf: report.doctor.uf,
    issuer: report.signature.issuer,
    rest_days: report.restPeriod?.days || null,
    start_date: report.restPeriod?.startDate || null,
    calculated_sha256: report.signature.calculatedSha256,
    expected_sha256: report.signature.expectedSha256,
    qr_code_url: report.qrCode?.qrData || null,
    execution_time_ms: executionTimeMs || 0,
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
      console.error('Erro ao salvar log no Supabase:', error);
      inMemoryLogs.unshift(logEntry);
      return logEntry;
    }

    return data;
  } catch (err) {
    console.error('Exceção ao salvar log no Supabase:', err);
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
