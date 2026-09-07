import { NextRequest, NextResponse } from 'next/server';
import { checkCrmExposureHistory } from '@/lib/services/doctor-shield-service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const crm = searchParams.get('crm');
  const uf = searchParams.get('uf') || 'SP';

  if (!crm) {
    return NextResponse.json(
      { error: 'Parâmetro CRM é obrigatório para consulta.' },
      { status: 400 }
    );
  }

  try {
    const result = await checkCrmExposureHistory(crm, uf);
    return NextResponse.json({
      success: true,
      report: result
    });
  } catch (error: any) {
    console.error('Erro ao consultar exposição de CRM:', error);
    return NextResponse.json(
      { error: error?.message || 'Erro ao consultar CRM.' },
      { status: 500 }
    );
  }
}
