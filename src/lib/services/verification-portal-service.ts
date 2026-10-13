/**
 * Vurio - Roteador de Portais Oficiais de Validação e Resolução de Links
 * Resolve dinamicamente o portal governamental ou emissor correto para validação
 * externa de atestados e receituários médicos (CFM Prescrição, Atesta CFM, Memed, ITI/ICP-Brasil).
 */

export interface VerificationPortalResolution {
  portalType: 'CFM_PRESCRICAO' | 'ATESTA_CFM' | 'MEMED' | 'ITI_ICP_BRASIL' | 'GENERIC';
  portalName: string;
  validationUrl: string;
  verificationCode?: string;
  actionLabel: string;
  instructionText: string;
  isOfficialGov: boolean;
}

/**
 * Extrai qualquer código de verificação ou URL oficial presente no texto ou metadados do documento.
 */
export function extractVerificationCodeOrUrl(text: string): string | null {
  if (!text) return null;

  // 1. Padrão Prescrição Eletrônica CFM com prefixo (ex: CFMP-AT-USVLG4BW ou CFMP-RC-XXXXXX)
  const cfmPrescricaoMatch = text.match(/\b(CFMP-(?:AT|RC)-[A-Z0-9]+)\b/i);
  if (cfmPrescricaoMatch) {
    return cfmPrescricaoMatch[1].toUpperCase();
  }

  // 2. URL direta do portal de prescrição do CFM
  const cfmUrlMatch = text.match(/(?:https?:\/\/)?prescricao\.cfm\.org\.br[^\s)]*/i);
  if (cfmUrlMatch) {
    return cfmUrlMatch[0];
  }

  // 3. Máscara estrita do Atesta CFM (XXXX-XX-XXXXXX)
  const atestaCfmMatch = text.match(/\b([A-Z0-9]{4}-[A-Z0-9]{2}-[A-Z0-9]{6})\b/i);
  if (atestaCfmMatch) {
    return atestaCfmMatch[1].toUpperCase();
  }

  // 4. URL oficial do Atesta CFM
  const atestaUrlMatch = text.match(/(?:https?:\/\/)?(?:validar\.)?atestacfm\.org\.br[^\s)]*/i);
  if (atestaUrlMatch) {
    return atestaUrlMatch[0];
  }

  // 5. Plataformas homologadas de terceiros (ex: Memed)
  const memedUrlMatch = text.match(/(?:https?:\/\/)?(?:[a-z0-9.-]+\.)?memed\.com\.br[^\s)]*/i);
  if (memedUrlMatch) {
    return memedUrlMatch[0];
  }

  // 6. Validador oficial do ITI (ICP-Brasil)
  const itiUrlMatch = text.match(/(?:https?:\/\/)?validar\.iti\.gov\.br[^\s)]*/i);
  if (itiUrlMatch) {
    return itiUrlMatch[0];
  }

  return null;
}

/**
 * Resolve o portal oficial correto de conferência externa com base no código ou URL extraída.
 */
export function resolveVerificationPortal(
  codeOrUrl?: string | null,
  hasDigitalSignature: boolean = false
): VerificationPortalResolution {
  const sanitized = (codeOrUrl || '').trim();

  // 1. Padrão Prescrição Eletrônica CFM (prefixos CFMP-AT ou CFMP-RC ou link prescricao.cfm)
  if (
    /^CFMP-(?:AT|RC)-[A-Z0-9]+$/i.test(sanitized) ||
    sanitized.toLowerCase().includes('prescricao.cfm.org.br')
  ) {
    const codeMatch = sanitized.match(/CFMP-(?:AT|RC)-[A-Z0-9]+/i);
    const code = codeMatch ? codeMatch[0].toUpperCase() : sanitized;

    return {
      portalType: 'CFM_PRESCRICAO',
      portalName: 'Portal de Prescrição Eletrônica do CFM',
      validationUrl: 'https://prescricao.cfm.org.br/documento',
      verificationCode: code,
      actionLabel: 'Validar no Portal CFM Prescrição',
      instructionText: `Acesse o portal oficial de Prescrição do CFM e insira a chave ${code} no campo de consulta de documento.`,
      isOfficialGov: true
    };
  }

  // 2. Padrão Atesta CFM (Máscara clássica XXXX-XX-XXXXXX)
  if (/^[A-Z0-9]{4}-[A-Z0-9]{2}-[A-Z0-9]{6}$/i.test(sanitized)) {
    return {
      portalType: 'ATESTA_CFM',
      portalName: 'Plataforma Atesta CFM',
      validationUrl: 'https://validar.atestacfm.org.br',
      verificationCode: sanitized.toUpperCase(),
      actionLabel: 'Validar no Atesta CFM',
      instructionText: `Acesse o Atesta CFM e valide o código no formato padrão ${sanitized.toUpperCase()}.`,
      isOfficialGov: true
    };
  }

  // 3. Plataformas Homologadas de Terceiros (ex: Memed)
  if (sanitized.toLowerCase().includes('memed.com.br')) {
    return {
      portalType: 'MEMED',
      portalName: 'Validador Memed',
      validationUrl: sanitized.startsWith('http') ? sanitized : `https://${sanitized}`,
      verificationCode: undefined,
      actionLabel: 'Conferir na Plataforma Emissora',
      instructionText: 'Acesse o validador da emissora para conferir a via digital original.',
      isOfficialGov: false
    };
  }

  // 4. Se tiver assinatura digital PAdES/ICP-Brasil ou PDF nativo
  if (hasDigitalSignature) {
    return {
      portalType: 'ITI_ICP_BRASIL',
      portalName: 'Validador Oficial do Governo Federal (ITI)',
      validationUrl: 'https://validar.iti.gov.br',
      verificationCode: undefined,
      actionLabel: 'Validar Assinatura no ITI',
      instructionText: 'Faça upload do arquivo PDF original para atestar a conformidade ICP-Brasil e a integridade da assinatura médica.',
      isOfficialGov: true
    };
  }

  // Fallback genérico para checagem cadastral do médico
  return {
    portalType: 'GENERIC',
    portalName: 'Busca de Médicos CFM',
    validationUrl: 'https://portal.cfm.org.br/busca-medicos/',
    verificationCode: undefined,
    actionLabel: 'Consultar CRM no Portal CFM',
    instructionText: 'Consulte a situação cadastral do profissional diretamente na base de dados do CFM.',
    isOfficialGov: true
  };
}
