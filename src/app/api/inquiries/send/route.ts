import { NextRequest, NextResponse } from 'next/server';
import { createVerificationInquiry } from '@/lib/services/inquiry-service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      companyId,
      validationLogId,
      doctorCrm,
      doctorUf,
      doctorName,
      patientName,
      patientCpf,
      clinicName,
      clinicContact
    } = body;

    if (!doctorCrm || !doctorUf) {
      return NextResponse.json(
        { error: 'CRM e UF do médico são obrigatórios para disparar a diligência.' },
        { status: 400 }
      );
    }

    const inquiry = await createVerificationInquiry({
      companyId: companyId || 'demo-company-1',
      validationLogId,
      doctorCrm,
      doctorUf,
      doctorName,
      patientName,
      patientCpf,
      clinicName,
      clinicContact
    });

    const inquiryUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/diligencia/${inquiry.token}`;

    return NextResponse.json({
      success: true,
      inquiry,
      inquiryUrl,
      message: 'Diligência de 1 clique criada com sucesso.'
    });
  } catch (error: any) {
    console.error('Erro na rota /api/inquiries/send:', error);
    return NextResponse.json(
      { error: error?.message || 'Erro ao criar diligência.' },
      { status: 500 }
    );
  }
}
