/**
 * Utilitário de baixo nível para extração de estruturas PAdES (/ByteRange e /Contents)
 * e inspeção forense de metadados de impressão virtual / navegadores em buffers de PDF.
 */

export interface ByteRange {
  start1: number;
  len1: number;
  start2: number;
  len2: number;
}

export interface PdfSignatureBlock {
  byteRange: ByteRange;
  byteRangeArray: [number, number, number, number];
  signatureHex: string;
  signatureBuffer: Buffer;
  subFilter?: string;
  contactInfo?: string;
  reason?: string;
  location?: string;
}

export interface PdfProducerMetadata {
  producer: string | null;
  creator: string | null;
  isVirtualPrinter: boolean;
  virtualPrinterEngine?: string;
  rawDetails?: string;
}

export interface PdfReprintInspection {
  isReprintedPdf: boolean;
  producerMetadata: PdfProducerMetadata;
  hasTruncatedByteRange: boolean;
  originalByteRangeSize?: number;
  currentFileSize: number;
  recoveredSignatureBuffer?: Buffer;
}

/**
 * Inspeciona as entradas de cabeçalho e dicionário /Producer e /Creator do PDF
 * para identificar impressoras virtuais ou motores de renderização de navegadores (PDFium/Chromium/Skia).
 */
export function detectPdfProducer(pdfBuffer: Buffer): PdfProducerMetadata {
  const pdfString = pdfBuffer.toString('latin1');
  const producerMatch = pdfString.match(/\/Producer\s*(?:\(([^\)]*)\)|<([0-9a-fA-F]*)>)/i);
  const creatorMatch = pdfString.match(/\/Creator\s*(?:\(([^\)]*)\)|<([0-9a-fA-F]*)>)/i);

  const rawProducer = producerMatch
    ? (producerMatch[1] !== undefined ? producerMatch[1] : Buffer.from(producerMatch[2] || '', 'hex').toString('latin1')).trim()
    : null;

  const rawCreator = creatorMatch
    ? (creatorMatch[1] !== undefined ? creatorMatch[1] : Buffer.from(creatorMatch[2] || '', 'hex').toString('latin1')).trim()
    : null;

  const combined = `${rawProducer || ''} ${rawCreator || ''}`.toLowerCase();

  let isVirtualPrinter = false;
  let virtualPrinterEngine: string | undefined = undefined;

  if (combined.includes('pdfium')) {
    isVirtualPrinter = true;
    virtualPrinterEngine = 'PDFium (Google Chrome / Edge)';
  } else if (combined.includes('skia')) {
    isVirtualPrinter = true;
    virtualPrinterEngine = 'Skia/PDF (Chromium Engine)';
  } else if (combined.includes('microsoft print to pdf')) {
    isVirtualPrinter = true;
    virtualPrinterEngine = 'Microsoft Print to PDF';
  } else if (combined.includes('cutepdf') || combined.includes('foxit reader pdf printer') || combined.includes('bullzip') || combined.includes('novapdf')) {
    isVirtualPrinter = true;
    virtualPrinterEngine = 'Impressora Virtual de Terceiros';
  } else if (combined.includes('chrome') || combined.includes('chromium')) {
    isVirtualPrinter = true;
    virtualPrinterEngine = 'Navegador Base Chromium';
  }

  return {
    producer: rawProducer,
    creator: rawCreator,
    isVirtualPrinter,
    virtualPrinterEngine,
    rawDetails: `Producer: ${rawProducer || 'N/A'}, Creator: ${rawCreator || 'N/A'}`
  };
}

/**
 * Realiza a inspeção contextualizada para identificar se o PDF foi re-salvo
 * via navegador ou impressora virtual, e tenta resgatar a assinatura original para identificação.
 */
export function inspectPdfReprint(pdfBuffer: Buffer): PdfReprintInspection {
  const pdfString = pdfBuffer.toString('latin1');
  const producerMetadata = detectPdfProducer(pdfBuffer);
  let hasTruncatedByteRange = false;
  let originalByteRangeSize: number | undefined = undefined;
  let recoveredSignatureBuffer: Buffer | undefined = undefined;

  // Checar se há blocos /ByteRange que apontem para além do tamanho físico do buffer
  const byteRangeRegex = /\/ByteRange\s*\[\s*(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s*\]/g;
  let match: RegExpExecArray | null;

  while ((match = byteRangeRegex.exec(pdfString)) !== null) {
    const start2 = parseInt(match[3], 10);
    const len2 = parseInt(match[4], 10);
    const totalDeclaredSize = start2 + len2;

    if (totalDeclaredSize > pdfBuffer.length) {
      hasTruncatedByteRange = true;
      originalByteRangeSize = totalDeclaredSize;
      break;
    }
  }

  // Se tem /Contents de assinatura PAdES mas o ByteRange foi truncado ou corrompido pela reimpressão
  const contentsMatch = pdfString.match(/\/Contents\s*<([0-9a-fA-F\s]+)>/i);
  if (contentsMatch && contentsMatch[1]) {
    const cleanHex = contentsMatch[1].replace(/[\s\r\n]/g, '');
    if (cleanHex.length > 100) {
      try {
        recoveredSignatureBuffer = Buffer.from(cleanHex, 'hex');
      } catch {
        // silencioso
      }
    }
  }

  const isReprintedPdf = producerMetadata.isVirtualPrinter || hasTruncatedByteRange;

  return {
    isReprintedPdf,
    producerMetadata,
    hasTruncatedByteRange,
    originalByteRangeSize,
    currentFileSize: pdfBuffer.length,
    recoveredSignatureBuffer
  };
}

/**
 * Localiza todas as assinaturas digitais contidas no buffer do PDF.
 */
export function extractPdfSignatures(pdfBuffer: Buffer): PdfSignatureBlock[] {
  const pdfString = pdfBuffer.toString('latin1');
  const signatures: PdfSignatureBlock[] = [];

  // Expressão regular para capturar /ByteRange\s*\[\s*(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s*\]
  const byteRangeRegex = /\/ByteRange\s*\[\s*(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s*\]/g;
  let match: RegExpExecArray | null;

  while ((match = byteRangeRegex.exec(pdfString)) !== null) {
    const start1 = parseInt(match[1], 10);
    const len1 = parseInt(match[2], 10);
    const start2 = parseInt(match[3], 10);
    const len2 = parseInt(match[4], 10);

    // Validação dos limites do ByteRange
    if (start1 < 0 || len1 < 0 || start2 < 0 || len2 < 0 || (start2 + len2) > pdfBuffer.length) {
      continue;
    }

    // O gap entre (start1 + len1) e start2 contém a assinatura em hexadecimal
    const gapBuffer = pdfBuffer.subarray(start1 + len1, start2);
    let gapString = gapBuffer.toString('latin1');

    // Remover delimitadores < e > se presentes nas pontas
    gapString = gapString.replace(/^[\s<]+/, '').replace(/[\s>]+$/, '');

    // Remover qualquer caractere que não seja hexadecimal
    const cleanHex = gapString.replace(/[^0-9a-fA-F]/g, '');
    if (!cleanHex || cleanHex.length < 50) {
      continue;
    }

    const validHex = cleanHex.length % 2 === 0 ? cleanHex : cleanHex + '0';
    const signatureBuffer = Buffer.from(validHex, 'hex');

    // Extrair subfilter se existir nos arredores do dicionário
    const dictContext = pdfString.substring(Math.max(0, match.index - 200), Math.min(pdfString.length, match.index + 300));
    const subFilterMatch = /\/SubFilter\s*\/([a-zA-Z0-9\._\-]+)/.exec(dictContext);
    const subFilter = subFilterMatch ? subFilterMatch[1] : undefined;

    signatures.push({
      byteRange: { start1, len1, start2, len2 },
      byteRangeArray: [start1, len1, start2, len2],
      signatureHex: validHex,
      signatureBuffer,
      subFilter
    });
  }

  return signatures;
}

/**
 * Concatena os bytes reais assinados pelo documento de acordo com a tabela /ByteRange.
 */
export function getSignedBytes(pdfBuffer: Buffer, byteRange: ByteRange): Buffer {
  const part1 = pdfBuffer.subarray(byteRange.start1, byteRange.start1 + byteRange.len1);
  const part2 = pdfBuffer.subarray(byteRange.start2, byteRange.start2 + byteRange.len2);
  return Buffer.concat([part1, part2]);
}
