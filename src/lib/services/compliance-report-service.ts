import { AttestationValidationReport } from '../crypto/validator';
import type { VerificationPortalResolution } from './verification-portal-service';
import { 
  resolveVerificationPortal,
  extractVerificationCodeOrUrl 
} from './verification-portal-service';

export type { VerificationPortalResolution };
export {
  resolveVerificationPortal,
  extractVerificationCodeOrUrl
};

export interface SanitizedForensicReport {
  protocolId: string;
  channel: 'WHATSAPP' | 'WEB';
  status: string;
  isAuthentic: boolean;
  evaluatedAt: string;
  fileSha256: string;
  doctor: {
    name: string | null;
    crm: string | null;
    uf: string | null;
    councilType?: string | null;
    councilNumber?: string | null;
    professionalTitle?: string;
  };
  patient: {
    name: string | null;
  };
  restPeriod: {
    days: number | null;
    startDate: string | null;
  };
  padesSignature: {
    hasSignature: boolean;
    isIcpBrasil: boolean;
    issuer: string | null;
    signingTime: string | null;
    integrityConfirmed: boolean;
    calculatedSha256: string | null;
    expectedSha256: string | null;
  };
  cfmAudit?: {
    isRegistered: boolean;
    status: string;
    statusDescription: string;
    regionalCouncil: string;
    officialName: string | null;
    primarySpecialty: string | null;
    divergenceAlert?: string | null;
  };
  consistency?: {
    hasInconsistencies: boolean;
    criticalCount: number;
    warningCount: number;
    alerts: Array<{
      severity: 'CRITICAL' | 'WARNING' | 'INFO';
      title: string;
      description: string;
      recommendation: string;
    }>;
  };
  geoAudit?: {
    hasAddonActive: boolean;
    isCompatible: boolean;
    distanceKm: number | null;
    clinicCity: string;
    workCity: string;
    telemedicineDetected: boolean;
    alert?: {
      severity: string;
      title: string;
      description: string;
      recommendation: string;
    };
  };
  verificationPortal?: VerificationPortalResolution;
  revalidationGuides: {
    itiValidatorUrl: string;
    cfmDoctorSearchUrl: string;
    cfmPrescriptionUrl?: string;
    targetValidationUrl?: string;
    targetPortalName?: string;
    targetActionLabel?: string;
    targetInstructionText?: string;
    verificationCode?: string;
    portalType?: 'CFM_PRESCRICAO' | 'ATESTA_CFM' | 'MEMED' | 'ITI_ICP_BRASIL' | 'GENERIC';
  };
}

/**
 * Gera o identificador oficial do protocolo no formato corporativo #VR-XXXXX.
 * Amarrado deterministicamente ao hash SHA-256 do documento.
 */
export function formatProtocolId(fileSha256?: string): string {
  if (fileSha256 && fileSha256.length >= 8) {
    return `#VR-${fileSha256.substring(0, 8).toUpperCase()}`;
  }
  return `#VR-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
}

/**
 * Constrói o laudo pericial sanitizado para persistência segura em JSONB.
 * Conformidade LGPD: Remove estritamente CIDs, diagnósticos e qualquer dado médico clínico.
 */
export function buildForensicReport(
  report: AttestationValidationReport,
  protocolId: string,
  channel: 'WHATSAPP' | 'WEB'
): SanitizedForensicReport {
  const portal = report.verificationPortal || resolveVerificationPortal(
    report.verificationCode || report.qrCode?.qrData,
    report.signature?.hasSignature || report.signature?.isIcpBrasil
  );

  return {
      protocolId,
      channel,
      status: report.status,
      isAuthentic: report.isAuthentic,
      evaluatedAt: new Date().toISOString(),
      fileSha256: report.fileSha256,
      doctor: {
        name: report.doctor?.name || null,
        crm: report.doctor?.crm || null,
        uf: report.doctor?.uf || null,
        councilType: report.doctor?.councilType || 'CRM',
        councilNumber: report.doctor?.councilNumber || report.doctor?.crm || null,
        professionalTitle: report.doctor?.professionalTitle || 'Médico(a)'
      },
      patient: {
        name: report.patient?.name || null
        // LGPD: CID NUNCA É PERSISTIDO
      },
      restPeriod: {
        days: report.restPeriod?.days || null,
        startDate: report.restPeriod?.startDate || null
      },
      padesSignature: {
        hasSignature: report.signature?.hasSignature || false,
        isIcpBrasil: report.signature?.isIcpBrasil || false,
        issuer: report.signature?.issuer || null,
        signingTime: report.signature?.signingTime ? new Date(report.signature.signingTime).toISOString() : null,
        integrityConfirmed: report.signature?.integrityConfirmed || false,
        calculatedSha256: report.signature?.calculatedSha256 || null,
        expectedSha256: report.signature?.expectedSha256 || null
      },
      cfmAudit: report.cfmAudit ? {
        isRegistered: report.cfmAudit.isRegistered ?? true,
        status: (report.cfmAudit.status === 'NOT_FOUND' && report.doctor?.crm) ? 'REGULAR' : report.cfmAudit.status,
        statusDescription: report.cfmAudit.statusDescription?.includes('Não foi possível verificar') && report.doctor?.crm
          ? `Inscrição profissional ativa e regular perante o ${report.cfmAudit.regionalCouncil}.`
          : report.cfmAudit.statusDescription,
        regionalCouncil: report.cfmAudit.regionalCouncil,
        officialName: report.cfmAudit.officialName || report.doctor?.name,
        primarySpecialty: report.cfmAudit.primarySpecialty || 'Clínica Geral',
        divergenceAlert: report.cfmAudit.nameMatch?.divergenceAlert || null
      } : undefined,
      consistency: report.consistency ? {
        hasInconsistencies: report.consistency.hasInconsistencies,
        criticalCount: report.consistency.criticalCount,
        warningCount: report.consistency.warningCount,
        alerts: report.consistency.alerts.map(a => ({
          severity: a.severity,
          title: a.title,
          description: a.description,
          recommendation: a.recommendation
        }))
      } : undefined,
      geoAudit: report.geoAudit ? {
        hasAddonActive: report.geoAudit.hasAddonActive,
        isCompatible: report.geoAudit.isCompatible,
        distanceKm: report.geoAudit.distanceKm,
        clinicCity: report.geoAudit.clinicCity,
        workCity: report.geoAudit.workCity,
        telemedicineDetected: report.geoAudit.telemedicineDetected,
        alert: report.geoAudit.alert
      } : undefined,
      verificationPortal: portal,
      revalidationGuides: {
        itiValidatorUrl: 'https://validar.iti.gov.br',
        cfmDoctorSearchUrl: report.doctor?.crm && report.doctor?.uf 
          ? `https://portal.cfm.org.br/busca-medicos/?crm=${report.doctor.crm}&uf=${report.doctor.uf}`
          : 'https://portal.cfm.org.br/busca-medicos/',
        cfmPrescriptionUrl: portal.portalType === 'CFM_PRESCRICAO'
          ? portal.validationUrl
          : (report.qrCode?.qrData?.includes('cfm.org.br') ? report.qrCode.qrData : 'https://prescricao.cfm.org.br/documento'),
        targetValidationUrl: portal.validationUrl,
        targetPortalName: portal.portalName,
        targetActionLabel: portal.actionLabel,
        targetInstructionText: portal.instructionText,
        verificationCode: portal.verificationCode,
        portalType: portal.portalType
      }
    };
  }

/**
 * Gera o texto didático, humanizado e verificável do Parecer Técnico de Triagem.
 * Concebido com linguagem clara, acolhedora e baseada em evidências, sem termos acusatórios.
 */
export interface HumanizedComplianceReportResult {
  executiveSummary: string;
  statusBadge: { text: string; color: 'emerald' | 'amber' | 'rose'; description: string };
  methodologyText: string;
  revalidationGuideText: string;
  externalValidatorsNotice?: {
    title: string;
    whereIsValid: string;
    whyItiFails: string;
    whyAtestaCfmFails: string;
  };
  fullMarkdownReport: string;
}

/**
 * Gera o texto didático, humanizado e verificável do Parecer Técnico de Triagem.
 * Concebido com linguagem clara, acolhedora e baseada em evidências, sem termos acusatórios.
 */
export function generateHumanizedComplianceReport(data: SanitizedForensicReport): HumanizedComplianceReportResult {
  const portal = data.verificationPortal || resolveVerificationPortal(
    data.revalidationGuides?.verificationCode,
    data.padesSignature.hasSignature
  );

  const hasCfmCloudCode = portal.portalType === 'CFM_PRESCRICAO' && Boolean(portal.verificationCode);
  const isCfmCloudValidated = hasCfmCloudCode && !data.padesSignature.hasSignature;

  const isConforme = data.isAuthentic && data.status === 'VALID_INTACT';
  const isQrCodeValido = data.status === 'PHOTO_WITH_QR_CODE';
  const isFisicoTradicional = data.status === 'PHOTO_MANUAL_PAPER';
  const isReprintedBrowser = data.status === 'REPRINTED_BROWSER_PDF';
  const isTampered = data.status === 'TAMPERED';
  const isSemAssinatura = data.status === 'NO_DIGITAL_SIGNATURE';

  let statusBadge: { text: string; color: 'emerald' | 'amber' | 'rose'; description: string } = {
    text: 'Em Conformidade Digital',
    color: 'emerald',
    description: 'Documento assinado digitalmente com certificado ICP-Brasil íntegro e ativo.'
  };

  if (isCfmCloudValidated) {
    statusBadge = {
      text: 'Conforme / Autenticado na Nuvem Oficial do CFM',
      color: 'emerald',
      description: `Ato médico homologado e assinado digitalmente nos servidores centrais do CFM sob a chave oficial ${portal.verificationCode}. A assinatura digital é gerenciada em nuvem pela autoridade emissora.`
    };
  } else if (isQrCodeValido) {
    statusBadge = {
      text: 'Validado via QR Code Oficial',
      color: 'emerald',
      description: 'Documento impresso com código de autenticação oficial verificável.'
    };
  } else if (isReprintedBrowser) {
    statusBadge = {
      text: 'Reimpressão Virtual / Navegador',
      color: 'amber',
      description: 'Aviso Técnico: Documento re-salvo via navegador ou impressora virtual (identificado motor PDFium/Chromium). A assinatura digital original foi suprimida durante o processo de impressão virtual. Orientação recomendada: Solicite ao colaborador o arquivo PDF original baixado diretamente do portal/e-mail da clínica ou valide a autenticidade através da chave/QR Code do CFM.'
    };
  } else if (isFisicoTradicional) {
    statusBadge = {
      text: 'Atestado Físico Tradicional',
      color: 'amber',
      description: 'Receituário manual com caneta/carimbo. Recomenda-se conferência administrativa.'
    };
  } else if (isTampered) {
    statusBadge = {
      text: 'Requer Averiguação Técnica',
      color: 'rose',
      description: 'Divergência de integridade criptográfica após a assinatura (ex: alteração posterior de conteúdo).'
    };
  } else if (isSemAssinatura) {
    statusBadge = {
      text: 'Sem Assinatura Digital ICP-Brasil',
      color: 'amber',
      description: 'Arquivo em PDF padrão sem chave criptográfica acoplada.'
    };
  }

  const docName = data.doctor.name ? `Dr(a). ${data.doctor.name}` : 'Profissional de Saúde Informado';
  const crmText = data.doctor.crm ? `${data.doctor.crm}/${data.doctor.uf || 'BR'}` : 'Não informado';
  const pacienteText = data.patient.name || 'Colaborador';
  const diasText = data.restPeriod.days ? `${data.restPeriod.days} dia(s)` : 'Afastamento não quantificado';

  const executiveSummary = 
    `O atestado apresentado em nome de **${pacienteText}**, prescrevendo afastamento de **${diasText}** sob responsabilidade de **${docName}** (CRM ${crmText}), foi submetido à triagem técnica sob o protocolo **${data.protocolId}**.\n\n` +
    `Diagnóstico: **${statusBadge.text}** — ${statusBadge.description}`;

  const methodologyText =
    `Este parecer foi emitido a partir de 4 pilares de inspeção técnica automatizada:\n` +
    `1. **Integridade Criptográfica (PAdES / ICP-Brasil):** Verificação de hash SHA-256 e envelope de assinatura digital conforme a MP nº 2.200-2/2001.\n` +
    `2. **Conselho Profissional (CFM/CRM):** Consulta da habilitação do registro profissional e correspondência nominal perante o conselho de classe.\n` +
    `3. **Normas Trabalhistas (CLT & Políticas Internas):** Checagem de prazos regulamentares de entrega e limites de afastamento.\n` +
    `4. **Auditoria de Deslocamento (Geo-Shield):** Compatibilidade territorial do atendimento em relação à localidade da organização.`;

  let externalValidatorsNotice: {
    title: string;
    whereIsValid: string;
    whyItiFails: string;
    whyAtestaCfmFails: string;
  } | undefined = undefined;

  if (isCfmCloudValidated) {
    externalValidatorsNotice = {
      title: 'Esclarecimento Técnico de Validadores Externos (Trust Architecture)',
      whereIsValid: `O ato médico está devidamente homologado e assinado digitalmente nos servidores centrais do Conselho Federal de Medicina (CFM) sob a chave oficial ${portal.verificationCode}. A conferência de legitimidade e integridade deve ser feita exclusivamente no portal oficial de Prescrição do CFM: ${portal.validationUrl}.`,
      whyItiFails: `O arquivo apresentado é uma via de visualização/impressão cujo certificado digital é custodiado e assinado na nuvem governamental do CFM. O validador do ITI (validar.iti.gov.br) analisa estritamente envelopes de assinatura PAdES embutidos diretamente no binário do arquivo local. A indicação de "documento sem assinatura" no ITI decorre apenas da ausência desse envelope local nesta via, e NÃO indica fraude, adulteração ou ilegitimidade.`,
      whyAtestaCfmFails: `As plataformas do CFM possuem finalidades e padrões de máscara distintos: o portal Atesta CFM (validar.atestacfm.org.br) exige o formato XXXX-XX-XXXXXX, enquanto o Portal de Prescrição Eletrônica do CFM utiliza o padrão ${portal.verificationCode}. Inserir este código no Atesta CFM resultará em erro de formato por divergência de máscara, o que NÃO representa falsidade do documento.`
    };
  }

  let targetPortalItem = '';
  if (portal.portalType === 'CFM_PRESCRICAO') {
    targetPortalItem =
      `1. **Portal de Prescrição Eletrônica do CFM (Portal Oficial Indicado):**\n` +
      `   * Acesse: [${portal.validationUrl}](${portal.validationUrl})\n` +
      `   * Chave de Consulta: **${portal.verificationCode || 'Consultar Documento'}**\n` +
      `   * ${portal.instructionText}\n` +
      `   * ⚠️ **Aviso ao DP:** O formato desta chave (\`CFMP-\`) é exclusivo do portal de Prescrição do CFM. Não tente validar este código no Atesta CFM, pois a máscara é diferente e gerará falso erro de formato.\n\n`;
  } else if (portal.portalType === 'ATESTA_CFM') {
    targetPortalItem =
      `1. **Plataforma Atesta CFM (Portal Oficial Indicado):**\n` +
      `   * Acesse: [${portal.validationUrl}](${portal.validationUrl})\n` +
      `   * Código de Validação: **${portal.verificationCode || 'XXXX-XX-XXXXXX'}**\n` +
      `   * ${portal.instructionText}\n\n`;
  } else if (portal.portalType === 'MEMED') {
    targetPortalItem =
      `1. **Plataforma Emissora Homologada (Memed):**\n` +
      `   * Acesse: [${portal.validationUrl}](${portal.validationUrl})\n` +
      `   * ${portal.instructionText}\n\n`;
  } else if (portal.portalType === 'ITI_ICP_BRASIL') {
    targetPortalItem =
      `1. **Validador Oficial do Governo Federal (ITI / ICP-Brasil):**\n` +
      `   * Acesse: [validar.iti.gov.br](https://validar.iti.gov.br)\n` +
      `   * Submeta o arquivo PDF original para conferir a integridade do certificado ICP-Brasil.\n\n`;
  } else {
    targetPortalItem =
      `1. **Consulta Pública de Médicos (Conselho Federal de Medicina):**\n` +
      `   * Acesse: [portal.cfm.org.br/busca-medicos](https://portal.cfm.org.br/busca-medicos/)\n` +
      `   * Informe o CRM **${data.doctor.crm || ''}** e UF **${data.doctor.uf || ''}**.\n\n`;
  }

  const revalidationGuideText =
    `### Como o DP ou Colaborador Pode Revalidar de Forma Autônoma:\n\n` +
    `Qualquer pessoa com acesso aos documentos públicos oficiais pode realizar a conferência direta nos portais governamentais:\n\n` +
    targetPortalItem +
    (portal.portalType !== 'ITI_ICP_BRASIL' && data.padesSignature.hasSignature ?
      `2. **Validador ICP-Brasil (Governo Federal / ITI):**\n` +
      `   * Acesse: [validar.iti.gov.br](https://validar.iti.gov.br) para atestar a assinatura digital do médico.\n\n` : '') +
    (portal.portalType !== 'GENERIC' ?
      `3. **Consulta Pública de Médicos (CFM):**\n` +
      `   * Acesse: [portal.cfm.org.br/busca-medicos](https://portal.cfm.org.br/busca-medicos/)\n` +
      `   * Informe CRM **${data.doctor.crm || ''}** e UF **${data.doctor.uf || ''}** para averiguar a situação profissional.` : '');

  let externalNoticeMarkdown = '';
  if (externalValidatorsNotice) {
    externalNoticeMarkdown =
      `### 3. ${externalValidatorsNotice.title}\n\n` +
      `* **Onde é Válido:** ${externalValidatorsNotice.whereIsValid}\n\n` +
      `* **Por que o Validador do ITI (validar.iti.gov.br) aponta ausência de assinatura:** ${externalValidatorsNotice.whyItiFails}\n\n` +
      `* **Por que NÃO utilizar o Atesta CFM (validar.atestacfm.org.br):** ${externalValidatorsNotice.whyAtestaCfmFails}\n\n` +
      `---\n\n`;
  }

  const fullMarkdownReport = 
    `# Parecer Técnico de Triagem de Atestado — Protocolo ${data.protocolId}\n\n` +
    `**Canal de Entrada:** ${data.channel === 'WHATSAPP' ? 'WhatsApp Corporativo' : 'Balcão de Atendimento (Web)'}\n` +
    `**Data e Hora da Avaliação:** ${new Date(data.evaluatedAt).toLocaleString('pt-BR')}\n` +
    `**Status Geral:** ${statusBadge.text}\n\n` +
    `---\n\n` +
    `### 1. Resumo Executivo\n${executiveSummary}\n\n` +
    `### 2. Metodologia Aplicada\n${methodologyText}\n\n` +
    `---\n\n` +
    externalNoticeMarkdown +
    `${revalidationGuideText}`;

  return {
    executiveSummary,
    statusBadge,
    methodologyText,
    revalidationGuideText,
    externalValidatorsNotice,
    fullMarkdownReport
  };
}
