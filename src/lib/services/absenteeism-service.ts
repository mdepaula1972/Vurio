/**
 * Vurio - Serviço de Gestão de Absenteísmo, Inteligência Preditiva e Pasta do Colaborador
 * Módulo DP: Cruzamento de Calendário Oficial, Eventos Notáveis e Histórico de Absenteísmo.
 */

export interface NotableDpEvent {
  id: string;
  companyId: string;
  title: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  category: 'SHOW' | 'FESTA_LOCAL' | 'PICO_OPERACIONAL' | 'OUTRO';
  description?: string;
  createdAt: string;
}

export interface EmployeeFolderRecord {
  employeeIdentifier: string; // CPF ou Nome
  companyId: string;
  year: number;
  totalAtestadosAno: number;
  totalDiasAno: number;
  historicoInconsistencias: number;
  cidsRegistrados: string[];
  cidGruposRegistrados: string[];
  lastAttestationDate?: string;
}

export interface PredictiveAnalysisResult {
  coincidencia_feriado: boolean;
  coincidencia_evento_dp: boolean;
  nome_evento: string;
  padrao_reincidente_dias: boolean;
  rotulo_alerta?: string;
}

// Feriados Nacionais Brasileiros Fixos (Mês-Dia)
const BRAZILIAN_FIXED_HOLIDAYS: Record<string, string> = {
  '01-01': 'Confraternização Universal (Ano Novo)',
  '04-21': 'Tiradentes',
  '05-01': 'Dia Mundial do Trabalho',
  '09-07': 'Independência do Brasil',
  '10-12': 'Nossa Senhora Aparecida',
  '11-02': 'Finados',
  '11-15': 'Proclamação da República',
  '11-20': 'Dia Nacional de Zumbi e da Consciência Negra',
  '12-25': 'Natal'
};

// Armazenamento em memória para Eventos Notáveis e Pastas dos Colaboradores (com fallback dinâmico)
const inMemoryNotableEvents: NotableDpEvent[] = [
  {
    id: 'evt-default-1',
    companyId: 'default',
    title: 'Show Musical na Cidade',
    startDate: '2026-10-16',
    endDate: '2026-10-18',
    category: 'SHOW',
    createdAt: new Date().toISOString()
  },
  {
    id: 'evt-default-2',
    companyId: 'default',
    title: 'Semana de Fechamento Operacional / Inventário',
    startDate: '2026-10-26',
    endDate: '2026-10-31',
    category: 'PICO_OPERACIONAL',
    createdAt: new Date().toISOString()
  }
];

const inMemoryEmployeeFolders = new Map<string, EmployeeFolderRecord>();

/**
 * Retorna o grupo estrutural do código CID-10 (Capítulo de Saúde)
 */
export function getCidStructuralGroup(cidCode?: string | null): { groupCode: string; description: string } | null {
  if (!cidCode) return null;
  const clean = cidCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (!clean) return null;
  const initial = clean.charAt(0);

  switch (initial) {
    case 'F':
      return { groupCode: 'F', description: 'Transtornos Mentais e Comportamentais (F00-F99)' };
    case 'M':
      return { groupCode: 'M', description: 'Doenças do Sistema Osteomuscular e Tecido Conjuntivo (M00-M99)' };
    case 'J':
      return { groupCode: 'J', description: 'Doenças do Aparelho Respiratório (J00-J99)' };
    case 'K':
      return { groupCode: 'K', description: 'Doenças do Aparelho Digestivo (K00-K93)' };
    case 'S':
    case 'T':
      return { groupCode: 'S_T', description: 'Lesões, Traumatismos e Causas Externas (S00-T98)' };
    case 'G':
      return { groupCode: 'G', description: 'Doenças do Sistema Nervoso (G00-G99)' };
    case 'I':
      return { groupCode: 'I', description: 'Doenças do Aparelho Circulatório (I00-I99)' };
    case 'Z':
      return { groupCode: 'Z', description: 'Fatores que Influenciam o Estado de Saúde (Z00-Z99)' };
    default:
      return { groupCode: initial, description: `Capítulo Clínico ${initial}` };
  }
}

/**
 * Normaliza string de data (DD/MM/AAAA ou YYYY-MM-DD) para objeto Date
 */
export function parseDateString(dateStr?: string | null): Date | null {
  if (!dateStr) return null;
  const trimmed = dateStr.trim();
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) {
    const [d, m, y] = trimmed.split('/').map(Number);
    return new Date(y, m - 1, d, 12, 0, 0);
  }
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    const [y, m, d] = trimmed.substring(0, 10).split('-').map(Number);
    return new Date(y, m - 1, d, 12, 0, 0);
  }
  const timestamp = Date.parse(trimmed);
  return isNaN(timestamp) ? null : new Date(timestamp);
}

/**
 * Formata objeto Date para string YYYY-MM-DD
 */
export function formatDateIso(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Análise de Inteligência Preditiva e Cruzamento de Eventos (Seção 3)
 */
export function analyzeEventCoincidence(
  attestationStartDateStr?: string | null,
  companyId: string = 'default'
): PredictiveAnalysisResult {
  const date = parseDateString(attestationStartDateStr) || new Date();
  const dayOfWeek = date.getDay(); // 0 = Domingo, 1 = Segunda, 5 = Sexta, 6 = Sábado
  const monthDay = `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  const isoDate = formatDateIso(date);

  let coincidencia_feriado = false;
  let nomeFeriadoOuPonte = '';

  // 1. Checagem direta de feriado nacional
  if (BRAZILIAN_FIXED_HOLIDAYS[monthDay]) {
    coincidencia_feriado = true;
    nomeFeriadoOuPonte = BRAZILIAN_FIXED_HOLIDAYS[monthDay];
  } else {
    // 2. Checagem de véspera ou pós-feriado imediato
    const prevDay = new Date(date);
    prevDay.setDate(prevDay.getDate() - 1);
    const prevMonthDay = `${String(prevDay.getMonth() + 1).padStart(2, '0')}-${String(prevDay.getDate()).padStart(2, '0')}`;

    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);
    const nextMonthDay = `${String(nextDay.getMonth() + 1).padStart(2, '0')}-${String(nextDay.getDate()).padStart(2, '0')}`;

    if (BRAZILIAN_FIXED_HOLIDAYS[nextMonthDay]) {
      coincidencia_feriado = true;
      nomeFeriadoOuPonte = `Véspera de ${BRAZILIAN_FIXED_HOLIDAYS[nextMonthDay]}`;
    } else if (BRAZILIAN_FIXED_HOLIDAYS[prevMonthDay]) {
      coincidencia_feriado = true;
      nomeFeriadoOuPonte = `Pós-Feriado de ${BRAZILIAN_FIXED_HOLIDAYS[prevMonthDay]}`;
    }
  }

  // 3. Regra de ponte de fim de semana (Sexta-feira ou Segunda-feira)
  const isWeekendBridge = dayOfWeek === 1 || dayOfWeek === 5;
  const padrao_reincidente_dias = isWeekendBridge || coincidencia_feriado;

  if (!nomeFeriadoOuPonte && isWeekendBridge) {
    nomeFeriadoOuPonte = dayOfWeek === 5 ? 'Sexta-feira (Ponte de Fim de Semana)' : 'Segunda-feira (Pós-Fim de Semana)';
  }

  // 4. Cruzamento com Eventos Notáveis do DP (Privado/Manual)
  const events = getNotableEvents(companyId);
  let coincidencia_evento_dp = false;
  let nome_evento = '';

  for (const evt of events) {
    if (isoDate >= evt.startDate && isoDate <= evt.endDate) {
      coincidencia_evento_dp = true;
      nome_evento = evt.title;
      break;
    }
  }

  // Rótulo oficial exigido pela diretriz: "Afastamento com coincidência em [Nome do Evento / Véspera de Feriado]."
  let rotulo_alerta: string | undefined = undefined;
  if (coincidencia_evento_dp && nome_evento) {
    rotulo_alerta = `Afastamento com coincidência em ${nome_evento}.`;
  } else if (coincidencia_feriado && nomeFeriadoOuPonte) {
    rotulo_alerta = `Afastamento com coincidência em ${nomeFeriadoOuPonte}.`;
  } else if (isWeekendBridge) {
    rotulo_alerta = `Afastamento com coincidência em ${nomeFeriadoOuPonte}.`;
  }

  return {
    coincidencia_feriado,
    coincidencia_evento_dp,
    nome_evento: nome_evento || nomeFeriadoOuPonte,
    padrao_reincidente_dias,
    rotulo_alerta
  };
}

/**
 * Consulta ou Inicializa a Pasta do Colaborador no ano vigente (ETAPA 4)
 */
export function getOrCreateEmployeeFolder(
  employeeIdentifier: string,
  companyId: string = 'default',
  year: number = new Date().getFullYear()
): EmployeeFolderRecord {
  const cleanId = employeeIdentifier.trim().toLowerCase();
  const key = `${companyId}:${year}:${cleanId}`;

  const existing = inMemoryEmployeeFolders.get(key);
  if (existing) {
    return existing;
  }

  const newFolder: EmployeeFolderRecord = {
    employeeIdentifier,
    companyId,
    year,
    totalAtestadosAno: 0,
    totalDiasAno: 0,
    historicoInconsistencias: 0,
    cidsRegistrados: [],
    cidGruposRegistrados: []
  };

  inMemoryEmployeeFolders.set(key, newFolder);
  return newFolder;
}

/**
 * Atualiza e persiste métricas na Pasta do Colaborador (ETAPA 4)
 */
export function updateEmployeeFolder(params: {
  employeeIdentifier: string;
  companyId?: string;
  days: number;
  cid?: string | null;
  hadInconsistencyOrManualTyping: boolean;
  emissionDate?: string | null;
}): {
  folder: EmployeeFolderRecord;
  reincidenciaCidGrupo: boolean;
} {
  const companyId = params.companyId || 'default';
  const year = new Date().getFullYear();
  const folder = getOrCreateEmployeeFolder(params.employeeIdentifier, companyId, year);

  // Atualizar totais
  folder.totalAtestadosAno += 1;
  folder.totalDiasAno += Math.max(1, params.days);

  if (params.hadInconsistencyOrManualTyping) {
    folder.historicoInconsistencias += 1;
  }

  let reincidenciaCidGrupo = false;

  if (params.cid) {
    const cleanCid = params.cid.trim().toUpperCase();
    const group = getCidStructuralGroup(cleanCid);

    if (group) {
      if (folder.cidGruposRegistrados.includes(group.groupCode)) {
        reincidenciaCidGrupo = true;
      } else {
        folder.cidGruposRegistrados.push(group.groupCode);
      }
    }

    if (!folder.cidsRegistrados.includes(cleanCid)) {
      folder.cidsRegistrados.push(cleanCid);
    }
  }

  if (params.emissionDate) {
    folder.lastAttestationDate = params.emissionDate;
  }

  return {
    folder,
    reincidenciaCidGrupo
  };
}

/**
 * Gerencia a lista de Eventos Notáveis do DP
 */
export function getNotableEvents(companyId: string = 'default'): NotableDpEvent[] {
  return inMemoryNotableEvents.filter(e => e.companyId === companyId || e.companyId === 'default');
}

export function addNotableEvent(event: Omit<NotableDpEvent, 'id' | 'createdAt'>): NotableDpEvent {
  const newEvt: NotableDpEvent = {
    ...event,
    id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    createdAt: new Date().toISOString()
  };
  inMemoryNotableEvents.push(newEvt);
  return newEvt;
}

export function deleteNotableEvent(eventId: string): boolean {
  const idx = inMemoryNotableEvents.findIndex(e => e.id === eventId);
  if (idx !== -1) {
    inMemoryNotableEvents.splice(idx, 1);
    return true;
  }
  return false;
}
