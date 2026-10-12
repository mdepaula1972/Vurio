import { NextRequest, NextResponse } from 'next/server';
import { analyzeDpAttestation, DpEmployeeRegistrationData } from '@/lib/services/dp-attestation-analyzer';
import { auditDoctorCrm } from '@/lib/services/cfm-service';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const companyId = (formData.get('companyId') as string) || 'default';

    // Dados cadastrais opcionais do colaborador
    const colaboradorNome = formData.get('colaborador_nome') as string | null;
    const colaboradorCpf = formData.get('colaborador_cpf') as string | null;
    const cidadeResidencia = formData.get('cidade_residencia') as string | null;
    const cidadeTrabalho = formData.get('cidade_trabalho') as string | null;

    // Overrides de digitação manual assistida
    const manualCrm = formData.get('manual_crm') as string | null;
    const manualUf = formData.get('manual_uf') as string | null;
    const manualDias = formData.get('manual_dias') as string | null;
    const manualData = formData.get('manual_data_emissao') as string | null;
    const manualCid = formData.get('manual_cid') as string | null;

    let fileBuffer: Buffer;
    let fileName = 'atestado.pdf';
    let mimeType = 'application/pdf';

    if (file) {
      const arrayBuffer = await file.arrayBuffer();
      fileBuffer = Buffer.from(arrayBuffer);
      fileName = file.name;
      mimeType = file.type || 'application/pdf';
    } else {
      // Se não enviou arquivo, mas está preenchendo formulário manual de balcão
      const rawText = `Atestado médico emitido em ${manualData || 'hoje'} para repouso de ${manualDias || '1'} dias.`;
      fileBuffer = Buffer.from(rawText);
    }

    const colaboradorCadastro: DpEmployeeRegistrationData = {
      nome: colaboradorNome || undefined,
      cpf: colaboradorCpf || undefined,
      cidadeResidencia: cidadeResidencia || undefined,
      cidadeTrabalho: cidadeTrabalho || undefined
    };

    const manualOverrides: any = {};
    if (colaboradorNome) manualOverrides.colaborador_nome = colaboradorNome;
    if (manualCrm) manualOverrides.crm_uf = `${manualCrm}/${manualUf || 'SP'}`;
    if (manualDias) manualOverrides.dias_afastamento = parseInt(manualDias, 10);
    if (manualData) manualOverrides.data_emissao = manualData;
    if (manualCid) manualOverrides.cid = manualCid;

    // Se o analista digitou CRM e UF, executa validação instantânea no CFM para enriquecer o nome do médico
    if (manualCrm && manualUf) {
      try {
        const cfmCheck = await auditDoctorCrm(manualCrm, manualUf);
        if (cfmCheck.officialName) {
          manualOverrides.medico_nome = cfmCheck.officialName;
        }
      } catch {
        // silencioso
      }
    }

    const response = await analyzeDpAttestation({
      fileBuffer,
      mimeType,
      fileName,
      companyId,
      colaboradorCadastro,
      manualOverrides
    });

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
        'X-Vurio-Version': 'v1.3.0',
        'X-Vurio-Engine': 'Vurio DP & Absenteísmo Engine v1.3.0'
      }
    });
  } catch (error: any) {
    console.error('Erro na análise DP do atestado:', error);
    return NextResponse.json(
      {
        sucesso_ocr: false,
        flag_digitacao_assistida: true,
        campos_pendentes_digitacao: ['Arquivo ilegível ou formato não suportado'],
        dados_extraidos: {
          colaborador_nome: 'Não identificado',
          medico_nome: 'Não identificado',
          crm_uf: 'Não informado',
          data_emissao: new Date().toISOString().substring(0, 10),
          dias_afastamento: 1,
          cid: 'Não informado',
          local_atendimento: 'Não identificado'
        },
        alertas_seguranca: ['Falha técnica no processamento do documento.'],
        alertas_operacionais: [],
        analise_preditiva: {
          coincidencia_feriado: false,
          coincidencia_evento_dp: false,
          nome_evento: '',
          padrao_reincidente_dias: false
        },
        acao_recomendada_dp: 'PREENCHER_MANUALMENTE'
      },
      { status: 200 }
    );
  }
}
