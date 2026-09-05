import { AttestationValidationReport } from '../crypto/validator';

/**
 * Formata a mensagem de retorno para o WhatsApp de acordo com as regras de negócio expandidas.
 */
export function formatWhatsAppResponse(report: AttestationValidationReport): string {
  // Bloco de afastamento se identificado (LGPD compliant)
  let restDaysLine = '';
  if (report.restPeriod && report.restPeriod.days) {
    const days = report.restPeriod.days;
    const startDate = report.restPeriod.startDate ? ` a partir de ${report.restPeriod.startDate}` : '';
    restDaysLine = `\n*Afastamento:* ${days} dia${days > 1 ? 's' : ''}${startDate}`;
  }

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
        restDaysLine
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
        restDaysLine
      );
    }

    case 'PHOTO_MANUAL_PAPER': {
      return (
        `🟡 *Triagem de Atestado Físico (Papel Tradicional)*\n\n` +
        `*Status:* Foto de receituário físico impresso/manual.\n` +
        `*Observação:* Documentos físicos não contêm a assinatura digital criptográfica e-CPF/ICP-Brasil nem QR Code identificável.\n\n` +
        `*Recomendação para o RH:* Caso o colaborador tenha recebido o arquivo digital original por e-mail ou WhatsApp da clínica, solicite o envio do arquivo em PDF para validação instantânea. Caso seja atendimento 100% presencial de papel, confira o carimbo e a assinatura manual.` +
        restDaysLine
      );
    }

    case 'DUPLICATE_DOCUMENT': {
      return (
        `🔴 *Alerta de Duplicidade*\n\n` +
        `*Status:* Este mesmo arquivo ou atestado já foi submetido anteriormente para abono nesta empresa.\n\n` +
        `*Recomendação para o RH:* Verifique se não se trata de reenvio acidental ou reaproveitamento indevido do mesmo documento.`
      );
    }

    case 'TAMPERED': {
      return (
        `🔴 *Alerta de Inconsistência*\n\n` +
        `*Status:* O documento não possui assinatura digital válida ou o arquivo sofreu alterações/edições após ter sido assinado.\n\n` +
        `*Recomendação para o RH:* Solicite ao colaborador o envio do arquivo PDF original recebido diretamente do médico/clínica.`
      );
    }

    case 'NO_DIGITAL_SIGNATURE':
    case 'INVALID_CERTIFICATE':
    default: {
      return (
        `🔴 *Alerta de Inconsistência*\n\n` +
        `*Status:* O documento em PDF não possui assinatura digital criptográfica válida (Padrão ICP-Brasil).\n\n` +
        `*Recomendação para o RH:* Solicite ao colaborador o envio do arquivo PDF original recebido diretamente do médico/clínica.`
      );
    }
  }
}
