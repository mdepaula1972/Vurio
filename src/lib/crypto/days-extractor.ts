export interface RestPeriodInfo {
  days: number | null;
  startDate: string | null;
  rawText?: string;
}

const NUMBER_WORDS: Record<string, number> = {
  'um': 1, 'uma': 1, 'dois': 2, 'duas': 2, 'tres': 3, 'três': 3, 'quatro': 4,
  'cinco': 5, 'seis': 6, 'sete': 7, 'oito': 8, 'nove': 9, 'dez': 10,
  'quinze': 15, 'vinte': 20, 'trinta': 30
};

/**
 * Extrai a quantidade de dias de afastamento/repouso e a data de início (LGPD Compliant).
 */
export function extractRestDaysAndPeriod(text: string): RestPeriodInfo {
  let days: number | null = null;
  let startDate: string | null = null;
  let rawText: string | undefined;

  // 1. Procurar padrões numéricos: "03 (três) dias", "15 dias", "05 dias"
  const daysRegex = /\b(\d{1,2})\s*(?:\([a-záàâãéèêíïóôõöúç\s]+\))?\s*dia/i;
  const matchDays = text.match(daysRegex);

  if (matchDays && matchDays[1]) {
    days = parseInt(matchDays[1], 10);
    rawText = matchDays[0];
  } else {
    // Tentar por extenso: "dois dias", "três dias", "quinze dias"
    const wordPattern = Object.keys(NUMBER_WORDS).join('|');
    const wordRegex = new RegExp(`(?:afastamento|repouso|dispensa|licen[çc]a)?\\s*(?:de|por)?\\s*(${wordPattern})\\s*dia`, 'i');
    const matchWord = text.match(wordRegex);
    if (matchWord && matchWord[1]) {
      const normalizedWord = matchWord[1].toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      days = NUMBER_WORDS[normalizedWord] || null;
      rawText = matchWord[0];
    }
  }

  // 2. Procurar data de início: "a partir de DD/MM/AAAA", "a contar de DD/MM/AAAA", "no dia DD/MM/AAAA"
  const dateRegex = /(?:a\s*partir\s*de|a\s*contar\s*de|iniciando\s*em|no\s*dia|data:?)[\s:]*(\d{2}[\/\.-]\d{2}[\/\.-]\d{4})/i;
  const matchDate = text.match(dateRegex);
  if (matchDate && matchDate[1]) {
    startDate = matchDate[1].replace(/[\.-]/g, '/');
  } else {
    // Fallback: primeira data válida de 8 a 10 dígitos encontrada
    const anyDateRegex = /\b(\d{2}\/\d{2}\/\d{4})\b/;
    const matchAnyDate = text.match(anyDateRegex);
    if (matchAnyDate) {
      startDate = matchAnyDate[1];
    }
  }

  return {
    days,
    startDate,
    rawText
  };
}
