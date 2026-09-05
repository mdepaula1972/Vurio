import * as forge from 'node-forge';

export interface DoctorCertificateInfo {
  doctorName: string;
  cpf: string | null;
  issuerName: string;
  signingTime: Date | null;
  validFrom: Date | null;
  validTo: Date | null;
  isIcpBrasil: boolean;
  certificatePem?: string;
}

export interface Pkcs7ValidationResult {
  hasValidStructure: boolean;
  expectedDigestHex: string | null;
  digestAlgorithm: string;
  doctorInfo: DoctorCertificateInfo | null;
  errorMessage?: string;
}

// OIDs conhecidos
const OID_MESSAGE_DIGEST = '1.2.840.113549.1.9.4';
const OID_SIGNING_TIME = '1.2.840.113549.1.9.5';
const OID_ICP_BRASIL_PF = '2.16.76.1.3.1'; // Titular PF: Data Nasc (8), CPF (11), NIS/PIS (11), RG (15), etc.

/**
 * Decodifica o envelope PKCS#7/CMS e extrai os atributos assinados e o certificado do médico.
 */
export function analyzePkcs7Envelope(signatureBuffer: Buffer): Pkcs7ValidationResult {
  try {
    const rawDer = signatureBuffer.toString('binary');
    // Em assinaturas PAdES, o /Contents reservado costuma conter zeros de padding no final.
    // Usar parseAllBytes: false e strict: false permite decodificar ignorando os bytes remanescentes de padding.
    const asn1 = (forge.asn1.fromDer as any)(rawDer, { parseAllBytes: false, strict: false });
    const p7 = forge.pkcs7.messageFromAsn1(asn1);

    // Identificar algoritmo de digest (padrão SHA-256)
    let digestAlgorithm = 'sha256';
    // O envelope pode ter digestAlgorithmOids
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawP7 = p7 as any;

    let expectedDigestHex: string | null = null;
    let signingTime: Date | null = null;

    // Buscar no signerInfo (authenticatedAttributes / signedAttributes)
    if (rawP7.rawCapture && rawP7.rawCapture.authenticatedAttributes) {
      const attrs = rawP7.rawCapture.authenticatedAttributes;
      for (const attr of attrs) {
        const oid = forge.asn1.derToOid(attr.value[0].value);
        if (oid === OID_MESSAGE_DIGEST) {
          // O valor está no Set de valores
          const digestAsn1 = attr.value[1].value[0];
          expectedDigestHex = Buffer.from(digestAsn1.value, 'binary').toString('hex');
        } else if (oid === OID_SIGNING_TIME) {
          const timeAsn1 = attr.value[1].value[0];
          // UTCTime ou GeneralizedTime
          const timeStr = timeAsn1.value;
          signingTime = parseAsn1Time(timeStr);
        }
      }
    }

    // Se não encontrou via rawCapture, inspecionar nos signers
    if (!expectedDigestHex && rawP7.signers && rawP7.signers.length > 0) {
      const signer = rawP7.signers[0];
      if (signer.authenticatedAttributes) {
        for (const attr of signer.authenticatedAttributes) {
          if (attr.type === OID_MESSAGE_DIGEST) {
            const rawVal = attr.value[0].value;
            expectedDigestHex = Buffer.from(rawVal, 'binary').toString('hex');
          } else if (attr.type === OID_SIGNING_TIME) {
            signingTime = new Date(attr.value[0].value);
          }
        }
      }
    }

    // Extrair certificados
    let doctorInfo: DoctorCertificateInfo | null = null;
    if (rawP7.certificates && rawP7.certificates.length > 0) {
      // O primeiro certificado geralmente é o do signatário final (médico)
      const cert = rawP7.certificates[0];
      doctorInfo = extractDoctorDataFromCert(cert, signingTime);
    }

    return {
      hasValidStructure: true,
      expectedDigestHex,
      digestAlgorithm,
      doctorInfo
    };
  } catch (err: any) {
    return {
      hasValidStructure: false,
      expectedDigestHex: null,
      digestAlgorithm: 'sha256',
      doctorInfo: null,
      errorMessage: err?.message || 'Falha ao decodificar envelope PKCS#7'
    };
  }
}

/**
 * Extrai dados do médico do certificado X.509
 */
function extractDoctorDataFromCert(cert: forge.pki.Certificate, signingTime: Date | null): DoctorCertificateInfo {
  // Extrair Common Name (CN) do Subject
  let doctorName = 'Não identificado';
  const cnAttr = cert.subject.attributes.find((a: any) => a.name === 'commonName' || a.type === '2.5.4.3');
  if (cnAttr && cnAttr.value) {
    doctorName = String(cnAttr.value);
  }

  // Extrair Issuer (Nome da Autoridade Certificadora)
  let issuerName = 'Autoridade Certificadora Desconhecida';
  const issuerCn = cert.issuer.attributes.find((a: any) => a.name === 'commonName' || a.type === '2.5.4.3');
  const issuerOrg = cert.issuer.attributes.find((a: any) => a.name === 'organizationName' || a.type === '2.5.4.10');
  if (issuerCn && issuerCn.value) {
    issuerName = String(issuerCn.value);
  } else if (issuerOrg && issuerOrg.value) {
    issuerName = String(issuerOrg.value);
  }

  // Verificar se pertence à cadeia ICP-Brasil
  const isIcpBrasil = checkIsIcpBrasil(cert, issuerName);

  // Extrair CPF do médico (pelo CN ou extensão ICP-Brasil)
  const cpf = extractCpfFromCertificate(cert, doctorName);

  // Se o CN contiver o CPF anexado (ex: "FULANO DE TAL:12345678901"), limpa o nome
  const cleanDoctorName = sanitizeDoctorName(doctorName);

  return {
    doctorName: cleanDoctorName,
    cpf,
    issuerName,
    signingTime: signingTime || (cert.validity ? cert.validity.notBefore : null),
    validFrom: cert.validity ? cert.validity.notBefore : null,
    validTo: cert.validity ? cert.validity.notAfter : null,
    isIcpBrasil
  };
}

/**
 * Remove números de CPF ou códigos anexados ao CN do médico
 */
function sanitizeDoctorName(rawName: string): string {
  // Padrão comum ICP-Brasil: "MARIA DA SILVA:12345678909" ou "MARIA DA SILVA 12345678909"
  const colonIndex = rawName.indexOf(':');
  if (colonIndex > 0) {
    return rawName.substring(0, colonIndex).trim();
  }
  return rawName.replace(/\b\d{11}\b/g, '').trim();
}

/**
 * Tenta extrair CPF do certificado via OID ICP-Brasil ou regex no Subject
 */
function extractCpfFromCertificate(cert: forge.pki.Certificate, rawName: string): string | null {
  // 1. Procurar nas extensões pelo OID específico da ICP-Brasil (2.16.76.1.3.1)
  if (cert.extensions && cert.extensions.length > 0) {
    for (const ext of cert.extensions) {
      if (ext.id === OID_ICP_BRASIL_PF && ext.value) {
        // A extensão 2.16.76.1.3.1 contém OCTET STRING com formato padronizado:
        // Posições: DDMMAAAA(8) + CPF(11) + NIS(11) + RG(15)...
        try {
          const rawExt = ext.value;
          // Procurar sequência de 11 dígitos numéricos válidos
          const matchCpf = rawExt.match(/\d{11}/);
          if (matchCpf) {
            return formatCpf(matchCpf[0]);
          }
        } catch {
          // fallback
        }
      }
    }
  }

  // 2. Extrair do CN se contiver formato :00000000000
  const matchCn = rawName.match(/[:\s](\d{11})\b/);
  if (matchCn) {
    return formatCpf(matchCn[1]);
  }

  return null;
}

function formatCpf(cpfRaw: string): string {
  if (cpfRaw.length === 11) {
    return `${cpfRaw.slice(0, 3)}.${cpfRaw.slice(3, 6)}.${cpfRaw.slice(6, 9)}-${cpfRaw.slice(9, 11)}`;
  }
  return cpfRaw;
}

function checkIsIcpBrasil(cert: forge.pki.Certificate, issuerName: string): boolean {
  const issuerLower = issuerName.toLowerCase();
  if (
    issuerLower.includes('icp-brasil') ||
    issuerLower.includes('autoridade certificadora') ||
    issuerLower.includes('ac ') ||
    issuerLower.includes('soluti') ||
    issuerLower.includes('certisign') ||
    issuerLower.includes('valid') ||
    issuerLower.includes('serpro') ||
    issuerLower.includes('serasa') ||
    issuerLower.includes('cfm')
  ) {
    return true;
  }

  // Checar extensões do certificado
  if (cert.extensions) {
    for (const ext of cert.extensions) {
      if (ext.id && ext.id.startsWith('2.16.76.')) {
        return true; // Prefixo da ICP-Brasil (OIDs regulamentados pelo ITI)
      }
    }
  }

  return false;
}

function parseAsn1Time(timeStr: string): Date | null {
  try {
    // Formato UTCTime: YYMMDDHHMMSSZ ou GeneralizedTime: YYYYMMDDHHMMSSZ
    if (timeStr.length === 13) {
      // UTCTime
      const year = parseInt(timeStr.substring(0, 2), 10);
      const fullYear = year < 50 ? 2000 + year : 1900 + year;
      const month = parseInt(timeStr.substring(2, 4), 10) - 1;
      const day = parseInt(timeStr.substring(4, 6), 10);
      const hour = parseInt(timeStr.substring(6, 8), 10);
      const min = parseInt(timeStr.substring(8, 10), 10);
      const sec = parseInt(timeStr.substring(10, 12), 10);
      return new Date(Date.UTC(fullYear, month, day, hour, min, sec));
    } else if (timeStr.length >= 15) {
      // GeneralizedTime
      const year = parseInt(timeStr.substring(0, 4), 10);
      const month = parseInt(timeStr.substring(4, 6), 10) - 1;
      const day = parseInt(timeStr.substring(6, 8), 10);
      const hour = parseInt(timeStr.substring(8, 10), 10);
      const min = parseInt(timeStr.substring(10, 12), 10);
      const sec = parseInt(timeStr.substring(12, 14), 10);
      return new Date(Date.UTC(year, month, day, hour, min, sec));
    }
    return new Date(timeStr);
  } catch {
    return null;
  }
}
