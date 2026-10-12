import { NextRequest, NextResponse } from 'next/server';
import { recordDpDecision, getOrCreatePermanentFolder } from '@/lib/services/absenteeism-service';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.protocolId || !body.decisaoDp) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: protocolId, decisaoDp' },
        { status: 400 }
      );
    }

    const identifier = {
      cpf: body.cpf || body.identifier?.cpf || null,
      nome: body.nome || body.identifier?.nome || 'Colaborador'
    };

    const updatedFolder = recordDpDecision({
      identifier,
      companyId: body.companyId || 'default',
      protocolId: body.protocolId,
      decisaoDp: body.decisaoDp,
      observacaoDp: body.observacaoDp,
      diasAfastamento: Number(body.diasAfastamento) || 1,
      dataEmissao: body.dataEmissao,
      medicoNome: body.medicoNome,
      crmUf: body.crmUf,
      cid: body.cid,
      localAtendimento: body.localAtendimento,
      alertasRegistrados: body.alertasRegistrados || [],
      etiquetasPreditivas: body.etiquetasPreditivas || [],
      exigiuDigitacaoManual: !!body.exigiuDigitacaoManual
    });

    return NextResponse.json({
      success: true,
      message: `Decisão [${body.decisaoDp}] registrada com sucesso na Pasta Permanente do Colaborador.`,
      folder: updatedFolder
    });
  } catch (err: any) {
    console.error('Erro ao registrar decisão do DP:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const cpf = searchParams.get('cpf');
  const nome = searchParams.get('nome');
  const companyId = searchParams.get('companyId') || 'default';

  if (!cpf && !nome) {
    return NextResponse.json({ error: 'Informe cpf ou nome do colaborador' }, { status: 400 });
  }

  const folder = getOrCreatePermanentFolder({ cpf, nome }, companyId);
  return NextResponse.json({ folder });
}
