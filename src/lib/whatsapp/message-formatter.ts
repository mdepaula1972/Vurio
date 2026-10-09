import { AttestationValidationReport } from '../crypto/validator';

/**
 * Formata a mensagem de retorno para o WhatsApp de acordo com as regras de triagem do Vurio,
 * incluindo suporte a múltiplos conselhos profissionais (CRM, CRO, CRP),
 * Auditoria Cadastral Nacional de CRM (CFM - 27 estados) e Motor de Inconsistências.
 */
export function formatWhatsAppResponse(report: AttestationValidationReport): string {
  // 1. Bloco de Afastamento (LGPD compliant)
  let restDaysLine = '';
  if (report.restPeriod && report.restPeriod.days) {
    const days = report.restPeriod.days;
    const startDate = report.restPeriod.startDate ? ` a partir de ${report.restPeriod.startDate}` : '';
    restDaysLine = `\n*Afastamento:* ${days} dia${days > 1 ? 's' : ''}${startDate}`;
  }

  // 2. Bloco de Auditoria Médica (CFM Nacional - 27 Estados)
  let cfmBlock = '';
  if (report.cfmAudit && report.cfmAudit.crm) {
    const cfm = report.cfmAudit;
    const council = cfm.regionalCouncil;
    const isRegular = cfm.status === 'REGULAR';
    const isNotFound = cfm.status === 'NOT_FOUND';
    const statusIcon = isRegular ? '🟢' : isNotFound ? 'ℹ️' : '🔴';
    const docName = cfm.officialName || report.doctor.name || 'Médico Informado';

    cfmBlock =
      `\n\n🩺 *Auditoria Cadastral (Conselho Profissional / ${council})*\n` +
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

  // 3. Bloco de Auditoria Odontológica (CRO)
  let croBlock = '';
  if (report.doctor.councilType === 'CRO') {
    const croNum = report.doctor.councilNumber || report.doctor.crm || '';
    const croUf = report.doctor.uf ? `/${report.doctor.uf}` : '';
    croBlock =
      `\n\n🦷 *Auditoria Odontológica (CRO${croUf})*\n` +
      `• *Categoria:* Cirurgião-Dentista Habilitado\n` +
      `• *Registro:* CRO ${croNum}${croUf}\n` +
      `• *Respaldo Trabalhista:* Atestado odontológico legalmente válido para abono de faltas (Lei Federal nº 5.081/1966, Art. 6º, III).\n`;
  }

  // 4. Bloco de Atendimento Psicológico / Terapêutico (CRP)
  let crpBlock = '';
  if (report.doctor.councilType === 'CRP') {
    const crpNum = report.doctor.councilNumber || report.doctor.crm || '';
    const crpUf = report.doctor.uf ? `/${report.doctor.uf}` : '';
    crpBlock =
      `\n\n🧠 *Conselho de Psicologia (CRP${crpUf})*\n` +
      `• *Categoria:* Psicólogo(a) Clínico(a)\n` +
      `• *Registro:* CRP ${crpNum}${crpUf}\n` +
      `• *Orientação para o DP:* Declaração de comparecimento/sessão terapêutica (abono de horas). Abono integral sujeito à CCT ou homologação pelo médico do trabalho.\n`;
  }

  // 5. Bloco de Apontamentos Técnicos de Auditoria
  let inconsistencyBlock = '';
  if (report.consistency && report.consistency.hasInconsistencies) {
    inconsistencyBlock = `\n\n📋 *Apontamentos Técnicos de Auditoria:*\n`;
    for (const alert of report.consistency.alerts) {
      const icon = alert.severity === 'CRITICAL' ? '⚠️' : alert.severity === 'WARNING' ? '⚠️' : '📌';
      inconsistencyBlock += `${icon} *${alert.title}*\n${alert.description}\n_Sugestão Técnica para o DP:_ ${alert.recommendation}\n\n`;
    }
  }

  // 6. Bloco de Auditoria de Localização (Geo-Shield Add-on)
  let geoBlock = '';
  if (report.geoAudit && !report.geoAudit.isCompatible && report.geoAudit.alert) {
    geoBlock =
      `\n\n📍 *Auditoria de Localização (Geo-Shield)*\n` +
      `• *Local do Atendimento:* ${report.geoAudit.clinicCity}\n` +
      `• *Base de Trabalho:* ${report.geoAudit.workCity}\n` +
      `• *Distância Estimada:* ~${report.geoAudit.distanceKm} km\n` +
      `• 📌 *Apontamento:* ${report.geoAudit.alert.description}\n`;
  }

  // 7. Identificação Dinâmica do Profissional
  const councilType = report.doctor.councilType || 'CRM';
  const councilNumber = report.doctor.councilNumber || report.doctor.crm;
  const councilSuffix = councilNumber ? ` (${councilType} ${councilNumber}${report.doctor.uf ? `/${report.doctor.uf}` : ''})` : '';
  const defaultTitle = report.doctor.professionalTitle || (councilType === 'CRO' ? 'Cirurgião-Dentista' : 'Profissional de Saúde');
  const professionalDisplay = report.doctor.name ? `Dr(a). ${report.doctor.name}` : defaultTitle;

  // 8. Montagem da Mensagem por Status
  switch (report.status) {
    case 'VALID_INTACT': {
      const issuer = report.signature.issuer || 'AC Autorizada ICP-Brasil';

      return (
        `🟢 *Atestado em Conformidade Digital*\n\n` +
        `*Profissional:* ${professionalDisplay}${councilSuffix}\n` +
        `*Assinatura Digital:* Válida (Padrão ICP-Brasil)\n` +
        `*Integridade:* Confirmada (Arquivo intocado após a emissão)\n` +
        `*Emissor:* ${issuer}` +
        restDaysLine +
        cfmBlock +
        croBlock +
        crpBlock +
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
        `*Profissional:* ${professionalDisplay}${councilSuffix}\n` +
        `*Status:* Documento com código de autenticação legível e rastreável.\n` +
        `*Link de Consulta:* ${url}` +
        restDaysLine +
        cfmBlock +
        croBlock +
        crpBlock +
        inconsistencyBlock +
        geoBlock
      );
    }

    case 'PHOTO_MANUAL_PAPER': {
      return (
        `🟡 *Triagem de Atestado Físico (Papel Tradicional)*\n\n` +
        `*Profissional:* ${professionalDisplay}${councilSuffix}\n` +
        `*Status:* Foto de receituário físico impresso/manual.\n` +
        `*Observação:* Documentos físicos não contêm a assinatura digital criptográfica e-CPF/ICP-Brasil.\n` +
        restDaysLine +
        cfmBlock +
        croBlock +
        crpBlock +
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
        `*Profissional:* ${professionalDisplay}${councilSuffix}\n` +
        `*Status:* O documento em PDF apresenta modificações estruturais ou visuais após o fechamento da assinatura digital.\n` +
        restDaysLine +
        cfmBlock +
        croBlock +
        crpBlock +
        inconsistencyBlock +
        geoBlock +
        `\n*Sugestão para o DP:* Solicite ao colaborador o envio do arquivo PDF original emitido diretamente pelo profissional ou clínica (sem salvar por cima ou reimprimir em PDF).`
      );
    }

    case 'NOT_AN_ATTESTATION': {
      return (
        `📄 *Documento Não Identificado como Atestado*\n\n` +
        `*Status:* O arquivo enviado não possui características ou termos de um atestado médico, odontológico ou declaração de saúde.\n\n` +
        `*Finalidade:* O canal Vurio é dedicado à recepção e triagem de atestados de saúde de colaboradores.\n\n` +
        `_Caso deseje validar um atestado, por favor envie o arquivo PDF original emitido pela clínica ou uma foto nítida do receituário físico._`
      );
    }

    case 'NO_DIGITAL_SIGNATURE':
    case 'INVALID_CERTIFICATE':
    default: {
      return (
        `🟡 *Documento Sem Assinatura ICP-Brasil Identificada*\n\n` +
        `*Profissional:* ${professionalDisplay}${councilSuffix}\n` +
        `*Status:* O arquivo PDF enviado não possui certificado digital padrão ICP-Brasil acoplado.\n` +
        restDaysLine +
        cfmBlock +
        croBlock +
        crpBlock +
        inconsistencyBlock +
        geoBlock +
        `\n*Sugestão para o DP:* Caso o colaborador tenha recebido o arquivo digital diretamente do consultório, solicite o PDF com a assinatura digital do profissional ou a via com QR Code de autenticação.`
      );
    }
  }
}
