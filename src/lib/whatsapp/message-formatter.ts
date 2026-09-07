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
      cfmBlock += `• 🚨 ${cfm.nameMatch.divergenceAlert}\n`;
    }

    if (cfm.interstateAlert && cfm.interstateAlert.hasDivergence) {
      cfmBlock += `• ⚠️ ${cfm.interstateAlert.description}\n`;
    }
  }

  // 3. Bloco de Inconsistências Detectadas (Datas Futuras, CPF Inválido, INSS)
  let inconsistencyBlock = '';
  if (report.consistency && report.consistency.hasInconsistencies) {
    inconsistencyBlock = `\n\n🔍 *Inconsistências Detectadas pelo Motor Pericial:*\n`;
    for (const alert of report.consistency.alerts) {
      const icon = alert.severity === 'CRITICAL' ? '🚨' : alert.severity === 'WARNING' ? '⚠️' : 'ℹ️';
      inconsistencyBlock += `${icon} *${alert.title}*\n${alert.description}\n_Orientação:_ ${alert.recommendation}\n\n`;
    }
  }

  // 4. Montagem da Mensagem por Status
  switch (report.status) {
    case 'VALID_INTACT': {
      const doctorName = report.doctor.name ? `Dr(a). ${report.doctor.name}` : 'Médico Identificado';
      const crmStr = report.doctor.crm
        ? `(CRM ${report.doctor.crm}${report.doctor.uf ? `/${report.doctor.uf}` : ''})`
        : '';
      const issuer = report.signature.issuer || 'AC Autorizada ICP-Brasil';

      return (
        `🟢 *Atestado Autêntico e Íntegro*\n\n` +
        `*Médico:* ${doctorName} ${crmStr}\n` +
        `*Assinatura Digital:* Válida (Padrão ICP-Brasil)\n` +
        `*Integridade:* Confirmada (Arquivo intocado após a emissão)\n` +
        `*Emissor:* ${issuer}` +
        restDaysLine +
        cfmBlock +
        inconsistencyBlock
      );
    }

    case 'PHOTO_WITH_QR_CODE': {
      const issuer = report.qrCode?.issuerType || 'Validador Oficial';
      const url = report.qrCode?.qrData || '';

      return (
        `🟢 *Atestado Autenticado via QR Code*\n\n` +
        `*Emissor:* Sistema Oficial (${issuer})\n` +
        `*Status:* Documento impresso com QR Code de autenticação legítimo.\n` +
        `*Link de Auditoria:* ${url}` +
        restDaysLine +
        cfmBlock +
        inconsistencyBlock
      );
    }

    case 'PHOTO_MANUAL_PAPER': {
      return (
        `🟡 *Triagem de Atestado Físico (Papel Tradicional)*\n\n` +
        `*Status:* Foto de receituário físico impresso/manual.\n` +
        `*Observação:* Documentos físicos não contêm a assinatura digital criptográfica e-CPF/ICP-Brasil nem QR Code identificável.\n` +
        restDaysLine +
        cfmBlock +
        inconsistencyBlock +
        `\n*Recomendação para o RH:* Caso o colaborador tenha recebido o arquivo digital original por e-mail ou WhatsApp da clínica, solicite o envio do arquivo em PDF para validação instantânea. Caso seja atendimento 100% presencial de papel, confira o carimbo e a assinatura manual.`
      );
    }

    case 'DUPLICATE_DOCUMENT': {
      return (
        `🔴 *Alerta de Duplicidade*\n\n` +
        `*Status:* Este mesmo arquivo ou atestado já foi submetido anteriormente para abono nesta empresa.\n\n` +
        `*Recomendação para o RH:* Verifique se não se trata de reenvio acidental ou reaproveitamento indevido do mesmo documento.` +
        inconsistencyBlock
      );
    }

    case 'TAMPERED': {
      return (
        `🔴 *Alerta de Inconsistência Criptográfica (Adulteração)*\n\n` +
        `*Status:* O documento sofreu alterações ou edições nos dados visuais após ter sido assinado digitalmente.\n` +
        restDaysLine +
        cfmBlock +
        inconsistencyBlock +
        `\n*Recomendação para o RH:* Solicite ao colaborador o envio do arquivo PDF original recebido diretamente do médico/clínica.`
      );
    }

    case 'NO_DIGITAL_SIGNATURE':
    case 'INVALID_CERTIFICATE':
    default: {
      return (
        `🔴 *Alerta de Inconsistência*\n\n` +
        `*Status:* O documento em PDF não possui assinatura digital criptográfica válida (Padrão ICP-Brasil).\n` +
        restDaysLine +
        cfmBlock +
        inconsistencyBlock +
        `\n*Recomendação para o RH:* Solicite ao colaborador o envio do arquivo PDF original recebido diretamente do médico/clínica.`
      );
    }
  }
}
