import pdfParse from 'pdf-parse';

export type ProfessionalCouncilType = 'CRM' | 'CRO' | 'CRP' | 'CREFITO' | 'CRN' | 'RMS';

export interface CrmInfo {
  crm: string | null;
  uf: string | null;
  councilType?: ProfessionalCouncilType | null;
  councilNumber?: string | null;
  professionalTitle?: string;
  rawFoundText?: string;
}

const BRAZIL_UFS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

export function getTitleByCouncil(council: ProfessionalCouncilType): string {
  switch (council) {
    case 'CRO':
      return 'Cirurgião-Dentista';
    case 'CRP':
      return 'Psicólogo(a)';
    case 'CREFITO':
      return 'Fisioterapeuta / Terapeuta Ocupacional';
    case 'CRN':
      return 'Nutricionista';
    case 'RMS':
      return 'Médico(a) Intercambista (RMS)';
    case 'CRM':
    default:
      return 'Médico(a)';
  }
}

export async function extractCrmAndUf(pdfBuffer: Buffer): Promise<CrmInfo> {
  try {
    const data = await pdfParse(pdfBuffer);
    const text = data.text || '';
    if (text.trim()) {
      return parseCrmFromText(text);
    }
  } catch (err) {
    // Fallback para operadores Tj
  }

  const streamMatches = pdfBuffer.toString('latin1').match(/\(([^)]+)\)\s*Tj/g);
  if (streamMatches) {
    const literalText = streamMatches.map(m => m.replace(/^\(|\)\s*Tj$/g, '')).join(' ');
    return parseCrmFromText(literalText);
  }

  return { crm: null, uf: null, councilType: null, councilNumber: null, professionalTitle: 'Médico(a)' };
}

export function parseCrmFromText(text: string): CrmInfo {
  if (!text || text.trim().length === 0) {
    return { crm: null, uf: null, councilType: null, councilNumber: null, professionalTitle: 'Médico(a)' };
  }

  const ufPattern = BRAZIL_UFS.join('|');
  const councils: ProfessionalCouncilType[] = ['CRM', 'CRO', 'CRP', 'CREFITO', 'CRN', 'RMS'];

  for (const council of councils) {

    // Padrão específico para CRP por Região Numérica: CRP 06/12345 ou CRP 06-12345 ou CRP/06 12345
    if (council === 'CRP') {
      const crpRegionRegex = /CRP[\s\/\-]*(0[1-9]|1[0-9]|2[0-4])[\s\/\:\-]*([0-9]{3,8})/i;
      const crpMatch = text.match(crpRegionRegex);
      if (crpMatch) {
        const regionMap: Record<string, string> = {
          '01': 'DF', '02': 'PE', '03': 'BA', '04': 'MG', '05': 'RJ',
          '06': 'SP', '07': 'RS', '08': 'PR', '09': 'GO', '10': 'PA',
          '11': 'CE', '12': 'SC', '13': 'PB', '14': 'MS', '15': 'AL',
          '16': 'ES', '17': 'RN', '18': 'MT', '19': 'SE', '20': 'AM',
          '21': 'PI', '22': 'MA', '23': 'TO', '24': 'RO'
        };
        const regionNum = crpMatch[1];
        const num = crpMatch[2];
        const uf = regionMap[regionNum] || 'BR';
        return {
          crm: null,
          councilType: 'CRP',
          councilNumber: num,
          uf,
          professionalTitle: 'Psicólogo(a)',
          rawFoundText: crpMatch[0]
        };
      }
    }

    // Padrão 1: CONSELHO/SP 123456 ou CONSELHO-SP 123456
    const regex1 = new RegExp(`${council}[\\s\\/\\-]*\\b(${ufPattern})\\b[\\s\\:\\№\\#\\.]*([0-9]{3,8})`, 'i');
    const match1 = text.match(regex1);
    if (match1) {
      const uf = match1[1].toUpperCase();
      const num = match1[2];
      return {
        crm: council === 'CRM' ? num : null,
        councilType: council,
        councilNumber: num,
        uf,
        professionalTitle: getTitleByCouncil(council),
        rawFoundText: match1[0]
      };
    }

    // Padrão 2: CONSELHO 123456/SP ou CONSELHO: 123456-SP
    const regex2 = new RegExp(`${council}[\\s\\:\\№\\#\\.]*([0-9]{3,8})[\\s\\/\\-]*\\b(${ufPattern})\\b`, 'i');
    const match2 = text.match(regex2);
    if (match2) {
      const num = match2[1];
      const uf = match2[2].toUpperCase();
      return {
        crm: council === 'CRM' ? num : null,
        councilType: council,
        councilNumber: num,
        uf,
        professionalTitle: getTitleByCouncil(council),
        rawFoundText: match2[0]
      };
    }

    // Padrão 3: Contexto específico da profissão
    let contextWords = '';
    if (council === 'CRM') contextWords = 'dr|dra|doutor|doutora|m[eé]dic[oa]|conselho|crem\\w+|carimbo|atestado|receitu[aá]rio';
    else if (council === 'CRO') contextWords = 'dentista|cirurgi[aã]o|odonto|dente|cro[\\w]+|bocal|facial';
    else if (council === 'CRP') contextWords = 'psic[oó]log[oa]|psicoterapia|crp[\\w]+|sess[aã]o';
    else if (council === 'CREFITO') contextWords = 'fisioterap[\\w]+|crefito[\\w]+';
    else if (council === 'CRN') contextWords = 'nutri[\\w]+|crn[\\w]+';
    else contextWords = 'minist[eé]rio|sa[uú]de|m[eé]dic[oa]';

    const councilContextRegex = new RegExp(`(?:${contextWords})`, 'i');
    const regex3 = new RegExp(`${council}[\\s\\:\\№\\#\\.]*([0-9]{3,8})`, 'gi');
    let match3: RegExpExecArray | null;

    while ((match3 = regex3.exec(text)) !== null) {
      const startIndex = Math.max(0, match3.index - 60);
      const endIndex = Math.min(text.length, match3.index + match3[0].length + 60);
      const surrounding = text.substring(startIndex, endIndex);

      const hasContext = councilContextRegex.test(surrounding);
      const ufMatch = surrounding.match(new RegExp(`\\b(${ufPattern})\\b`, 'i'));

      if (hasContext || ufMatch) {
        const num = match3[1];
        const uf = ufMatch ? ufMatch[1].toUpperCase() : null;
        return {
          crm: council === 'CRM' ? num : null,
          councilType: council,
          councilNumber: num,
          uf,
          professionalTitle: getTitleByCouncil(council),
          rawFoundText: match3[0]
        };
      }
    }
  }

  return {
    crm: null,
    uf: null,
    councilType: null,
    councilNumber: null,
    professionalTitle: 'Médico(a)'
  };
}
