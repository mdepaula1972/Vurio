import { NextRequest, NextResponse } from 'next/server';
import { createDoctorIncident } from '@/lib/services/doctor-shield-service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      doctorCrm,
      doctorUf,
      doctorName,
      doctorCpf,
      patientName,
      patientCpf,
      companyName,
      fileName,
      fileSha256,
      restDaysClaimed,
      customStatement
    } = body;

    if (!doctorCrm || !doctorUf) {
      return NextResponse.json(
        { error: 'CRM e UF do médico são obrigatórios.' },
        { status: 400 }
      );
    }

    const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1';

    const result = await createDoctorIncident({
      doctorCrm,
      doctorUf,
      doctorName: doctorName || 'Dr(a). Médico Titular',
      doctorCpf,
      patientName: patientName || 'Colaborador Identificado',
      patientCpf,
      companyName: companyName || 'Empresa Notificante',
      fileName: fileName || 'atestado_falso.pdf',
      fileSha256: fileSha256 || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      restDaysClaimed: restDaysClaimed || 3,
      ipAddress,
      customStatement
    });

    return NextResponse.json({
      success: true,
      incident: result.incident,
      dossier: result.dossier
    });
  } catch (error: any) {
    console.error('Erro ao gerar dossiê policial:', error);
    return NextResponse.json(
      { error: error?.message || 'Erro ao gerar dossiê.' },
      { status: 500 }
    );
  }
}
