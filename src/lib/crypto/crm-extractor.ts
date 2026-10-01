import pdfParse from 'pdf-parse';

export interface CrmInfo {
  crm: string | null;
  uf: string | null;
  rawFoundText?: string;
}

const BRAZIL_UFS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

/**
  * Extrai texto do PDF e identifica número de CRM e Estado (UF) com filtro rigoroso de contexto médico.
  */
export async function extractCrmAndUf(pdfBuffer: Buffer): Promise<CrmInfo> {
  try {
    const data = await pdfParse(pdfBuffer);
    const text = data.text || '';
    if (text.trim()) {
      return parseCrmFromText(text);
    }
  } catch (err) {
    // se falhar, tenta extração de texto literal nos operadores Tj
  }

  const streamMatches = pdfBuffer.toString('latin1').match(/\(([^)]+)\)\s*Tj/g);
  if (streamMatches) {
    const literalText = streamMatches.map(m => m.replace(/^\(|\)\s*Tj$/g, '')).join(' ');
    return parseCrmFromText(literalText);
  }

  return { crm: null, uf: null };
}

/**
  * Analisa string de texto procurando padrões estritos de CRM médico e UF.
  * Ignora usos corporativos da palavra CRM (Customer Relationship Management) sem contexto de saúde.
  */
export function parseCrmFromText(text: string): CrmInfo {
  if (!text || text.trim().length === 0) {
    return { crm: null, uf: null };
  }

  const ufPattern = BRAZIL_UFS.join('|');

  // Padrão 1: CRM/SP 123456 ou CRM-SP 123456 ou CRM SP 123456
  const regex1 = new RegExp(`CRM[\\s\\/\\-]*\\b(${ufPattern})\\b[\\s\\:\\№\\#\\.]*([0-9]{4,8})`, 'i');
  const match1 = text.match(regex1);
  if (match1) {
    return {
      uf: match1[1].toUpperCase(),
      crm: match1[2],
      rawFoundText: match1[0]
    };
  }

  // Padrão 2: CRM 123456/SP ou CRM: 123456-SP ou CRM nº 123456 SP
  const regex2 = new RegExp(`CRM[\\s\\:\\№\\#\\.]*([0-9]{4,8})[\\s\\/\\-]*\\b(${ufPattern})\\b`, 'i');
  const match2 = text.match(regex2);
  if (match2) {
    return {
      crm: match2[1],
      uf: match2[2].toUpperCase(),
      rawFoundText: match2[0]
    };
  }

  // Padrão 3: CRM com UF próxima E precedido ou seguido de contexto médico explícito
  // Evita capturar "sistema de CRM", "projeto CRM 2024", etc.
  const medicalContextRegex = /(?:dr|dra|doutor|doutora|m[eé]dic[oa]|conselho|crem\w+|carimbo|atestado|receitu[aá]rio)/i;
  const regex3 = /CRM[\s\:\№\#\.]*([0-9]{4,8})/gi;
  let match3: RegExpExecArray | null;

  while ((match3 = regex3.exec(text)) !== null) {
    const startIndex = Math.max(0, match3.index - 60);
    const endIndex = Math.min(text.length, match3.index + match3[0].length + 60);
    const surrounding = text.substring(startIndex, endIndex);

    // Exige contexto médico ou menção a uma UF válida próxima
    const hasMedicalTerm = medicalContextRegex.test(surrounding);
    const ufMatch = surrounding.match(new RegExp(`\\b(${ufPattern})\\b`, 'i'));

    if (hasMedicalTerm || ufMatch) {
      return {
        crm: match3[1],
        uf: ufMatch ? ufMatch[1].toUpperCase() : null,
        rawFoundText: match3[0]
      };
    }
  }

  return {
    crm: null,
    uf: null
  };
}
