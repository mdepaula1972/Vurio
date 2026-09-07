import { AttestationValidationReport } from '../crypto/validator';

/**
 * Formata a mensagem de retorno para o WhatsApp de acordo com as regras periciais expandidas,
 * incluindo Auditoria Cadastral Nacional de CRM (CFM - 27 estados) e Motor de Inconsistências Forenses.
 */
export function formatWhatsAppResponse(report: AttestationValidationReport): string {
  // 1. Bloco de Afastamento (LGPD compliant)
  let restDaysLine = '';
  if (report.restPeriod && report.restPeriod.days) {
    const days = report.restPeriod.days;
    const startDate = report.restPeriod.startDate ? ` a partir de ${report.restPeriod.startDate}` : '';
    restDaysLine = `\n*Afastamento:* ${days} dia${days > 1 ? 's' : ''}${startDate}`;
  }

  // 2. Bloco de Auditoria de CRM / CFM Nacional (27 Estados)
  let cfmBlock = '';
  if (report.cfmAudit && report.cfmAudit.crm) {
    const cfm = report.cfmAudit;
    const council = cfm.regionalCouncil;
    const isRegular = cfm.status === 'REGULAR';
    const statusIcon = isRegular ? '🟢' : '🔴';
    const docName = cfm.officialName || report.doctor.name || 'Médico Localizado';

    cfmBlock =
      `\n\n🩺 *Auditoria Cadastral (CFM / ${council})*\n` +
      `• *Médico Titular:* Dr(a). ${docName}\n` +
      `• *CRM ${cfm.crm}/${cfm.uf}:* ${statusIcon} ${cfm.statusDescription}\n`;

    if (cfm.primarySpecialty) {
      cfmBlock += `• *Especialidade:* ${cfm.primarySpecialty}\n`;
    }

    if (cfm.nameMatch && cfm.nameMatch.divergenceAlert) {
      cfmBlock += `• ⚠️ *Divergência Nominal:* ${cfm.nameMatch.divergenceAlert}\n`;
    }

    if (cfm.interstateAlert && cfm.interstateAlert.hasDivergence) {
      cfmBlock += `• 📌 *Registro Regional:* ${cfm.interstateAlert.description}\n`;
    }
  }

  // 3. Bloco de Apontamentos Técnicos de Auditoria
  let inconsistencyBlock = '';
  if (report.consistency && report.consistency.hasInconsistencies) {
    inconsistencyBlock = `\n\n📋 *Apontamentos Técnicos de Auditoria:*\n`;
    for (const alert of report.consistency.alerts) {
      const icon = alert.severity === 'CRITICAL' ? '⚠️' : alert.severity === 'WARNING' ? '⚠️' : '📌';
      inconsistencyBlock += `${icon} *${alert.title}*\n${alert.description}\n_Sugestão Técnica para o DP:_ ${alert.recommendation}\n\n`;
    }
  }

  // 4. Bloco de Auditoria de Localização (Geo-Shield Add-on)
  let geoBlock = '';
  if (report.geoAudit && !report.geoAudit.isCompatible && report.geoAudit.alert) {
    geoBlock =
      `\n\n📍 *Auditoria de Localização (Geo-Shield)*\n` +
      `• *Local do Atendimento:* ${report.geoAudit.clinicCity}\n` +
      `• *Base de Trabalho:* ${report.geoAudit.workCity}\n` +
      `• *Distância Estimada:* ~${report.geoAudit.distanceKm} km\n` +
      `• 📌 *Apontamento:* ${report.geoAudit.alert.description}\n`;
  }

  // 5. Montagem da Mensagem por Status
  switch (report.status) {
    case 'VALID_INTACT': {
      const doctorName = report.doctor.name ? `Dr(a). ${report.doctor.name}` : 'Médico Identificado';
      const crmStr = report.doctor.crm
        ? `(CRM ${report.doctor.crm}${report.doctor.uf ? `/${report.doctor.uf}` : ''})`
        : '';
      const issuer = report.signature.issuer || 'AC Autorizada ICP-Brasil';

      return (
        `🟢 *Atestado em Conformidade Digital*\n\n` +
        `*Médico:* ${doctorName} ${crmStr}\n` +
        `*Assinatura Digital:* Válida (Padrão ICP-Brasil)\n` +
        `*Integridade:* Confirmada (Arquivo intocado após a emissão)\n` +
        `*Emissor:* ${issuer}` +
        restDaysLine +
        cfmBlock +
        inconsistencyBlock +
        geoBlock
      );
    }

    case 'PHOTO_WITH_QR_CODE': {
      const issuer = report.qrCode?.issuerType || 'Validador Oficial';
      const url = report.qrCode?.qrData || '';

      return (
        `🟢 *Atestado Validado via QR Code Oficial*\n\n` +
        `*Emissor:* Sistema Oficial (${issuer})\n` +
        `*Status:* Documento com código de autenticação legível e rastreável.\n` +
        `*Link de Consulta:* ${url}` +
        restDaysLine +
        cfmBlock +
        inconsistencyBlock +
        geoBlock
      );
    }

    case 'PHOTO_MANUAL_PAPER': {
      return (
        `🟡 *Triagem de Atestado Físico (Papel Tradicional)*\n\n` +
        `*Status:* Foto de receituário físico impresso/manual.\n` +
        `*Observação:* Documentos físicos não contêm a assinatura digital criptográfica e-CPF/ICP-Brasil.\n` +
        restDaysLine +
        cfmBlock +
        inconsistencyBlock +
        geoBlock +
        `\n*Orientação para o DP:* Se o colaborador recebeu o arquivo eletrônico diretamente da clínica, solicite o PDF original para validação imediata. Sendo atendimento presencial físico, confira o carimbo legível e assinatura manual.`
      );
    }

    case 'DUPLICATE_DOCUMENT': {
      return (
        `🟡 *Apontamento de Duplicidade no Arquivo*\n\n` +
        `*Status:* Este mesmo arquivo documental já consta no histórico de registros recebidos pela empresa.\n\n` +
        `*Sugestão para o DP:* Verificar com o colaborador se houve reenvio acidental do mesmo comprovante.` +
        inconsistencyBlock +
        geoBlock
      );
    }

    case 'TAMPERED': {
      return (
        `🟡 *Divergência de Integridade Digital*\n\n` +
        `*Status:* O documento em PDF apresenta modificações estruturais ou visuais após o fechamento da assinatura digital.\n` +
        restDaysLine +
        cfmBlock +
        inconsistencyBlock +
        geoBlock +
        `\n*Sugestão para o DP:* Solicite ao colaborador o envio do arquivo PDF original emitido diretamente pelo médico ou clínica (sem salvar por cima ou reimprimir em PDF).`
      );
    }

    case 'NO_DIGITAL_SIGNATURE':
    case 'INVALID_CERTIFICATE':
    default: {
      return (
        `🟡 *Documento Sem Assinatura ICP-Brasil Identificada*\n\n` +
        `*Status:* O arquivo PDF enviado não possui certificado digital padrão ICP-Brasil acoplado.\n` +
        restDaysLine +
        cfmBlock +
        inconsistencyBlock +
        geoBlock +
        `\n*Sugestão para o DP:* Caso o colaborador tenha recebido o arquivo digital diretamente do consultório, solicite o PDF com a assinatura digital do médico ou a via com QR Code de autenticação.`
      );
    }
  }
}
