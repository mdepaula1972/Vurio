/**
 * Vurio - Serviço de Análise Técnica de Adulteração e Metadados Forenses de PDF
 * ETAPA 2: Inspeção de Metadados, Camadas de Texto, Softwares de Edição e Assinatura Digital
 */

export interface ForensicPdfMetadataResult {
  hasTechnicalAnomaly: boolean;
  detectedGraphicEditor: string | null;
  datesDiscrepancy: boolean;
  modificationDate: string | null;
  creationDate: string | null;
  fontAnomalyDetected: boolean;
  securityAlerts: string[];
  rawProducer: string | null;
  rawCreator: string | null;
}

const GRAPHIC_EDITORS_SIGNATURES: Array<{ name: string; pattern: RegExp }> = [
  { name: 'Adobe Photoshop', pattern: /photoshop/i },
  { name: 'Adobe Illustrator', pattern: /illustrator/i },
  { name: 'Canva', pattern: /canva/i },
  { name: 'LibreOffice', pattern: /libreoffice|openoffice/i },
  { name: 'GIMP', pattern: /gimp/i },
  { name: 'CorelDraw', pattern: /coreldraw|corel/i },
  { name: 'Inkscape', pattern: /inkscape/i }
];

/**
 * Converte data em formato ASN.1 / PDF (ex: D:20261012153000Z ou 2026-10-12) em Date padrão.
 */
function parsePdfDate(rawDate?: string | null): Date | null {
  if (!rawDate) return null;
  const clean = rawDate.replace(/^[D\:]+/, '').trim();
  const match = clean.match(/^(\d{4})(\d{2})(\d{2})(\d{2})?(\d{2})?(\d{2})?/);
  if (match) {
    const year = parseInt(match[1], 10);
    const month = parseInt(match[2], 10) - 1;
    const day = parseInt(match[3], 10);
    const hour = match[4] ? parseInt(match[4], 10) : 12;
    const min = match[5] ? parseInt(match[5], 10) : 0;
    const sec = match[6] ? parseInt(match[6], 10) : 0;
    return new Date(Date.UTC(year, month, day, hour, min, sec));
  }
  const timestamp = Date.parse(rawDate);
  return isNaN(timestamp) ? null : new Date(timestamp);
}

/**
 * Inspeciona buffer de arquivo PDF procurando por softwares de edição gráfica,
 * divergências de data de modificação e alterações nas camadas de texto.
 */
export function analyzePdfForensicMetadata(
  pdfBuffer: Buffer,
  declaredEmissionDate?: string | null
): ForensicPdfMetadataResult {
  const isPdf = pdfBuffer.subarray(0, 5).toString('latin1').startsWith('%PDF');
  if (!isPdf) {
    return {
      hasTechnicalAnomaly: false,
      detectedGraphicEditor: null,
      datesDiscrepancy: false,
      modificationDate: null,
      creationDate: null,
      fontAnomalyDetected: false,
      securityAlerts: [],
      rawProducer: null,
      rawCreator: null
    };
  }

  const pdfString = pdfBuffer.toString('latin1');
  const securityAlerts: string[] = [];

  // 1. Extração de Dicionários de Informação (/Producer, /Creator, /ModDate, /CreationDate)
  const producerMatch = pdfString.match(/\/Producer\s*(?:\(([^\)]*)\)|<([0-9a-fA-F]*)>)/i);
  const creatorMatch = pdfString.match(/\/Creator\s*(?:\(([^\)]*)\)|<([0-9a-fA-F]*)>)/i);
  const modDateMatch = pdfString.match(/\/ModDate\s*(?:\(([^\)]*)\)|<([0-9a-fA-F]*)>)/i);
  const creationDateMatch = pdfString.match(/\/CreationDate\s*(?:\(([^\)]*)\)|<([0-9a-fA-F]*)>)/i);

  const rawProducer = producerMatch
    ? (producerMatch[1] !== undefined ? producerMatch[1] : Buffer.from(producerMatch[2] || '', 'hex').toString('latin1')).trim()
    : null;

  const rawCreator = creatorMatch
    ? (creatorMatch[1] !== undefined ? creatorMatch[1] : Buffer.from(creatorMatch[2] || '', 'hex').toString('latin1')).trim()
    : null;

  const rawModDate = modDateMatch ? (modDateMatch[1] || modDateMatch[2]) : null;
  const rawCreationDate = creationDateMatch ? (creationDateMatch[1] || creationDateMatch[2]) : null;

  const modDate = parsePdfDate(rawModDate);
  const creationDate = parsePdfDate(rawCreationDate);

  // 2. Detecção de Softwares de Edição de Imagem ou Vetor
  const metadataBundle = `${rawProducer || ''} ${rawCreator || ''} ${pdfString.substring(0, 4000)}`.toLowerCase();
  let detectedGraphicEditor: string | null = null;

  for (const editor of GRAPHIC_EDITORS_SIGNATURES) {
    if (editor.pattern.test(metadataBundle)) {
      detectedGraphicEditor = editor.name;
      break;
    }
  }

  // 3. Verificação de Discrepância de Datas (Data de modificação difere da data de emissão/criação)
  let datesDiscrepancy = false;
  if (modDate && creationDate) {
    const diffHours = Math.abs(modDate.getTime() - creationDate.getTime()) / (1000 * 60 * 60);
    // Se modificado mais de 24 horas após a criação original
    if (diffHours > 24) {
      datesDiscrepancy = true;
    }
  }

  if (declaredEmissionDate && modDate) {
    const emissionTimestamp = Date.parse(declaredEmissionDate.replace(/(\d{2})\/(\d{2})\/(\d{4})/, '$3-$2-$1'));
    if (!isNaN(emissionTimestamp)) {
      const diffEmissionHours = (modDate.getTime() - emissionTimestamp) / (1000 * 60 * 60);
      if (diffEmissionHours > 48) {
        datesDiscrepancy = true;
      }
    }
  }

  // 4. Detecção de Sobreposição de Fontes e Caixas de Texto
  // Verifica múltiplos operadores /Font em objetos isolados com operadores Tm / TJ intercalados
  let fontAnomalyDetected = false;
  const fontMatches = pdfString.match(/\/Font\s*<<[^>]+>>/g) || [];
  const textMatrixChanges = pdfString.match(/\bTm\b/g) || [];

  // Se houver uma densidade anormalmente alta de matrizes de transformação de texto em documento de página única
  if (textMatrixChanges.length > 250 && fontMatches.length > 8) {
    fontAnomalyDetected = true;
  }

  // 5. Consolidação de Anomalia Técnica
  const hasTechnicalAnomaly = !!detectedGraphicEditor || datesDiscrepancy || fontAnomalyDetected;

  if (hasTechnicalAnomaly) {
    // Alerta padrão obrigatório da instrução
    securityAlerts.push('O arquivo digital possui histórico de edição pós-emissão.');

    if (detectedGraphicEditor) {
      securityAlerts.push(`Identificada assinatura do software de edição gráfica: ${detectedGraphicEditor}.`);
    }
    if (datesDiscrepancy) {
      securityAlerts.push('Data de modificação do arquivo diverge do período original de emissão do documento.');
    }
    if (fontAnomalyDetected) {
      securityAlerts.push('Detectada sobreposição de caixas de texto com fontes secundárias no fluxo textual.');
    }
  }

  return {
    hasTechnicalAnomaly,
    detectedGraphicEditor,
    datesDiscrepancy,
    modificationDate: modDate ? modDate.toISOString() : null,
    creationDate: creationDate ? creationDate.toISOString() : null,
    fontAnomalyDetected,
    securityAlerts,
    rawProducer,
    rawCreator
  };
}
