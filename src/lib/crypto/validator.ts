import crypto from 'crypto';
import pdfParse from 'pdf-parse';
import { extractPdfSignatures, getSignedBytes, inspectPdfReprint } from './pdf-parser';
import { analyzePkcs7Envelope } from './pkcs7-analyzer';
import { extractCrmAndUf } from './crm-extractor';
import { scanQrCodeFromImageBuffer, QrScanResult } from './qr-scanner';
import { extractRestDaysAndPeriod, RestPeriodInfo } from './days-extractor';
import { auditDoctorCrm, CfmDoctorAuditResult } from '../services/cfm-service';
import { auditAttestationConsistency, ConsistencyAuditResult } from '../services/consistency-service';
import { extractAttestationFromImageBuffer } from '../services/vision-ocr-service';
import { auditGeoDistance, GeoAuditResult } from '../services/geo-audit-service';
import { getCompanyPolicy } from '../services/company-policy-service';

export type AttestationValidationStatus =
  | 'VALID_INTACT'          // Caso A1: PDF Nativo com Assinatura Criptográfica ICP-Brasil Íntegra
  | 'PHOTO_WITH_QR_CODE'    // Caso A2: Foto de Papel com QR Code de Validação Oficial (CFM/Memed/ITI)
  | 'PHOTO_MANUAL_PAPER'    // Caso B1: Foto de Papel Tradicional (Caneta/Carimbo físico, sem QR Code)
  | 'REPRINTED_BROWSER_PDF' // Caso B2: PDF Re-salvo via Navegador / Impressora Virtual (PDFium/Chromium)
  | 'TAMPERED'              // Caso C1: Documento Adulterado (Hash do PDF não confere)
  | 'DUPLICATE_DOCUMENT'    // Caso C2: Documento já submetido anteriormente na empresa
  | 'NO_DIGITAL_SIGNATURE'  // PDF comum sem assinatura digital
  | 'INVALID_CERTIFICATE'   // Assinatura corrompida ou certificado revogado/inválido
  | 'NOT_AN_ATTESTATION';   // Documento não é atestado ou declaração médica (ex: contrato, nota fiscal, foto comum)

export interface AttestationValidationReport {
  status: AttestationValidationStatus;
  isAuthentic: boolean;
  fileSha256: string; // Hash global único do arquivo para trava antifraude de duplicidade
  doctor: {
    name: string | null;
    crm: string | null;
    uf: string | null;
    cpf: string | null;
    councilType?: 'CRM' | 'CRO' | 'CRP' | 'CREFITO' | 'CRN' | 'RMS' | null;
    councilNumber?: string | null;
    professionalTitle?: string;
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
  geoAudit?: GeoAuditResult;
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
          cpf: null,
          councilType: extracted.councilType || 'CRM',
          councilNumber: extracted.councilNumber || extracted.crm,
          professionalTitle: extracted.professionalTitle || (extracted.councilType === 'CRO' ? 'Cirurgião-Dentista' : 'Médico(a)')
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

    // Se o Gemini indicou que a imagem NÃO é um documento médico e não há QR Code médico oficial
    if (extracted.isMedicalAttestation === false) {
      return {
        status: 'NOT_AN_ATTESTATION',
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
        details: 'A imagem enviada não foi identificada como um atestado médico, receituário ou declaração de saúde.'
      };
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

  // Fallback seguro caso o parser de XRef/fontes falhe: extrai strings literais presentes nos operadores Tj
  if (!pdfText.trim()) {
    const streamMatches = fileBuffer.toString('latin1').match(/\(([^)]+)\)\s*Tj/g);
    if (streamMatches) {
      pdfText = streamMatches.map(m => m.replace(/^\(|\)\s*Tj$/g, '')).join(' ');
    }
  }

  const hasMedicalContext = checkMedicalVocabulary(pdfText);
  const restPeriod = extractRestDaysAndPeriod(pdfText);
  const crmInfo = await extractCrmAndUf(fileBuffer);
  const patientInfo = extractPatientInfoFromText(pdfText);

  // 5. Extrair blocos de assinatura digital PAdES
  const signatures = extractPdfSignatures(fileBuffer);

  // Se o PDF tem texto legível, mas não possui vocabulário médico nem Conselho Profissional (CRM/CRO/etc.)
  if (pdfText.trim().length > 20 && !hasMedicalContext && !crmInfo.councilNumber && !crmInfo.crm) {
    return {
      status: 'NOT_AN_ATTESTATION',
      isAuthentic: false,
      fileSha256,
      doctor: { name: null, crm: null, uf: null, cpf: null },
      signature: {
        hasSignature: signatures.length > 0,
        isIcpBrasil: false,
        issuer: null,
        signingTime: null,
        integrityConfirmed: false,
        calculatedSha256: null,
        expectedSha256: null
      },
      restPeriod: { days: null, startDate: null },
      details: 'O documento PDF enviado não contém termos característicos de um atestado médico ou declaração de saúde.'
    };
  }

  // Inspeção forense de impressoras virtuais e reimpressão em navegador (PDFium/Chromium/Skia)
  const reprintInspection = inspectPdfReprint(fileBuffer);

  if (signatures.length === 0) {
    if (reprintInspection.isReprintedPdf) {
      let recoveredDoctor = {
        name: null as string | null,
        crm: crmInfo.crm,
        uf: crmInfo.uf,
        cpf: null as string | null
      };
      let isIcpBrasil = false;
      let issuer = reprintInspection.producerMetadata.virtualPrinterEngine || 'Navegador Web';
      let signingTime: Date | null = null;

      if (reprintInspection.recoveredSignatureBuffer) {
        const p7Recovery = analyzePkcs7Envelope(reprintInspection.recoveredSignatureBuffer);
        if (p7Recovery.doctorInfo) {
          recoveredDoctor = {
            name: p7Recovery.doctorInfo.doctorName || null,
            crm: crmInfo.crm,
            uf: crmInfo.uf,
            cpf: p7Recovery.doctorInfo.cpf || null
          };
          isIcpBrasil = p7Recovery.doctorInfo.isIcpBrasil;
          issuer = p7Recovery.doctorInfo.issuerName || issuer;
          signingTime = p7Recovery.doctorInfo.signingTime;
        }
      }

      return await finalizeReport({
        status: 'REPRINTED_BROWSER_PDF',
        isAuthentic: false,
        fileSha256,
        doctor: recoveredDoctor,
        patient: {
          name: patientInfo.patientName,
          cpf: patientInfo.patientCpf
        },
        cid: patientInfo.cid,
        signature: {
          hasSignature: !!reprintInspection.recoveredSignatureBuffer,
          isIcpBrasil,
          issuer,
          signingTime,
          integrityConfirmed: false,
          calculatedSha256: null,
          expectedSha256: null
        },
        restPeriod,
        details: `Aviso Técnico: Documento re-salvo via navegador ou impressora virtual (identificado motor ${reprintInspection.producerMetadata.virtualPrinterEngine || 'PDFium/Chromium'}). A assinatura digital original foi suprimida durante o processo de impressão virtual. Orientação recomendada: Solicite ao colaborador o arquivo PDF original baixado diretamente do portal/e-mail da clínica ou valide a autenticidade através da chave/QR Code do CFM.`
      }, patientInfo);
    }

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
    if (reprintInspection.isReprintedPdf) {
      return await finalizeReport({
        status: 'REPRINTED_BROWSER_PDF',
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
          issuer: p7Result.doctorInfo?.issuerName || reprintInspection.producerMetadata.virtualPrinterEngine || 'Navegador Web',
          signingTime: p7Result.doctorInfo?.signingTime || null,
          integrityConfirmed: false,
          calculatedSha256,
          expectedSha256
        },
        restPeriod,
        details: `Aviso Técnico: Documento re-salvo via navegador ou impressora virtual (identificado motor ${reprintInspection.producerMetadata.virtualPrinterEngine || 'PDFium/Chromium'}). A assinatura digital original foi suprimida durante o processo de impressão virtual. Orientação recomendada: Solicite ao colaborador o arquivo PDF original baixado diretamente do portal/e-mail da clínica ou valide a autenticidade através da chave/QR Code do CFM.`
      }, patientInfo);
    }

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

  // Se o PDF tem assinatura digital, mas NÃO possui nenhum vocabulário médico e NÃO possui CRM válido:
  if (pdfText.trim().length > 20 && !hasMedicalContext && !crmInfo.crm) {
    return {
      status: 'NOT_AN_ATTESTATION',
      isAuthentic: false,
      fileSha256,
      doctor: {
        name: doctorData?.doctorName || null,
        crm: null,
        uf: null,
        cpf: doctorData?.cpf || null
      },
      signature: {
        hasSignature: true,
        isIcpBrasil: doctorData?.isIcpBrasil || false,
        issuer: doctorData?.issuerName || null,
        signingTime: doctorData?.signingTime || null,
        integrityConfirmed: true,
        calculatedSha256,
        expectedSha256
      },
      restPeriod: { days: null, startDate: null },
      details: 'Documento assinado digitalmente, porém não identificado como atestado médico (ausência de termos médicos e CRM).'
    };
  }

  return await finalizeReport({
    status: 'VALID_INTACT',
    isAuthentic: true,
    fileSha256,
    doctor: {
      name: doctorData?.doctorName || (crmInfo.councilType === 'CRO' ? 'Cirurgião-Dentista Signatário' : 'Médico Signatário'),
      crm: crmInfo.crm,
      uf: crmInfo.uf,
      cpf: doctorData?.cpf || null,
      councilType: crmInfo.councilType || 'CRM',
      councilNumber: crmInfo.councilNumber || crmInfo.crm,
      professionalTitle: crmInfo.professionalTitle || (crmInfo.councilType === 'CRO' ? 'Cirurgião-Dentista' : 'Médico(a)')
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
 * Verifica se o texto do documento possui termos essenciais do universo médico / atestados
 */
function checkMedicalVocabulary(text: string): boolean {
  if (!text || text.trim().length === 0) return false;
  const lower = text.toLowerCase();
  const medicalWords = [
    'atestado', 'atesto', 'declaracao de comparecimento', 'declaração de comparecimento',
    'repouso', 'afastamento', 'dispensa do trabalho', 'dispensa laboral',
    'paciente', 'medico', 'médico', 'medica', 'médica', 'cid-10', 'cid10', 'cid:',
    'receituario', 'receituário', 'posologia', 'diagnostico', 'diagnóstico',
    'clinica medica', 'clínica médica', 'consulta medica', 'consulta médica',
    'atendimento medico', 'atendimento médico', 'crm/',
    // Odontologia (CRO)
    'odontolog', 'dentista', 'cirurgiao-dentista', 'cirurgião-dentista', 'cirurgia bucal',
    'extracao dentaria', 'extração dentária', 'endodontia', 'dente', 'dentes', 'cro/', 'cro-',
    // Psicologia / Fisioterapia / Multiprofissional
    'psicolog', 'psicoterapia', 'crp/', 'crp-', 'fisioterap', 'crefito', 'sessao', 'sessão'
  ];
  for (const word of medicalWords) {
    if (lower.includes(word)) {
      return true;
    }
  }
  return false;
}

/**
 * Extrai dados cadastrais do paciente e datas presentes no texto do PDF
 */
function extractPatientInfoFromText(text: string) {
  let patientName: string | null = null;
  let patientCpf: string | null = null;
  let emissionDate: string | null = null;
  let cid: string | null = null;

  // 1. CPF do paciente / colaborador
  const cpfMatch = text.match(/(?:CPF|C\.P\.F\.)[\s:]*([0-9\*\.\-]{11,14})/i);
  if (cpfMatch) {
    patientCpf = cpfMatch[1].trim();
  }

  // 2. Data de emissão do atestado
  const emissionMatch = text.match(/(?:data\s*(?:de)?\s*(?:emiss[ãa]o)?|emiss[ãa]o|s[ãa]o\s*paulo,?)[\s:]*(\d{2}[\/\.-]\d{2}[\/\.-]\d{4})/i);
  if (emissionMatch) {
    emissionDate = emissionMatch[1].replace(/[\.-]/g, '/');
  }

  // 3. CID (captura preliminar no documento)
  const cidMatch = text.match(/CID(?:-?10)?[\s:]*([A-Z][0-9]{2}(?:\.[0-9]{1,2})?)/i);
  if (cidMatch) {
    cid = cidMatch[1].toUpperCase();
  }

  // 4. Extração Inteligente do Nome do Paciente (Múltiplas Fórmulas Típicas de Atestado no Brasil)
  const patientPatterns = [
    // Padrão A: "Nome:", "Nome do Paciente:", "Paciente:", "Colaborador:"
    /(?:nome\s*(?:completo)?\s*(?:do\s*paciente)?|paciente|colaborador|identifica[çc][ãa]o\s*do\s*paciente)[\s:]+([A-Za-zÀ-ÿ\s'\-]{3,60})(?:\r?\n|[,;|\(\/\\]|\s+CPF|\s+RG|\s+DN|\s+nasc|\s+idade|$)/i,

    // Padrão B: "Atesto para os devidos fins que o(a) Sr(a)..." ou "Atesto que o(a) Sr(a)..."
    /atesto(?:\s+para\s+os\s+devidos\s+fins)?\s+que\s+(?:o\(a\)|a|o)?\s*(?:sr\(a\)\.?|sr\.?|sra\.?|paciente)?\s*([A-Za-zÀ-ÿ\s'\-]{3,60})(?:[,;|\(\/\\]|\s+portador|\s+compareceu|\s+esteve|\s+necessita|\s+encontra|\s+foi|\s+CPF|\s+RG|$)/i,

    // Padrão C: "Declaro para os devidos fins que..." ou "Declaro que..."
    /declaro(?:\s+para\s+os\s+devidos\s+fins)?\s+que\s+(?:o\(a\)|a|o)?\s*(?:sr\(a\)\.?|sr\.?|sra\.?|paciente)?\s*([A-Za-zÀ-ÿ\s'\-]{3,60})(?:[,;|\(\/\\]|\s+portador|\s+compareceu|\s+esteve|\s+necessita|\s+encontra|\s+foi|\s+CPF|\s+RG|$)/i,

    // Padrão D: "Certifico que o(a)..."
    /certifico\s+que\s+(?:o\(a\)|a|o)?\s*(?:sr\(a\)\.?|sr\.?|sra\.?|paciente)?\s*([A-Za-zÀ-ÿ\s'\-]{3,60})(?:[,;|\(\/\\]|\s+portador|\s+compareceu|\s+esteve|\s+necessita|\s+encontra|\s+foi|\s+CPF|\s+RG|$)/i
  ];

  for (const pattern of patientPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      let rawName = match[1].replace(/\r?\n/g, ' ').replace(/\s+/g, ' ').trim();

      // Limpeza de sufixos residuais que possam ter entrado na captura
      const cutWords = [
        'portador', 'portadora', 'compareceu', 'esteve', 'necessita', 
        'afastado', 'afastada', 'encontra-se', 'encontra', 'atendido', 
        'atendida', 'residente', 'inscrito', 'inscrita', 'cpf', 'rg'
      ];
      for (const cut of cutWords) {
        const cutIdx = rawName.toLowerCase().indexOf(` ${cut}`);
        if (cutIdx > 0) {
          rawName = rawName.substring(0, cutIdx).trim();
        }
      }

      // Validação de sanidade do nome (comprimento e ausência de termos médicos genéricos)
      const cleanLower = rawName.toLowerCase();
      if (
        rawName.length >= 3 && 
        rawName.length <= 60 && 
        !cleanLower.includes('crm') && 
        !cleanLower.includes('medico') && 
        !cleanLower.includes('médico') && 
        !cleanLower.includes('atestado') &&
        !cleanLower.includes('clinica') &&
        !cleanLower.includes('clínica')
      ) {
        patientName = rawName;
        break;
      }
    }
  }

  return {
    patientName,
    patientCpf,
    emissionDate,
    cid
  };
}

/**
 * Enriquece o relatório final com a Auditoria Nacional de CRM (CFM), Motor de Inconsistências e Geo-Shield
 */
async function finalizeReport(
  baseReport: AttestationValidationReport,
  context?: {
    patientName?: string | null;
    patientCpf?: string | null;
    emissionDate?: string | null;
    cid?: string | null;
    clinicName?: string | null;
    clinicAddress?: string | null;
  }
): Promise<AttestationValidationReport> {
  const policy = getCompanyPolicy();

  // 1. Auditoria de CRM / CFM Nacional (27 Estados) - Executada apenas para médicos (CRM)
  const isDoctor = !baseReport.doctor.councilType || baseReport.doctor.councilType === 'CRM';
  if (baseReport.doctor.crm && isDoctor) {
    baseReport.cfmAudit = await auditDoctorCrm(
      baseReport.doctor.crm,
      baseReport.doctor.uf,
      baseReport.doctor.name
    );
  }

  // 2. Auditoria de Inconsistências (Datas Futuras, CPF, Limites CLT/INSS, Prazo da CCT)
  const maxDays = Math.max(1, Math.round(policy.maxRetroactiveHours / 24));
  baseReport.consistency = auditAttestationConsistency({
    emissionDate: context?.emissionDate || baseReport.restPeriod.startDate,
    startDate: baseReport.restPeriod.startDate,
    days: baseReport.restPeriod.days,
    patientName: context?.patientName || baseReport.patient?.name,
    patientCpf: context?.patientCpf || baseReport.patient?.cpf,
    cid: context?.cid || baseReport.cid,
    maxRetroactiveDays: maxDays
  });

  // 3. Auditoria Geográfica (Geo-Shield Add-on)
  // IMPORTANTE: rawAddress deve vir exclusivamente de contexto de endereço da clínica/médico,
  // JAMAIS de baseReport.details (que armazena pareceres técnicos ou mensagens forenses).
  if (policy.geoShieldEnabled) {
    const rawAddress = context?.clinicAddress || context?.clinicName || '';
    if (rawAddress && policy.workCity) {
      baseReport.geoAudit = auditGeoDistance({
        clinicAddressOrCity: rawAddress,
        employeeWorkCity: policy.workCity,
        distanceThresholdKm: policy.maxAllowedDistanceKm
      });
    } else {
      // Se não há endereço explícito da clínica ou do colaborador, não calcula distância fictícia
      baseReport.geoAudit = {
        hasAddonActive: true,
        isCompatible: true,
        distanceKm: null,
        clinicCity: 'Não informada no documento',
        workCity: policy.workCity || 'Não informada no cadastro',
        telemedicineDetected: false
      };
    }
  }

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
