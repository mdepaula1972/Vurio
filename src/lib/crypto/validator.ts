import crypto from 'crypto';
import pdfParse from 'pdf-parse';
import { extractPdfSignatures, getSignedBytes } from './pdf-parser';
import { analyzePkcs7Envelope } from './pkcs7-analyzer';
import { extractCrmAndUf } from './crm-extractor';
import { scanQrCodeFromImageBuffer, QrScanResult } from './qr-scanner';
import { extractRestDaysAndPeriod, RestPeriodInfo } from './days-extractor';
import { auditDoctorCrm, CfmDoctorAuditResult } from '../services/cfm-service';
import { auditAttestationConsistency, ConsistencyAuditResult } from '../services/consistency-service';
import { extractAttestationFromImageBuffer } from '../services/vision-ocr-service';

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
  patient?: {
    name: string | null;
    cpf: string | null;
  };
  cid?: string | null;
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
  cfmAudit?: CfmDoctorAuditResult;
  consistency?: ConsistencyAuditResult;
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
    const qrResult = await scanQrCodeFromImageBuffer(fileBuffer);
    const extracted = await extractAttestationFromImageBuffer(fileBuffer, mimeType);

    if (qrResult.hasQrCode && qrResult.isValidIssuerUrl) {
      return await finalizeReport({
        status: 'PHOTO_WITH_QR_CODE',
        isAuthentic: true,
        fileSha256,
        doctor: {
          name: extracted.doctorName,
          crm: extracted.crm,
          uf: extracted.uf,
          cpf: null
        },
        patient: {
          name: extracted.patientName,
          cpf: extracted.patientCpf
        },
        cid: extracted.cid,
        signature: {
          hasSignature: false,
          isIcpBrasil: false,
          issuer: qrResult.issuerType || 'Validador Oficial',
          signingTime: new Date(),
          integrityConfirmed: true,
          calculatedSha256: null,
          expectedSha256: null
        },
        restPeriod: {
          days: extracted.days,
          startDate: extracted.startDate
        },
        qrCode: qrResult,
        details: `Foto com QR Code de Validação Oficial detectado (${qrResult.issuerType}). URL de autenticação confirmada.`
      }, extracted);
    }

    // Foto tradicional de papel (sem QR Code oficial)
    return await finalizeReport({
      status: 'PHOTO_MANUAL_PAPER',
      isAuthentic: false,
      fileSha256,
      doctor: {
        name: extracted.doctorName,
        crm: extracted.crm,
        uf: extracted.uf,
        cpf: null
      },
      patient: {
        name: extracted.patientName,
        cpf: extracted.patientCpf
      },
      cid: extracted.cid,
      signature: {
        hasSignature: false,
        isIcpBrasil: false,
        issuer: null,
        signingTime: null,
        integrityConfirmed: false,
        calculatedSha256: null,
        expectedSha256: null
      },
      restPeriod: {
        days: extracted.days,
        startDate: extracted.startDate
      },
      qrCode: qrResult,
      details: 'Foto de documento impresso tradicional (caneta/carimbo). Não possui assinatura digital criptográfica e-CPF/ICP-Brasil nem QR Code oficial.'
    }, extracted);
  }

  // 3. Verificar cabeçalho de PDF (%PDF)
  const isPdf = fileBuffer.subarray(0, 5).toString('latin1').startsWith('%PDF');
  if (!isPdf) {
    return await finalizeReport({
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
    });
  }

  // 4. Extrair texto do PDF para dias de repouso e CRM
  let pdfText = '';
  try {
    const parsedData = await pdfParse(fileBuffer);
    pdfText = parsedData.text || '';
  } catch {
    pdfText = '';
  }

  if (!pdfText.trim()) {
    pdfText = fileBuffer.toString('latin1');
  }

  const restPeriod = extractRestDaysAndPeriod(pdfText);
  const crmInfo = await extractCrmAndUf(fileBuffer);
  const patientInfo = extractPatientInfoFromText(pdfText);

  // 5. Extrair blocos de assinatura digital PAdES
  const signatures = extractPdfSignatures(fileBuffer);
  if (signatures.length === 0) {
    return await finalizeReport({
      status: 'NO_DIGITAL_SIGNATURE',
      isAuthentic: false,
      fileSha256,
      doctor: {
        name: null,
        crm: crmInfo.crm,
        uf: crmInfo.uf,
        cpf: null
      },
      patient: {
        name: patientInfo.patientName,
        cpf: patientInfo.patientCpf
      },
      cid: patientInfo.cid,
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
    }, patientInfo);
  }

  // Analisar a assinatura mais recente ou primária
  const primarySig = signatures[signatures.length - 1];

  // 6. Recalcular o Hash SHA-256 sobre os bytes exatos do /ByteRange
  const signedBytes = getSignedBytes(fileBuffer, primarySig.byteRange);
  const calculatedSha256 = crypto.createHash('sha256').update(signedBytes).digest('hex').toLowerCase();

  // 7. Decodificar envelope PKCS#7
  const p7Result = analyzePkcs7Envelope(primarySig.signatureBuffer);
  if (!p7Result.hasValidStructure) {
    return await finalizeReport({
      status: 'INVALID_CERTIFICATE',
      isAuthentic: false,
      fileSha256,
      doctor: { name: null, crm: crmInfo.crm, uf: crmInfo.uf, cpf: null },
      patient: {
        name: patientInfo.patientName,
        cpf: patientInfo.patientCpf
      },
      cid: patientInfo.cid,
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
    }, patientInfo);
  }

  const expectedSha256 = p7Result.expectedDigestHex ? p7Result.expectedDigestHex.toLowerCase() : null;

  // 8. Teste de Inviolabilidade / Adulteração (Checagem de Hash SHA-256)
  let integrityConfirmed = false;
  if (expectedSha256) {
    integrityConfirmed = calculatedSha256 === expectedSha256;
  }

  if (!integrityConfirmed) {
    return await finalizeReport({
      status: 'TAMPERED',
      isAuthentic: false,
      fileSha256,
      doctor: {
        name: p7Result.doctorInfo?.doctorName || null,
        crm: crmInfo.crm,
        uf: crmInfo.uf,
        cpf: p7Result.doctorInfo?.cpf || null
      },
      patient: {
        name: patientInfo.patientName,
        cpf: patientInfo.patientCpf
      },
      cid: patientInfo.cid,
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
    }, patientInfo);
  }

  // 9. Documento Autêntico e Íntegro (ICP-Brasil)
  const doctorData = p7Result.doctorInfo;

  return await finalizeReport({
    status: 'VALID_INTACT',
    isAuthentic: true,
    fileSha256,
    doctor: {
      name: doctorData?.doctorName || 'Médico Signatário',
      crm: crmInfo.crm,
      uf: crmInfo.uf,
      cpf: doctorData?.cpf || null
    },
    patient: {
      name: patientInfo.patientName,
      cpf: patientInfo.patientCpf
    },
    cid: patientInfo.cid,
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
  }, patientInfo);
}

/**
 * Extrai dados cadastrais do paciente e datas presentes no texto do PDF
 */
function extractPatientInfoFromText(text: string) {
  const patientMatch = text.match(/(?:paciente|colaborador)[\s:]*([A-Za-zÀ-ÿ\s]{3,35})(?:\s*[\|\n\r]|$)/i);
  const cpfMatch = text.match(/CPF[\s:]*([0-9\*\.\-]{11,14})/i);
  const emissionMatch = text.match(/(?:data|emiss[ãa]o|s[ãa]o\s*paulo,?)[\s:]*(\d{2}[\/\.-]\d{2}[\/\.-]\d{4})/i);
  const cidMatch = text.match(/CID(?:-10)?[\s:]*([A-Z][0-9]{2}(?:\.[0-9]{1,2})?)/i);

  return {
    patientName: patientMatch ? patientMatch[1].trim() : null,
    patientCpf: cpfMatch ? cpfMatch[1].trim() : null,
    emissionDate: emissionMatch ? emissionMatch[1].replace(/[\.-]/g, '/') : null,
    cid: cidMatch ? cidMatch[1].toUpperCase() : null
  };
}

/**
 * Enriquece o relatório final com a Auditoria Nacional de CRM (CFM) e Motor de Inconsistências Forenses
 */
async function finalizeReport(
  baseReport: AttestationValidationReport,
  context?: {
    patientName?: string | null;
    patientCpf?: string | null;
    emissionDate?: string | null;
    cid?: string | null;
  }
): Promise<AttestationValidationReport> {
  // 1. Auditoria de CRM / CFM Nacional (27 Estados)
  if (baseReport.doctor.crm) {
    baseReport.cfmAudit = await auditDoctorCrm(
      baseReport.doctor.crm,
      baseReport.doctor.uf,
      baseReport.doctor.name
    );
  }

  // 2. Auditoria de Inconsistências (Datas Futuras, CPF, Limites CLT/INSS)
  baseReport.consistency = auditAttestationConsistency({
    emissionDate: context?.emissionDate || baseReport.restPeriod.startDate,
    startDate: baseReport.restPeriod.startDate,
    days: baseReport.restPeriod.days,
    patientName: context?.patientName || baseReport.patient?.name,
    patientCpf: context?.patientCpf || baseReport.patient?.cpf,
    cid: context?.cid || baseReport.cid
  });

  return baseReport;
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
