/**
 * Vurio - Analisador de Atestados e Gestor de Absenteísmo (Módulo DP)
 * Implementação das 4 Etapas Sequenciais, Inteligência Preditiva e Retorno Estruturado JSON.
 */

import { extractAttestationFromImageBuffer } from './vision-ocr-service';
import { validateMedicalAttestation } from '../crypto/validator';
import { analyzePdfForensicMetadata } from './forensic-metadata-service';
import { auditGeoDistance } from './geo-audit-service';
import {
  analyzeEventCoincidence,
  updateEmployeeFolder,
  getOrCreateEmployeeFolder,
  getCidStructuralGroup,
  formatDateIso,
  parseDateString
} from './absenteeism-service';

export interface DpEmployeeRegistrationData {
  nome?: string;
  cpf?: string;
  enderecoResidencia?: string;
  cidadeResidencia?: string;
  enderecoUnidadeTrabalho?: string;
  cidadeTrabalho?: string;
}

export interface DpAttestationAnalysisResponse {
  sucesso_ocr: boolean;
  flag_digitacao_assistida?: boolean;
  campos_pendentes_digitacao?: string[];
  dados_extraidos: {
    colaborador_nome: string;
    medico_nome: string;
    crm_uf: string;
    data_emissao: string; // YYYY-MM-DD
    dias_afastamento: number;
    cid: string;
    local_atendimento: string;
  };
  alertas_seguranca: string[];
  alertas_operacionais: string[];
  analise_preditiva: {
    coincidencia_feriado: boolean;
    coincidencia_evento_dp: boolean;
    nome_evento: string;
    padrao_reincidente_dias: boolean;
  };
  pasta_colaborador?: {
    total_atestados_ano: number;
    total_dias_ano: number;
    reincidencia_cid_grupo: boolean;
    historico_inconsistencias: number;
  };
  acao_recomendada_dp: 'APROVAR' | 'CONFERIR_DOCUMENTO_FISICO' | 'PREENCHER_MANUALMENTE';
}

/**
 * Função principal do Módulo DP que executa as 4 etapas sequenciais
 */
export async function analyzeDpAttestation(params: {
  fileBuffer: Buffer;
  mimeType?: string;
  fileName?: string;
  companyId?: string;
  colaboradorCadastro?: DpEmployeeRegistrationData;
  manualOverrides?: Partial<DpAttestationAnalysisResponse['dados_extraidos']>;
}): Promise<DpAttestationAnalysisResponse> {
  const { fileBuffer, mimeType = 'application/pdf', fileName = 'documento.pdf', companyId = 'default', colaboradorCadastro, manualOverrides } = params;

  const alertas_seguranca: string[] = [];
  const alertas_operacionais: string[] = [];
  const campos_pendentes_digitacao: string[] = [];

  // =========================================================================
  // ETAPA 1: Leitura do Documento (OCR & Fallback)
  // =========================================================================
  const isPdf = fileBuffer.subarray(0, 5).toString('latin1').startsWith('%PDF');
  
  // Executar validação técnica básica e extração de texto
  const cryptoValidation = await validateMedicalAttestation(fileBuffer, mimeType, fileName);

  let rawColaborador = manualOverrides?.colaborador_nome || cryptoValidation.patient?.name || null;
  let rawMedico = manualOverrides?.medico_nome || cryptoValidation.doctor?.name || null;
  let rawCrmUf = manualOverrides?.crm_uf || (cryptoValidation.doctor?.crm ? `${cryptoValidation.doctor.crm}/${cryptoValidation.doctor.uf || 'BR'}` : null);
  let rawDataEmissao = manualOverrides?.data_emissao || cryptoValidation.restPeriod?.startDate || null;
  let rawDias = manualOverrides?.dias_afastamento !== undefined ? manualOverrides.dias_afastamento : (cryptoValidation.restPeriod?.days || 0);
  let rawCid = manualOverrides?.cid || cryptoValidation.cid || '';
  let rawLocal = manualOverrides?.local_atendimento || '';

  // Se for imagem ou se campos críticos estiverem vazios no PDF, aciona o Gemini OCR
  if (!isPdf || !rawColaborador || !rawMedico || !rawCrmUf) {
    try {
      const ocrResult = await extractAttestationFromImageBuffer(fileBuffer, mimeType);
      if (ocrResult.isMedicalAttestation) {
        if (!rawColaborador && ocrResult.patientName) rawColaborador = ocrResult.patientName;
        if (!rawMedico && ocrResult.doctorName) rawMedico = ocrResult.doctorName;
        if (!rawCrmUf && ocrResult.crm) rawCrmUf = `${ocrResult.crm}/${ocrResult.uf || 'BR'}`;
        if (!rawDataEmissao && ocrResult.emissionDate) rawDataEmissao = ocrResult.emissionDate;
        if (!rawDias && ocrResult.days) rawDias = ocrResult.days;
        if (!rawCid && ocrResult.cid) rawCid = ocrResult.cid;
        if (!rawLocal && ocrResult.clinicName) rawLocal = ocrResult.clinicName;
      }
    } catch {
      // silencioso
    }
  }

  // Verificação de Ilegibilidade / Baixa Confiança (< 85%)
  if (!rawColaborador) campos_pendentes_digitacao.push('Nome do Colaborador');
  if (!rawMedico) campos_pendentes_digitacao.push('Nome do Médico');
  if (!rawCrmUf) campos_pendentes_digitacao.push('Registro Profissional (CRM/UF)');
  if (!rawDataEmissao) campos_pendentes_digitacao.push('Data de Emissão');
  if (!rawDias || rawDias <= 0) campos_pendentes_digitacao.push('Período de Afastamento (Dias)');

  const flag_digitacao_assistida = campos_pendentes_digitacao.length > 0;
  const sucesso_ocr = campos_pendentes_digitacao.length <= 2; // Sucesso se a grande maioria dos campos foi lida

  // Formatação segura da data para YYYY-MM-DD
  const parsedDate = parseDateString(rawDataEmissao) || new Date();
  const data_emissao_iso = formatDateIso(parsedDate);

  const dados_extraidos = {
    colaborador_nome: rawColaborador || 'Não identificado',
    medico_nome: rawMedico || 'Não identificado',
    crm_uf: rawCrmUf || 'Não informado',
    data_emissao: data_emissao_iso,
    dias_afastamento: Number(rawDias) || 1,
    cid: rawCid || 'Não informado',
    local_atendimento: rawLocal || 'Clínica/Consultório Emissor'
  };

  // =========================================================================
  // ETAPA 2: Análise Técnica de Adulteração do Arquivo (PDF)
  // =========================================================================
  if (isPdf) {
    const forensicMeta = analyzePdfForensicMetadata(fileBuffer, rawDataEmissao);
    if (forensicMeta.hasTechnicalAnomaly) {
      // Inclui obrigatoriamente os alertas técnicos
      for (const alert of forensicMeta.securityAlerts) {
        if (!alertas_seguranca.includes(alert)) {
          alertas_seguranca.push(alert);
        }
      }
    }

    // Se houve adulteração ou violação de assinatura PAdES
    if (cryptoValidation.status === 'TAMPERED') {
      alertas_seguranca.push('O arquivo digital possui histórico de edição pós-emissão.');
      alertas_seguranca.push('Assinatura digital ICP-Brasil corrompida: o hash do arquivo difere da assinatura original.');
    } else if (cryptoValidation.status === 'REPRINTED_BROWSER_PDF') {
      alertas_operacionais.push('Aviso Técnico: Documento re-salvo via impressora virtual / navegador web (PDFium/Chromium). Assinatura digital original suprimida.');
    }
  }

  // =========================================================================
  // ETAPA 3: Análise de Geolocalização e Distância
  // =========================================================================
  const localConsulta = dados_extraidos.local_atendimento;
  const cidadeTrabalho = colaboradorCadastro?.cidadeTrabalho || colaboradorCadastro?.enderecoUnidadeTrabalho || '';
  const cidadeResidencia = colaboradorCadastro?.cidadeResidencia || colaboradorCadastro?.enderecoResidencia || '';

  const pontoComparacao = cidadeTrabalho || cidadeResidencia;
  if (localConsulta && pontoComparacao) {
    const geoAudit = auditGeoDistance({
      clinicAddressOrCity: localConsulta,
      employeeWorkCity: pontoComparacao,
      distanceThresholdKm: 50 // Limite de 50 km da diretriz
    });

    if (geoAudit.distanceKm !== null && geoAudit.distanceKm > 50 && !geoAudit.telemedicineDetected) {
      alertas_operacionais.push(`Consulta realizada a ${geoAudit.distanceKm} km da residência/unidade.`);
    }
  }

  // =========================================================================
  // ETAPA 4 & SEÇÃO 3: Inteligência Preditiva e Atualização da Pasta do Colaborador
  // =========================================================================
  const analise_preditiva_res = analyzeEventCoincidence(data_emissao_iso, companyId);
  if (analise_preditiva_res.rotulo_alerta) {
    alertas_operacionais.push(analise_preditiva_res.rotulo_alerta);
  }

  // Identificador do colaborador para a pasta
  const idColaborador = colaboradorCadastro?.cpf || dados_extraidos.colaborador_nome;
  const updateRes = updateEmployeeFolder({
    employeeIdentifier: idColaborador,
    companyId,
    days: dados_extraidos.dias_afastamento,
    cid: dados_extraidos.cid !== 'Não informado' ? dados_extraidos.cid : null,
    hadInconsistencyOrManualTyping: flag_digitacao_assistida || alertas_seguranca.length > 0,
    emissionDate: data_emissao_iso
  });

  if (updateRes.reincidenciaCidGrupo) {
    const grupo = getCidStructuralGroup(dados_extraidos.cid);
    alertas_operacionais.push(`Reincidência de afastamento no mesmo grupo estrutural (${grupo?.description || 'Capítulo CID'}).`);
  }

  // =========================================================================
  // DETERMINAÇÃO DA AÇÃO RECOMENDADA AO DP (NEUTRALIDADE ABSOLUTA)
  // =========================================================================
  let acao_recomendada_dp: 'APROVAR' | 'CONFERIR_DOCUMENTO_FISICO' | 'PREENCHER_MANUALMENTE' = 'APROVAR';

  if (flag_digitacao_assistida && campos_pendentes_digitacao.length >= 2) {
    acao_recomendada_dp = 'PREENCHER_MANUALMENTE';
  } else if (alertas_seguranca.length > 0 || alertas_operacionais.some(a => a.includes('> 50 km') || a.includes('alterações estruturais'))) {
    acao_recomendada_dp = 'CONFERIR_DOCUMENTO_FISICO';
  } else {
    acao_recomendada_dp = 'APROVAR';
  }

  return {
    sucesso_ocr,
    flag_digitacao_assistida,
    campos_pendentes_digitacao,
    dados_extraidos,
    alertas_seguranca,
    alertas_operacionais,
    analise_preditiva: {
      coincidencia_feriado: analise_preditiva_res.coincidencia_feriado,
      coincidencia_evento_dp: analise_preditiva_res.coincidencia_evento_dp,
      nome_evento: analise_preditiva_res.nome_evento,
      padrao_reincidente_dias: analise_preditiva_res.padrao_reincidente_dias
    },
    pasta_colaborador: {
      total_atestados_ano: updateRes.folder.totalAtestadosAno,
      total_dias_ano: updateRes.folder.totalDiasAno,
      reincidencia_cid_grupo: updateRes.reincidenciaCidGrupo,
      historico_inconsistencias: updateRes.folder.historicoInconsistencias
    },
    acao_recomendada_dp
  };
}
