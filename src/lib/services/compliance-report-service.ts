import { AttestationValidationReport } from '../crypto/validator';

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
    distanceKm: number;
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
  revalidationGuides: {
    itiValidatorUrl: string;
    cfmDoctorSearchUrl: string;
    cfmPrescriptionUrl?: string;
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
      isRegistered: report.cfmAudit.isRegistered,
      status: report.cfmAudit.status,
      statusDescription: report.cfmAudit.statusDescription,
      regionalCouncil: report.cfmAudit.regionalCouncil,
      officialName: report.cfmAudit.officialName,
      primarySpecialty: report.cfmAudit.primarySpecialty,
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
    revalidationGuides: {
      itiValidatorUrl: 'https://validar.iti.gov.br',
      cfmDoctorSearchUrl: report.doctor?.crm && report.doctor?.uf 
        ? `https://portal.cfm.org.br/busca-medicos/?crm=${report.doctor.crm}&uf=${report.doctor.uf}`
        : 'https://portal.cfm.org.br/busca-medicos/',
      cfmPrescriptionUrl: report.qrCode?.qrData?.includes('cfm.org.br') 
        ? report.qrCode.qrData 
        : 'https://prescricao.cfm.org.br'
    }
  };
}

/**
 * Gera o texto didático, humanizado e verificável do Parecer Técnico de Triagem.
 * Concebido com linguagem clara, acolhedora e baseada em evidências, sem termos acusatórios.
 */
export function generateHumanizedComplianceReport(data: SanitizedForensicReport): {
  executiveSummary: string;
  statusBadge: { text: string; color: 'emerald' | 'amber' | 'rose'; description: string };
  methodologyText: string;
  revalidationGuideText: string;
  fullMarkdownReport: string;
} {
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

  if (isQrCodeValido) {
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

  const revalidationGuideText =
    `### Como o DP ou Colaborador Pode Revalidar de Forma Autônoma:\n\n` +
    `Qualquer pessoa com acesso aos documentos públicos oficiais pode realizar a conferência direta nos portais governamentais:\n\n` +
    `1. **Validador Oficial do Governo Federal (ITI / ICP-Brasil):**\n` +
    `   * Acesse: [validar.iti.gov.br](https://validar.iti.gov.br)\n` +
    `   * Carregue o arquivo PDF original. O portal confirmará o nome do médico signatário e a integridade do arquivo.\n\n` +
    `2. **Consulta Pública de Médicos (Conselho Federal de Medicina):**\n` +
    `   * Acesse: [portal.cfm.org.br/busca-medicos](https://portal.cfm.org.br/busca-medicos/)\n` +
    `   * Informe o CRM **${data.doctor.crm || ''}** e o Estado **${data.doctor.uf || ''}** para checar a situação cadastral do profissional.\n\n` +
    `3. **Plataforma de Prescrição CFM (quando emitido pelo CFM):**\n` +
    `   * Acesse: [prescricao.cfm.org.br](https://prescricao.cfm.org.br) com o código verificador do documento.`;

  const fullMarkdownReport = 
    `# Parecer Técnico de Triagem de Atestado — Protocolo ${data.protocolId}\n\n` +
    `**Canal de Entrada:** ${data.channel === 'WHATSAPP' ? 'WhatsApp Corporativo' : 'Balcão de Atendimento (Web)'}\n` +
    `**Data e Hora da Avaliação:** ${new Date(data.evaluatedAt).toLocaleString('pt-BR')}\n` +
    `**Status Geral:** ${statusBadge.text}\n\n` +
    `---\n\n` +
    `### 1. Resumo Executivo\n${executiveSummary}\n\n` +
    `### 2. Metodologia Aplicada\n${methodologyText}\n\n` +
    `---\n\n` +
    `${revalidationGuideText}`;

  return {
    executiveSummary,
    statusBadge,
    methodologyText,
    revalidationGuideText,
    fullMarkdownReport
  };
}
