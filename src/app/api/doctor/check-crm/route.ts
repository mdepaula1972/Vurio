import { NextRequest, NextResponse } from 'next/server';
import { auditDoctorCrm, registerVerifiedDoctor } from '@/lib/services/cfm-service';
import { checkCrmExposureHistory } from '@/lib/services/doctor-shield-service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const crm = searchParams.get('crm');
  const uf = searchParams.get('uf') || 'SP';
  const name = searchParams.get('name') || null;

  if (!crm) {
    return NextResponse.json(
      { error: 'Parâmetro CRM é obrigatório para consulta.' },
      { status: 400 }
    );
  }

  try {
    const cfmResult = await auditDoctorCrm(crm, uf, name);
    let exposureResult: any = null;
    try {
      exposureResult = await checkCrmExposureHistory(crm, uf);
    } catch {
      // silencioso
    }

    return NextResponse.json({
      success: true,
      officialName: cfmResult.officialName,
      status: cfmResult.status,
      report: {
        ...cfmResult,
        exposure: exposureResult
      }
    });
  } catch (error: any) {
    console.error('Erro ao consultar CRM:', error?.message || 'Erro na consulta');
    return NextResponse.json(
      { error: error?.message || 'Erro ao consultar CRM.' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { crm, uf, name, specialty, status } = body;
    if (!crm || !uf) {
      return NextResponse.json({ error: 'CRM e UF são obrigatórios.' }, { status: 400 });
    }

    registerVerifiedDoctor({
      crm: String(crm).replace(/\D/g, ''),
      uf: String(uf).toUpperCase().trim(),
      name: name || 'Médico Verificado',
      status: status || 'REGULAR',
      specialty: specialty || 'Clínica Geral'
    });

    const updated = await auditDoctorCrm(crm, uf, name);
    return NextResponse.json({ success: true, report: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Erro ao registrar médico.' }, { status: 500 });
  }
}
