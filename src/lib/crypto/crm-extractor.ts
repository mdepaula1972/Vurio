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
 * Extrai texto do PDF e identifica número de CRM e Estado (UF).
 */
export async function extractCrmAndUf(pdfBuffer: Buffer): Promise<CrmInfo> {
  try {
    const data = await pdfParse(pdfBuffer);
    const text = data.text || '';
    const parsed = parseCrmFromText(text);
    if (parsed.crm) {
      return parsed;
    }

    // Fallback: se o PDF tiver fontes não mapeadas ou texto em streams literais
    const latinText = pdfBuffer.toString('latin1');
    return parseCrmFromText(latinText);
  } catch (err) {
    // Se o pdfParse falhar (ex: documento protegido ou corrompido), busca direta no buffer
    const latinText = pdfBuffer.toString('latin1');
    return parseCrmFromText(latinText);
  }
}

/**
 * Analisa string de texto procurando padrões de CRM e UF
 */
export function parseCrmFromText(text: string): CrmInfo {
  const ufPattern = BRAZIL_UFS.join('|');

  // Padrão 1: CRM/SP 123456 ou CRM-SP 123456 ou CRM SP 123456
  const regex1 = new RegExp(`CRM[\\s\\/\\-]*(${ufPattern})[\\s\\:\\№\\#\\.]*([0-9]{4,8})`, 'i');
  const match1 = text.match(regex1);
  if (match1) {
    return {
      uf: match1[1].toUpperCase(),
      crm: match1[2],
      rawFoundText: match1[0]
    };
  }

  // Padrão 2: CRM 123456/SP ou CRM: 123456-SP ou CRM nº 123456 SP
  const regex2 = new RegExp(`CRM[\\s\\:\\№\\#\\.]*([0-9]{4,8})[\\s\\/\\-]*(${ufPattern})`, 'i');
  const match2 = text.match(regex2);
  if (match2) {
    return {
      crm: match2[1],
      uf: match2[2].toUpperCase(),
      rawFoundText: match2[0]
    };
  }

  // Padrão 3: CRM 123456 (sem UF imediata)
  const regex3 = /CRM[\s\:\№\#\.]*([0-9]{4,8})/i;
  const match3 = text.match(regex3);
  if (match3) {
    // Tentar achar UF nas proximidades (próximos 30 caracteres)
    const index = match3.index || 0;
    const surrounding = text.substring(index, index + 50);
    const ufMatch = surrounding.match(new RegExp(`\\b(${ufPattern})\\b`, 'i'));
    return {
      crm: match3[1],
      uf: ufMatch ? ufMatch[1].toUpperCase() : null,
      rawFoundText: match3[0]
    };
  }

  return {
    crm: null,
    uf: null
  };
}
