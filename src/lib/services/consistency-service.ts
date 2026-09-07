/**
 * Vurio - Motor de Auditoria Forense e Detecção de Inconsistências
 * Realiza checagem cronológica (datas futuras/anacronismos), validação documental de CPF e limites legais da CLT/INSS.
 */

export type InconsistencySeverity = 'CRITICAL' | 'WARNING' | 'INFO';

export interface InconsistencyAlert {
  code:
    | 'FUTURE_EMISSION_DATE'
    | 'FUTURE_START_DATE'
    | 'RETROACTIVE_SUBMISSION'
    | 'INVALID_PATIENT_CPF'
    | 'INSS_REFERRAL_REQUIRED'
    | 'SUSPICIOUS_DURATION_CID'
    | 'PATIENT_NAME_MISSING';
  severity: InconsistencySeverity;
  title: string;
  description: string;
  recommendation: string;
}

export interface ConsistencyAuditInput {
  emissionDate?: string | Date | null;
  startDate?: string | Date | null;
  days?: number | null;
  patientName?: string | null;
  patientCpf?: string | null;
  cid?: string | null;
  referenceDate?: Date; // Data da submissão (padrão: hoje)
  maxRetroactiveDays?: number; // Configuração da empresa (ex: 2 para 48h, 3 para 72h)
}

export interface ConsistencyAuditResult {
  hasInconsistencies: boolean;
  criticalCount: number;
  warningCount: number;
  alerts: InconsistencyAlert[];
  patientCpfValid: boolean | null; // null se não informado
  isFutureDate: boolean;
  isInssRequired: boolean;
}

/**
 * Valida o CPF através do algoritmo oficial Módulo 11 da Receita Federal
 */
export function isValidBrazilianCpf(rawCpf: string): boolean {
  const cleanCpf = rawCpf.replace(/\D/g, '');

  if (cleanCpf.length !== 11) return false;
  // Rejeita sequências de números repetidos (ex: 111.111.111-11)
  if (/^(\d)\1{10}$/.test(cleanCpf)) return false;

  // Primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCpf.charAt(i), 10) * (10 - i);
  }
  let rev = 11 - (sum % 11);
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== parseInt(cleanCpf.charAt(9), 10)) return false;

  // Segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCpf.charAt(i), 10) * (11 - i);
  }
  rev = 11 - (sum % 11);
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== parseInt(cleanCpf.charAt(10), 10)) return false;

  return true;
}

/**
 * Converte strings de data brasileiras (DD/MM/AAAA) ou ISO para objeto Date normalizado (zero horas)
 */
function parseDateSafe(dateInput?: string | Date | null): Date | null {
  if (!dateInput) return null;
  if (dateInput instanceof Date) {
    const d = new Date(dateInput);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  const str = String(dateInput).trim();
  // Formato brasileiro: DD/MM/YYYY
  const brMatch = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (brMatch) {
    const day = parseInt(brMatch[1], 10);
    const month = parseInt(brMatch[2], 10) - 1;
    const year = parseInt(brMatch[3], 10);
    const d = new Date(year, month, day);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    parsed.setHours(0, 0, 0, 0);
    return parsed;
  }

  return null;
}

/**
 * Formata data no padrão brasileiro DD/MM/AAAA
 */
function formatBrDate(date: Date): string {
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
}

/**
 * Executa a auditoria de consistência forense e regras de negócio
 */
export function auditAttestationConsistency(
  input: ConsistencyAuditInput
): ConsistencyAuditResult {
  const alerts: InconsistencyAlert[] = [];
  const refDate = input.referenceDate ? new Date(input.referenceDate) : new Date();
  refDate.setHours(0, 0, 0, 0);

  const refDateStr = formatBrDate(refDate);

  // 1. Auditoria Cronológica de Emissão (Data Posterior / Anacronismo)
  let isFuture = false;
  const emissionDate = parseDateSafe(input.emissionDate);
  const startDate = parseDateSafe(input.startDate);

  if (emissionDate) {
    const emissionDateStr = formatBrDate(emissionDate);
    // Se a data de emissão for posterior a hoje
    if (emissionDate.getTime() > refDate.getTime()) {
      isFuture = true;
      alerts.push({
        code: 'FUTURE_EMISSION_DATE',
        severity: 'WARNING',
        title: 'Apontamento Cronológico: Emissão com Data Posterior',
        description: `O documento registra data de emissão em ${emissionDateStr}, posterior ao dia da análise documental (${refDateStr}).`,
        recommendation: 'Recomenda-se consultar o colaborador ou a clínica emissora para averiguação de eventual erro material de preenchimento ou digitação da data.'
      });
    }
  }

  // 2. Auditoria do Início do Afastamento
  if (startDate && !isFuture) {
    const startDateStr = formatBrDate(startDate);
    // Se o início do repouso for mais de 1 dia no futuro sem procedimento programado
    const diffDays = Math.round((startDate.getTime() - refDate.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays > 1) {
      alerts.push({
        code: 'FUTURE_START_DATE',
        severity: 'INFO',
        title: 'Início de Afastamento com Previsão Futura',
        description: `O período de repouso está assinalado para iniciar em ${startDateStr} (${diffDays} dias à frente da data atual).`,
        recommendation: 'Verificar junto ao colaborador se há programação de procedimento cirúrgico, exame preparatório ou atendimento médico previamente agendado.'
      });
    }
  }

  // 3. Auditoria de Apresentação Retroativa Conforme Política da Empresa
  const allowedDays = input.maxRetroactiveDays && input.maxRetroactiveDays > 0 ? input.maxRetroactiveDays : 3;
  if (emissionDate && emissionDate.getTime() < refDate.getTime()) {
    const elapsedDays = Math.round((refDate.getTime() - emissionDate.getTime()) / (1000 * 60 * 60 * 24));
    if (elapsedDays > allowedDays) {
      alerts.push({
        code: 'RETROACTIVE_SUBMISSION',
        severity: 'INFO',
        title: 'Submissão Posterior ao Prazo da Política Interna',
        description: `Documento apresentado ${elapsedDays} dias após a data da consulta (parâmetro de referência da organização: até ${allowedDays} dias / ${allowedDays * 24}h).`,
        recommendation: 'Verificar com o colaborador a ocorrência de eventual justificativa plausível de saúde ou aplicar os critérios usuais de tolerância da empresa.'
      });
    }
  }

  // 4. Conferência Técnica do CPF do Paciente
  let patientCpfValid: boolean | null = null;
  if (input.patientCpf) {
    const raw = String(input.patientCpf).trim();
    const isMasked = raw.includes('*') || raw.includes('x') || raw.includes('X');
    
    // Se estiver mascarado para proteção LGPD (ex: ***.456.789-**), não trata como divergência
    if (!isMasked && raw.replace(/\D/g, '').length === 11) {
      patientCpfValid = isValidBrazilianCpf(raw);
      if (!patientCpfValid) {
        alerts.push({
          code: 'INVALID_PATIENT_CPF',
          severity: 'INFO',
          title: 'Divergência de Dígitos no CPF Registrado',
          description: `A numeração de CPF indicada (${raw}) diverge da conferência algorítmica de dígitos verificadores.`,
          recommendation: 'Recomenda-se confirmar a grafia do dado cadastral junto ao colaborador para sanar eventual equívoco de digitação ou transcrição pelo estabelecimento de saúde antes do lançamento.'
        });
      }
    }
  }

  // 5. Auditoria de Limite Legal da CLT e Previdência (> 15 dias)
  let isInssRequired = false;
  if (input.days && input.days > 15) {
    isInssRequired = true;
    alerts.push({
      code: 'INSS_REFERRAL_REQUIRED',
      severity: 'INFO',
      title: 'Afastamento Superior a 15 Dias (Encaminhamento Previdenciário)',
      description: `Período prescrito de ${input.days} dias. A empresa arca com os primeiros 15 dias consecutivos de licença.`,
      recommendation: 'A partir do 16º dia consecutivo, orientar o colaborador quanto ao agendamento de perícia médica junto ao INSS para concessão do benefício previdenciário (Arts. 59 e 60 da Lei 8.213/91).'
    });
  }

  const criticalCount = alerts.filter(a => a.severity === 'CRITICAL').length;
  const warningCount = alerts.filter(a => a.severity === 'WARNING').length;

  return {
    hasInconsistencies: alerts.length > 0,
    criticalCount,
    warningCount,
    alerts,
    patientCpfValid,
    isFutureDate: isFuture,
    isInssRequired
  };
}
