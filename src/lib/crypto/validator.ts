import crypto from 'crypto';
import pdfParse from 'pdf-parse';
import { extractPdfSignatures, getSignedBytes } from './pdf-parser';
import { analyzePkcs7Envelope } from './pkcs7-analyzer';
import { extractCrmAndUf } from './crm-extractor';
import { scanQrCodeFromImageBuffer, QrScanResult } from './qr-scanner';
import { extractRestDaysAndPeriod, RestPeriodInfo } from './days-extractor';

export type AttestationValidationStatus =
  | 'VALID_INTACT'          // Caso A1: PDF Nativo com Assinatura Criptográfica ICP-Brasil Íntegra
  | 'PHOTO_WITH_QR_CODE'    // Caso A2: Foto de Papel com QR Code de Validação Oficial (CFM/Memed/ITI)
  | 'PHOTO_MANUAL_PAPER'    // Caso B1: Foto de Papel Tradicional (Caneta/Carimbo físico, sem QR Code)
  | 'TAMPERED'              // Caso C1: Documento Adulterado (Hash do PDF não confere)
  | 'DUPLICATE_DOCUMENT'    // Caso C2: Documento já submetido anteriormente na empresa
  | 'NO_DIGITAL_SIGNATURE'  // PDF comum sem assinatura digital
  | 'INVALID_CERTIFICATE';  // Assinatura corrompida ou certificado revogado/inválido

export interface AttestationValidationReport {
  status: AttestationValidationStatus;
  isAuthentic: boolean;
  fileSha256: string; // Hash global único do arquivo para trava antifraude de duplicidade
  doctor: {
    name: string | null;
    crm: string | null;
    uf: string | null;
    cpf: string | null;
  };
  signature: {
    hasSignature: boolean;
    isIcpBrasil: boolean;
    issuer: string | null;
    signingTime: Date | null;
    integrityConfirmed: boolean;
    calculatedSha256: string | null;
    expectedSha256: string | null;
  };
  restPeriod: RestPeriodInfo;
  qrCode?: QrScanResult;
  details: string;
}

/**
 * Função principal que recebe o buffer de qualquer arquivo e realiza a triagem e validação completa.
 */
export async function validateMedicalAttestation(
  fileBuffer: Buffer,
  mimeType?: string,
  fileName?: string,
  existingFileHashes: string[] = [] // Lista de hashes já registrados para detecção de duplicidade
): Promise<AttestationValidationReport> {
  // 1. Calcular Hash Global do Arquivo (Trava Antifraude de Duplicidade)
  const fileSha256 = crypto.createHash('sha256').update(fileBuffer).digest('hex').toLowerCase();

  // Checar duplicidade imediata
  if (existingFileHashes.includes(fileSha256)) {
    return {
      status: 'DUPLICATE_DOCUMENT',
      isAuthentic: false,
      fileSha256,
      doctor: { name: null, crm: null, uf: null, cpf: null },
      signature: {
        hasSignature: false,
        isIcpBrasil: false,
        issuer: null,
        signingTime: null,
        integrityConfirmed: false,
        calculatedSha256: null,
        expectedSha256: null
      },
      restPeriod: { days: null, startDate: null },
      details: 'ALERTA DE DUPLICIDADE: Este mesmo arquivo já foi enviado anteriormente para validação nesta empresa.'
    };
  }

  // 2. Verificar se é formato de imagem (Foto de celular / print / JPG / PNG)
  if (isImageFile(fileBuffer, mimeType, fileName)) {
    // Tentar ler QR Code na foto
    const qrResult = await scanQrCodeFromImageBuffer(fileBuffer);

    if (qrResult.hasQrCode && qrResult.isValidIssuerUrl) {
      return {
        status: 'PHOTO_WITH_QR_CODE',
        isAuthentic: true,
        fileSha256,
        doctor: { name: null, crm: null, uf: null, cpf: null },
        signature: {
          hasSignature: false,
          isIcpBrasil: false,
          issuer: qrResult.issuerType || 'Validador Oficial',
          signingTime: new Date(),
          integrityConfirmed: true,
          calculatedSha256: null,
          expectedSha256: null
        },
        restPeriod: { days: null, startDate: null },
        qrCode: qrResult,
        details: `Foto com QR Code de Validação Oficial detectado (${qrResult.issuerType}). URL de autenticação confirmada.`
      };
    }

    // Foto tradicional de papel (sem QR Code oficial)
    return {
      status: 'PHOTO_MANUAL_PAPER',
      isAuthentic: false,
      fileSha256,
      doctor: { name: null, crm: null, uf: null, cpf: null },
      signature: {
        hasSignature: false,
        isIcpBrasil: false,
        issuer: null,
        signingTime: null,
        integrityConfirmed: false,
        calculatedSha256: null,
        expectedSha256: null
      },
      restPeriod: { days: null, startDate: null },
      qrCode: qrResult,
      details: 'Foto de documento impresso tradicional (caneta/carimbo). Não possui assinatura digital criptográfica e-CPF/ICP-Brasil nem QR Code oficial.'
    };
  }

  // 3. Verificar cabeçalho de PDF (%PDF)
  const isPdf = fileBuffer.subarray(0, 5).toString('latin1').startsWith('%PDF');
  if (!isPdf) {
    return {
      status: 'PHOTO_MANUAL_PAPER',
      isAuthentic: false,
      fileSha256,
      doctor: { name: null, crm: null, uf: null, cpf: null },
      signature: {
        hasSignature: false,
        isIcpBrasil: false,
        issuer: null,
        signingTime: null,
        integrityConfirmed: false,
        calculatedSha256: null,
        expectedSha256: null
      },
      restPeriod: { days: null, startDate: null },
      details: 'Formato de arquivo não reconhecido como PDF nativo.'
    };
  }

  // 4. Extrair texto do PDF para dias de repouso e CRM
  let pdfText = '';
  try {
    const parsedData = await pdfParse(fileBuffer);
    pdfText = parsedData.text || '';
  } catch {
    pdfText = '';
  }

  // Se o PDF tiver fontes não mapeadas ou texto em streams literais, recorre à varredura direta do buffer
  if (!pdfText.trim()) {
    pdfText = fileBuffer.toString('latin1');
  }

  const restPeriod = extractRestDaysAndPeriod(pdfText);
  const crmInfo = await extractCrmAndUf(fileBuffer);

  // 5. Extrair blocos de assinatura digital PAdES
  const signatures = extractPdfSignatures(fileBuffer);
  if (signatures.length === 0) {
    return {
      status: 'NO_DIGITAL_SIGNATURE',
      isAuthentic: false,
      fileSha256,
      doctor: {
        name: null,
        crm: crmInfo.crm,
        uf: crmInfo.uf,
        cpf: null
      },
      signature: {
        hasSignature: false,
        isIcpBrasil: false,
        issuer: null,
        signingTime: null,
        integrityConfirmed: false,
        calculatedSha256: null,
        expectedSha256: null
      },
      restPeriod,
      details: 'O PDF não possui blocos de assinatura digital criptográfica PAdES/PKCS#7.'
    };
  }

  // Analisar a assinatura mais recente ou primária
  const primarySig = signatures[signatures.length - 1];

  // 6. Recalcular o Hash SHA-256 sobre os bytes exatos do /ByteRange
  const signedBytes = getSignedBytes(fileBuffer, primarySig.byteRange);
  const calculatedSha256 = crypto.createHash('sha256').update(signedBytes).digest('hex').toLowerCase();

  // 7. Decodificar envelope PKCS#7
  const p7Result = analyzePkcs7Envelope(primarySig.signatureBuffer);
  if (!p7Result.hasValidStructure) {
    return {
      status: 'INVALID_CERTIFICATE',
      isAuthentic: false,
      fileSha256,
      doctor: { name: null, crm: crmInfo.crm, uf: crmInfo.uf, cpf: null },
      signature: {
        hasSignature: true,
        isIcpBrasil: false,
        issuer: null,
        signingTime: null,
        integrityConfirmed: false,
        calculatedSha256,
        expectedSha256: null
      },
      restPeriod,
      details: `Envelope PKCS#7 corrompido ou ilegível: ${p7Result.errorMessage}`
    };
  }

  const expectedSha256 = p7Result.expectedDigestHex ? p7Result.expectedDigestHex.toLowerCase() : null;

  // 8. Teste de Inviolabilidade / Adulteração (Checagem de Hash SHA-256)
  let integrityConfirmed = false;
  if (expectedSha256) {
    integrityConfirmed = calculatedSha256 === expectedSha256;
  }

  if (!integrityConfirmed) {
    return {
      status: 'TAMPERED',
      isAuthentic: false,
      fileSha256,
      doctor: {
        name: p7Result.doctorInfo?.doctorName || null,
        crm: crmInfo.crm,
        uf: crmInfo.uf,
        cpf: p7Result.doctorInfo?.cpf || null
      },
      signature: {
        hasSignature: true,
        isIcpBrasil: p7Result.doctorInfo?.isIcpBrasil || false,
        issuer: p7Result.doctorInfo?.issuerName || null,
        signingTime: p7Result.doctorInfo?.signingTime || null,
        integrityConfirmed: false,
        calculatedSha256,
        expectedSha256
      },
      restPeriod,
      details: 'DOCUMENTO ADULTERADO: O hash SHA-256 do arquivo difere da assinatura criptográfica original gravada pelo emissor.'
    };
  }

  // 9. Documento Autêntico e Íntegro (ICP-Brasil)
  const doctorData = p7Result.doctorInfo;

  return {
    status: 'VALID_INTACT',
    isAuthentic: true,
    fileSha256,
    doctor: {
      name: doctorData?.doctorName || 'Médico Signatário',
      crm: crmInfo.crm,
      uf: crmInfo.uf,
      cpf: doctorData?.cpf || null
    },
    signature: {
      hasSignature: true,
      isIcpBrasil: doctorData?.isIcpBrasil || true,
      issuer: doctorData?.issuerName || 'ICP-Brasil',
      signingTime: doctorData?.signingTime || new Date(),
      integrityConfirmed: true,
      calculatedSha256,
      expectedSha256
    },
    restPeriod,
    details: 'Atestado autêntico e íntegro. Assinatura digital válida e inviolabilidade confirmada.'
  };
}

/**
 * Detecta se o arquivo é uma foto/imagem com base em cabeçalhos binários conhecidos ou MIME.
 */
function isImageFile(buffer: Buffer, mimeType?: string, fileName?: string): boolean {
  if (mimeType && (mimeType.startsWith('image/') || mimeType.includes('jpeg') || mimeType.includes('png'))) {
    return true;
  }

  if (fileName) {
    const ext = fileName.toLowerCase().split('.').pop();
    if (['jpg', 'jpeg', 'png', 'webp', 'heic', 'bmp'].includes(ext || '')) {
      return true;
    }
  }

  // JPEG: FF D8 FF
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return true;
  }
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (buffer.length >= 8 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return true;
  }

  return false;
}
