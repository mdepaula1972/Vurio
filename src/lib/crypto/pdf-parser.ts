/**
 * Utilitário de baixo nível para extração de estruturas PAdES (/ByteRange e /Contents) em buffers de PDF.
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
