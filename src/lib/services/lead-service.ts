import { supabase, isSupabaseConfigured } from '../supabase/client';

/**
 * Conexão do banco para leads e placar:
 * Considera conectado SOMENTE se existirem NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY
 * (sem aceitar chave anônima como alternativa).
 */
export function isLeadDatabaseConnected(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  return Boolean(
    url && 
    serviceKey && 
    !url.includes('placeholder') && 
    isSupabaseConfigured && 
    supabase
  );
}

/**
 * ==============================================================================
 * SERVIÇO DE GESTÃO DE LEADS & PLACAR VURIO (LGPD COMPLIANT)
 * ==============================================================================
 * FINALIDADE LGPD:
 * Medição estrita de interesse comercial e performance de anúncios do Vurio
 * direcionados a RHs e Departamentos Pessoais.
 * 
 * POLÍTICA DE PRIVACIDADE E MINIMIZAÇÃO:
 * - Não armazena mídia, imagens ou anexos de leads.
 * - Registra apenas metadados mínimos: telefone, ref, datas e contagem de mensagens.
 * - Suporta Opt-out imediato ('sair' ou 'parar').
 * ==============================================================================
 */

// Prazo de retenção sob diretriz do controlador (em dias)
export const LEAD_RETENTION_DAYS = 90;

export interface LeadRecord {
  id?: string;
  phone: string;
  ref: string | null;
  first_message_text: string;
  first_message_at: string;
  last_message_at: string;
  message_count: number;
  last_auto_reply_at?: string | null;
  opt_out: boolean;
}

// Mensagem oficial padronizada para resposta ao lead (sem promessa de teste grátis nem link)
export const LEAD_GREETING_MESSAGE = 
  "Olá! Aqui é o Marcos, do Vurio. Obrigado pelo interesse! O Vurio recebe os atestados médicos pelo WhatsApp da empresa e sinaliza indícios de divergência para revisão do RH. Para eu te responder melhor: quantos funcionários a sua empresa tem?";

// Armazenamento em memória exclusivo para testes locais automatizados (NODE_ENV === 'test')
const inMemoryTestLeads: Map<string, LeadRecord> = new Map();
const inMemoryTestProcessedMessages: Set<string> = new Set();

/**
 * Normaliza número de telefone brasileiro para padrão canônico de comparação:
 * - Apenas dígitos
 * - Remove 0 inicial
 * - Garante DDI 55
 */
export function normalizePhone(rawPhone: string): string {
  if (!rawPhone) return '';
  let digits = rawPhone.replace(/\D/g, '');
  if (digits.startsWith('0')) digits = digits.slice(1);
  if ((digits.length === 10 || digits.length === 11) && !digits.startsWith('55')) {
    digits = '55' + digits;
  }
  return digits;
}

/**
 * Compara dois números de telefone brasileiros com tolerância:
 * - Com ou sem DDI 55
 * - Com ou sem nono dígito (compara DDD + 8 dígitos finais)
 * - Com ou sem caracteres de pontuação
 */
export function isSameBrazilianPhone(phoneA: string, phoneB: string): boolean {
  const normA = normalizePhone(phoneA);
  const normB = normalizePhone(phoneB);
  if (!normA || !normB) return false;
  if (normA === normB) return true;

  const matchA = normA.match(/^(?:55)?(\d{2})(\d{8,9})$/);
  const matchB = normB.match(/^(?:55)?(\d{2})(\d{8,9})$/);

  if (matchA && matchB) {
    const dddA = matchA[1];
    const numA = matchA[2];
    const dddB = matchB[1];
    const numB = matchB[2];

    if (dddA === dddB) {
      return numA.slice(-8) === numB.slice(-8);
    }
  }

  return false;
}

/**
 * Cache LRU em memória para deduplicação instantânea de webhooks (TTL: 30 minutos)
 */
const recentMessageIds = new Map<string, number>();

/**
 * Verifica se a mensagem de webhook recebida já foi processada anteriormente.
 * Proteção contra reenvios duplicados do provedor de WhatsApp que inflariam o message_count.
 */
export async function isDuplicateMessage(messageId: string, phone: string): Promise<boolean> {
  if (!messageId) return false;

  const now = Date.now();

  // Limpeza de cache volátil (mensagens com mais de 30 minutos)
  for (const [id, timestamp] of recentMessageIds.entries()) {
    if (now - timestamp > 30 * 60 * 1000) {
      recentMessageIds.delete(id);
    }
  }

  if (recentMessageIds.has(messageId)) {
    return true;
  }
  recentMessageIds.set(messageId, now);

  // Se em ambiente de teste local isolado
  if (process.env.NODE_ENV === 'test') {
    if (inMemoryTestProcessedMessages.has(messageId)) {
      return true;
    }
    inMemoryTestProcessedMessages.add(messageId);
    return false;
  }

  // Deduplicação persistente no Supabase
  if (isLeadDatabaseConnected() && supabase) {
    try {
      const { error } = await supabase
        .from('webhook_processed_messages')
        .insert({ message_id: messageId, phone: normalizePhone(phone), created_at: new Date().toISOString() });

      // Código de violação de chave primária duplicada
      if (error && (error.code === '23505' || error.message?.includes('duplicate key'))) {
        return true;
      }
    } catch {
      // Se falhar o banco, a proteção em memória já garantiu a rejeição da duplicação
    }
  }

  return false;
}

/**
 * Verifica se o remetente é o ADMIN_WHATSAPP
 */
export function isAdminPhone(phone: string): boolean {
  const adminConfigured = process.env.ADMIN_WHATSAPP || '';
  if (!adminConfigured) return false;
  return isSameBrazilianPhone(adminConfigured, phone);
}

/**
 * Verifica se o remetente pertence a um cliente/empresa cadastrada no Vurio
 */
export async function isRegisteredCompanyPhone(phone: string): Promise<boolean> {
  try {
    const { getAllCompanies } = await import('./company-service');
    const companies = await getAllCompanies();
    for (const comp of companies) {
      if (comp.whatsappPhone && isSameBrazilianPhone(comp.whatsappPhone, phone)) {
        return true;
      }
    }
  } catch (err) {
    console.warn('Erro ao consultar empresas no lead-service:', err);
  }
  return false;
}

/**
 * Extrai e sanitiza código opcional de rastreio de campanha [ref:xxx]:
 * - Minúsculas
 * - Apenas letras, números, hífen e sublinhado (remove caracteres inválidos)
 * - Trunca em no máximo 50 caracteres
 */
export function extractRefCode(text: string): string | null {
  if (!text) return null;
  const match = text.match(/\[ref:([^\]]+)\]/i);
  if (!match) return null;
  const sanitized = match[1].toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 50);
  return sanitized || null;
}

/**
 * Registra ou atualiza a interação do lead, controlando:
 * - Primeira mensagem vs mensagem subsequente
 * - Opt-out ('sair' ou 'parar')
 * - Regra de resposta automática (somente na 1ª mensagem de cada número, trava 24h, sem loops)
 */
export async function registerOrUpdateLead(
  rawPhone: string,
  messageText: string
): Promise<{
  isNewLead: boolean;
  messageCount: number;
  shouldSendAutoReply: boolean;
  isOptOut: boolean;
}> {
  const phone = normalizePhone(rawPhone);
  const now = new Date();
  const lowerText = (messageText || '').toLowerCase().trim();

  // Tratamento de Opt-Out ('sair', 'parar', 'cancelar')
  const wantsOptOut = lowerText === 'sair' || lowerText === 'parar' || lowerText === 'cancelar';

  // 1. AMBIENTE DE TESTE LOCAL (NODE_ENV === 'test')
  if (process.env.NODE_ENV === 'test') {
    const existing = inMemoryTestLeads.get(phone);
    if (!existing) {
      const ref = extractRefCode(messageText);
      const newLead: LeadRecord = {
        phone,
        ref,
        first_message_text: messageText,
        first_message_at: now.toISOString(),
        last_message_at: now.toISOString(),
        message_count: 1,
        last_auto_reply_at: wantsOptOut ? null : now.toISOString(),
        opt_out: wantsOptOut
      };
      inMemoryTestLeads.set(phone, newLead);
      return {
        isNewLead: true,
        messageCount: 1,
        shouldSendAutoReply: !wantsOptOut,
        isOptOut: wantsOptOut
      };
    } else {
      existing.message_count += 1;
      existing.last_message_at = now.toISOString();
      if (wantsOptOut) {
        existing.opt_out = true;
      }
      return {
        isNewLead: false,
        messageCount: existing.message_count,
        shouldSendAutoReply: false, // Não repete em respostas subsequentes
        isOptOut: existing.opt_out
      };
    }
  }

  // 2. AMBIENTE NORMAL / PREVIEW / PRODUÇÃO (VIA SUPABASE)
  if (!isLeadDatabaseConnected() || !supabase) {
    console.warn('[LeadService] Supabase não conectado para persistir lead.');
    return {
      isNewLead: false,
      messageCount: 1,
      shouldSendAutoReply: false,
      isOptOut: wantsOptOut
    };
  }

  try {
    // Busca lead existente
    const { data: existingLead, error: findError } = await supabase
      .from('leads')
      .select('*')
      .eq('phone', phone)
      .maybeSingle();

    if (findError) {
      console.error('[LeadService] Erro ao buscar lead:', findError);
    }

    if (!existingLead) {
      // Novo Lead
      const ref = extractRefCode(messageText);
      const insertPayload = {
        phone,
        ref,
        first_message_text: messageText,
        first_message_at: now.toISOString(),
        last_message_at: now.toISOString(),
        message_count: 1,
        last_auto_reply_at: wantsOptOut ? null : now.toISOString(),
        opt_out: wantsOptOut
      };

      await supabase.from('leads').insert(insertPayload);

      return {
        isNewLead: true,
        messageCount: 1,
        shouldSendAutoReply: !wantsOptOut,
        isOptOut: wantsOptOut
      };
    } else {
      // Lead Existente
      const newCount = (existingLead.message_count || 1) + 1;
      const isAlreadyOptOut = existingLead.opt_out || wantsOptOut;

      await supabase
        .from('leads')
        .update({
          last_message_at: now.toISOString(),
          message_count: newCount,
          opt_out: isAlreadyOptOut
        })
        .eq('phone', phone);

      return {
        isNewLead: false,
        messageCount: newCount,
        shouldSendAutoReply: false,
        isOptOut: isAlreadyOptOut
      };
    }
  } catch (err) {
    console.error('[LeadService] Falha ao processar lead no Supabase:', err);
    return {
      isNewLead: false,
      messageCount: 1,
      shouldSendAutoReply: false,
      isOptOut: wantsOptOut
    };
  }
}

/**
 * Gera o texto formatado do PLACAR VURIO para o ADMIN_WHATSAPP.
 * 
 * REQUISITO CRÍTICO:
 * Se o Supabase não estiver conectado fora de teste local, responde EXATAMENTE:
 * "Placar indisponível: banco não conectado"
 */
export async function generateLeadScoreboard(commandText: string): Promise<string> {
  const isTest = process.env.NODE_ENV === 'test';

  // Se fora do ambiente de teste local e sem Supabase conectado com service role:
  if (!isTest && !isLeadDatabaseConnected()) {
    return 'Placar indisponível: banco não conectado';
  }

  const lowerCmd = commandText.toLowerCase().trim();
  const isScoreRef = lowerCmd.includes('ref');

  let leads: LeadRecord[] = [];

  if (isTest) {
    leads = Array.from(inMemoryTestLeads.values());
  } else if (supabase) {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('first_message_at', { ascending: true });

      if (error || !data) {
        console.error('[Scoreboard] Erro ao consultar banco:', error);
        return 'Placar indisponível: erro ao consultar o banco';
      }
      leads = data as LeadRecord[];
    } catch (err) {
      console.error('[Scoreboard] Exceção ao consultar banco:', err);
      return 'Placar indisponível: erro ao consultar o banco';
    }
  }

  // Filtragens obrigatórias:
  // 1. Excluir opt-outs
  // 2. Excluir admin pessoal
  // 3. Excluir clientes já cadastrados
  const adminPhone = process.env.ADMIN_WHATSAPP || '';
  
  let registeredClientPhones: string[] = [];
  try {
    const { getAllCompanies } = await import('./company-service');
    const companies = await getAllCompanies();
    registeredClientPhones = companies.map(c => normalizePhone(c.whatsappPhone || '')).filter(Boolean);
  } catch {
    // Segue sem travar
  }

  const filteredLeads = leads.filter(l => {
    if (l.opt_out) return false;
    if (adminPhone && isSameBrazilianPhone(adminPhone, l.phone)) return false;
    if (registeredClientPhones.some(cp => isSameBrazilianPhone(cp, l.phone))) return false;
    return true;
  });

  // Data de início do placar (menor data dos leads ou data atual)
  let sinceFormatted = '03/10';
  if (filteredLeads.length > 0 && filteredLeads[0].first_message_at) {
    try {
      const d = new Date(filteredLeads[0].first_message_at);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      sinceFormatted = `${day}/${month}`;
    } catch {}
  }

  // Fuso horário America/Sao_Paulo para cálculo de "Hoje" e "Últimos 7 dias"
  const now = new Date();
  const spDateStr = now.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  const [spDay, spMonth, spYear] = spDateStr.split('/').map(Number);
  const startOfTodaySP = new Date(Date.UTC(spYear, spMonth - 1, spDay, 3, 0, 0)); // UTC correspondente a 00:00 SP (UTC-3)
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const totalUnicos = filteredLeads.length;
  const responderam = filteredLeads.filter(l => l.message_count >= 2).length;

  const hojeCount = filteredLeads.filter(l => {
    const d = new Date(l.first_message_at);
    return d >= startOfTodaySP;
  }).length;

  const ultimos7dCount = filteredLeads.filter(l => {
    const d = new Date(l.first_message_at);
    return d >= sevenDaysAgo;
  }).length;

  if (!isScoreRef) {
    return [
      `PLACAR VURIO (desde ${sinceFormatted})`,
      `Leads únicos: ${totalUnicos} | Responderam à pergunta: ${responderam}`,
      `Hoje: ${hojeCount} | Últimos 7 dias: ${ultimos7dCount}`
    ].join('\n');
  }

  // Agrupamento por código ref
  const refGroups: Record<string, { total: number; responderam: number }> = {};
  for (const l of filteredLeads) {
    const key = l.ref ? l.ref : 'sem ref';
    if (!refGroups[key]) {
      refGroups[key] = { total: 0, responderam: 0 };
    }
    refGroups[key].total += 1;
    if (l.message_count >= 2) {
      refGroups[key].responderam += 1;
    }
  }

  const lines = [
    `PLACAR VURIO (desde ${sinceFormatted})`,
    `Leads únicos: ${totalUnicos} | Responderam à pergunta: ${responderam}`,
    `Hoje: ${hojeCount} | Últimos 7 dias: ${ultimos7dCount}`,
    '',
    'Detalhamento por REF:'
  ];

  for (const [refKey, counts] of Object.entries(refGroups)) {
    lines.push(`• [${refKey}]: ${counts.total} leads (${counts.responderam} responderam)`);
  }

  return lines.join('\n');
}

/**
 * ROTINA REAL DE EXPURGO DE DADOS LGPD:
 * Apaga registros de leads cuja última interação tenha ocorrido há mais de retentionDays.
 * Também limpa mensagens processadas de webhook com mais de 7 dias.
 */
export async function purgeExpiredLeads(retentionDays = LEAD_RETENTION_DAYS): Promise<{
  deletedCount: number;
  success: boolean;
  error?: string;
}> {
  if (process.env.NODE_ENV === 'test') {
    const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
    let count = 0;
    for (const [phone, record] of inMemoryTestLeads.entries()) {
      if (new Date(record.last_message_at) < cutoff) {
        inMemoryTestLeads.delete(phone);
        count++;
      }
    }
    return { deletedCount: count, success: true };
  }

  if (!isLeadDatabaseConnected() || !supabase) {
    return { deletedCount: 0, success: false, error: 'Supabase não conectado para executar expurgo' };
  }

  try {
    const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000).toISOString();
    const webhookCutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('leads')
      .delete()
      .lt('last_message_at', cutoffDate)
      .select('id');

    // Limpa também logs antigos de deduplicação de mensagens
    await supabase
      .from('webhook_processed_messages')
      .delete()
      .lt('created_at', webhookCutoff);

    if (error) {
      return { deletedCount: 0, success: false, error: error.message };
    }

    return { deletedCount: data?.length || 0, success: true };
  } catch (err: any) {
    return { deletedCount: 0, success: false, error: err?.message || 'Erro inesperado no expurgo' };
  }
}

/**
 * Limpa dados de teste da memória (somente em testes)
 */
export function resetTestLeads() {
  inMemoryTestLeads.clear();
  inMemoryTestProcessedMessages.clear();
  recentMessageIds.clear();
}
