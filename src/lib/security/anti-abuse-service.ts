/**
 * Vurio - Módulo de Defesa Anti-Abuso e Blindagem de Trials Corporativos
 * Impede que aproveitadores utilizem e-mails descartáveis, CNPJs fictícios,
 * números de WhatsApp repetidos ou reauditem os mesmos atestados médicos de graça.
 */

// Lista exaustiva de provedores públicos/gratuitos (B2B exige domínio institucional próprio)
const PUBLIC_EMAIL_PROVIDERS = new Set([
  'gmail.com', 'googlemail.com',
  'hotmail.com', 'hotmail.com.br',
  'outlook.com', 'outlook.com.br',
  'live.com', 'msn.com',
  'yahoo.com', 'yahoo.com.br',
  'icloud.com', 'me.com', 'mac.com',
  'bol.com.br', 'uol.com.br', 'zipmail.com.br',
  'terra.com.br', 'ig.com.br', 'globo.com', 'globomail.com',
  'oi.com.br', 'r7.com', 'mail.com', 'proton.me', 'protonmail.com',
  'zoho.com', 'yandex.com', 'aol.com'
]);

// Lista de provedores descartáveis / temporários (TrashMail / Disposable)
const DISPOSABLE_EMAIL_PATTERNS = [
  'tempmail', 'guerrillamail', 'mailinator', '10minutemail',
  'throwaway', 'sharklasers', 'dispostable', 'fakeinbox',
  'yopmail', 'burnermail', 'trashmail', 'mohmal', 'getnada',
  'maildrop', '1secmail', 'crazymailing', 'generator'
];

export interface TrialRegistrationCheck {
  email: string;
  cnpj?: string;
  phone: string;
  companyName: string;
  ipAddress?: string;
}

// Registro histórico persistente em memória (sincronizável com banco de dados)
interface TrialHistoryRecord {
  id: string;
  email: string;
  emailDomain: string;
  cleanCnpj?: string;
  rootCnpj?: string; // Primeiros 8 dígitos do CNPJ (impede fraude de filiais)
  cleanPhone: string;
  ipAddress?: string;
  createdAt: number;
}

// Histórico de auditorias por Hash SHA-256 para impedir reanálise de documentos em trial
interface DocumentAuditHistory {
  fileHash: string;
  companyId: string;
  registeredAt: number;
}

const trialHistory: TrialHistoryRecord[] = [];
const documentAuditRegistry: DocumentAuditHistory[] = [];
const ipAttempts: Map<string, number[]> = new Map();

/**
 * Valida se o e-mail fornecido é um e-mail corporativo autêntico com domínio institucional
 */
export function validateCorporateEmail(email: string): { isValid: boolean; domain: string; reason?: string } {
  if (!email || !email.includes('@')) {
    return { isValid: false, domain: '', reason: 'Endereço de e-mail inválido.' };
  }

  const cleanEmail = email.trim().toLowerCase();
  const parts = cleanEmail.split('@');
  if (parts.length !== 2) {
    return { isValid: false, domain: '', reason: 'Formato de e-mail incorreto.' };
  }

  const domain = parts[1];

  // 1. Rejeita provedores pessoais gratuitos
  if (PUBLIC_EMAIL_PROVIDERS.has(domain)) {
    return {
      isValid: false,
      domain,
      reason: `O Vurio é uma solução corporativa B2B. E-mails genéricos (@${domain}) não são permitidos para ativação de testes. Por favor, use seu e-mail corporativo institucional (@suaempresa.com.br).`
    };
  }

  // 2. Rejeita provedores descartáveis / temporários
  const isDisposable = DISPOSABLE_EMAIL_PATTERNS.some(p => domain.includes(p));
  if (isDisposable) {
    return {
      isValid: false,
      domain,
      reason: 'E-mails temporários ou descartáveis não são aceitos para ativação do piloto corporativo.'
    };
  }

  // 3. Validação de estrutura de domínio (exige TLD válido)
  if (!domain.includes('.') || domain.endsWith('.')) {
    return { isValid: false, domain, reason: 'Domínio de e-mail corporativo inválido.' };
  }

  return { isValid: true, domain };
}

/**
 * Valida o algoritmo de dígitos verificadores do CNPJ brasileiro oficial
 */
export function validateCnpj(cnpj: string): { isValid: boolean; cleanCnpj: string; rootCnpj: string; reason?: string } {
  const clean = cnpj.replace(/\D/g, '');

  if (clean.length !== 14) {
    return { isValid: false, cleanCnpj: clean, rootCnpj: '', reason: 'CNPJ deve conter exatamente 14 dígitos numéricos.' };
  }

  // Rejeita sequências de dígitos idênticos (00000000000000, 11111111111111, etc.)
  if (/^(\d)\1+$/.test(clean)) {
    return { isValid: false, cleanCnpj: clean, rootCnpj: '', reason: 'CNPJ inválido (dígitos repetidos).' };
  }

  const weights = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  // Validação do 1º Dígito Verificador
  let sum1 = 0;
  for (let i = 0; i < 12; i++) {
    sum1 += parseInt(clean[i], 10) * weights[i + 1];
  }
  const digit1 = sum1 % 11 < 2 ? 0 : 11 - (sum1 % 11);
  if (digit1 !== parseInt(clean[12], 10)) {
    return { isValid: false, cleanCnpj: clean, rootCnpj: '', reason: 'Dígito verificador do CNPJ inválido.' };
  }

  // Validação do 2º Dígito Verificador
  let sum2 = 0;
  for (let i = 0; i < 13; i++) {
    sum2 += parseInt(clean[i], 10) * weights[i];
  }
  const digit2 = sum2 % 11 < 2 ? 0 : 11 - (sum2 % 11);
  if (digit2 !== parseInt(clean[13], 10)) {
    return { isValid: false, cleanCnpj: clean, rootCnpj: '', reason: 'Dígito verificador do CNPJ inválido.' };
  }

  // Raiz do CNPJ: primeiros 8 dígitos (identifica a matriz e todas as filiais da mesma empresa)
  const rootCnpj = clean.slice(0, 8);

  return { isValid: true, cleanCnpj: clean, rootCnpj };
}

/**
 * Checa rate-limiting por IP (máximo 3 solicitações de trial a cada 24 horas por endereço IP)
 */
export function checkIpRateLimit(ip: string): boolean {
  if (!ip || ip === '127.0.0.1' || ip === '::1') return true;
  const now = Date.now();
  const dayAgo = now - 24 * 60 * 60 * 1000;

  const timestamps = (ipAttempts.get(ip) || []).filter(t => t > dayAgo);
  if (timestamps.length >= 3) {
    return false;
  }

  timestamps.push(now);
  ipAttempts.set(ip, timestamps);
  return true;
}

/**
 * Blindagem completa anti-fraude para cadastros de Trial
 */
export async function verifyTrialEligibility(data: TrialRegistrationCheck): Promise<{
  allowed: boolean;
  reason?: string;
  cleanCnpj?: string;
  rootCnpj?: string;
}> {
  // 1. Validação de E-mail Corporativo
  const emailCheck = validateCorporateEmail(data.email);
  if (!emailCheck.isValid) {
    return { allowed: false, reason: emailCheck.reason };
  }

  // 2. Validação do Telefone (mínimo 10 dígitos, DDI + DDD)
  const cleanPhone = data.phone.replace(/\D/g, '');
  if (cleanPhone.length < 10 || cleanPhone.length > 13) {
    return { allowed: false, reason: 'Número de WhatsApp corporativo inválido. Informe DDD + Telefone.' };
  }

  // 3. Validação de CNPJ (se informado)
  let cleanCnpj = '';
  let rootCnpj = '';
  if (data.cnpj && data.cnpj.trim()) {
    const cnpjCheck = validateCnpj(data.cnpj);
    if (!cnpjCheck.isValid) {
      return { allowed: false, reason: cnpjCheck.reason };
    }
    cleanCnpj = cnpjCheck.cleanCnpj;
    rootCnpj = cnpjCheck.rootCnpj;
  }

  // 4. Rate-Limit por IP
  if (data.ipAddress && !checkIpRateLimit(data.ipAddress)) {
    return {
      allowed: false,
      reason: 'Limite de solicitações de teste excedido para sua rede de internet. Entre em contato pelo suporte corporativo.'
    };
  }

  // 5. Checagem de Unicidade de E-mail
  const emailExists = trialHistory.some(r => r.email === data.email.trim().toLowerCase());
  if (emailExists) {
    return {
      allowed: false,
      reason: 'Este e-mail corporativo já utilizou o período de 15 consultas gratuitas. Acesse seu painel no Vurio ou contrate um plano para continuar utilizando.'
    };
  }

  // 6. Checagem de Unicidade de WhatsApp
  const phoneExists = trialHistory.some(r => r.cleanPhone === cleanPhone);
  if (phoneExists) {
    return {
      allowed: false,
      reason: 'Este número de WhatsApp já ativou as consultas gratuitas em nosso sistema.'
    };
  }

  // 7. Checagem de Unicidade por Raiz de CNPJ (Bloqueia filiais tentando criar múltiplos trials)
  if (rootCnpj) {
    const rootCnpjExists = trialHistory.some(r => r.rootCnpj === rootCnpj);
    if (rootCnpjExists) {
      return {
        allowed: false,
        reason: 'O grupo empresarial vinculado a este CNPJ (matriz ou filial) já ativou as 15 consultas gratuitas. Para adicionar mais colaboradores ou filiais, faça o upgrade da conta.'
      };
    }
  }

  return { allowed: true, cleanCnpj, rootCnpj };
}

/**
 * Registra a concessão do trial para impedir abusos futuros
 */
export function recordTrialGrant(data: {
  email: string;
  cnpj?: string;
  phone: string;
  ipAddress?: string;
}) {
  const cleanPhone = data.phone.replace(/\D/g, '');
  const cleanCnpj = data.cnpj ? data.cnpj.replace(/\D/g, '') : undefined;
  const rootCnpj = cleanCnpj && cleanCnpj.length === 14 ? cleanCnpj.slice(0, 8) : undefined;
  const parts = data.email.trim().toLowerCase().split('@');
  const emailDomain = parts[1] || '';

  trialHistory.push({
    id: 'trial-grant-' + Date.now(),
    email: data.email.trim().toLowerCase(),
    emailDomain,
    cleanCnpj,
    rootCnpj,
    cleanPhone,
    ipAddress: data.ipAddress,
    createdAt: Date.now()
  });
}

/**
 * Trava Forense por Hash SHA-256 de Documento:
 * Impede que aproveitadores utilizem contas diferentes para auditar repetidamente o mesmo atestado médico.
 */
export function checkDocumentTrialHash(fileHash: string, companyId: string): {
  isDuplicate: boolean;
  reason?: string;
} {
  if (!fileHash) return { isDuplicate: false };

  const existing = documentAuditRegistry.find(d => d.fileHash.toLowerCase() === fileHash.toLowerCase());
  if (existing && existing.companyId !== companyId) {
    return {
      isDuplicate: true,
      reason: 'Este mesmo atestado médico já foi auditado em outro período de testes corporativos. Documentos já analisados requerem assinatura ativa para nova emissão de laudo.'
    };
  }

  if (!existing) {
    documentAuditRegistry.push({
      fileHash: fileHash.toLowerCase(),
      companyId,
      registeredAt: Date.now()
    });
  }

  return { isDuplicate: false };
}
