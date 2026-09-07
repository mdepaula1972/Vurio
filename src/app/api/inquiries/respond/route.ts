import { NextRequest, NextResponse } from 'next/server';
import { answerInquiry, getInquiryByToken } from '@/lib/services/inquiry-service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.json({ error: 'Token não fornecido.' }, { status: 400 });
  }

  const inquiry = await getInquiryByToken(token);
  if (!inquiry) {
    return NextResponse.json({ error: 'Diligência não encontrada ou expirada.' }, { status: 404 });
  }

  return NextResponse.json({ success: true, inquiry });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, action, notes } = body;

    if (!token || !action) {
      return NextResponse.json(
        { error: 'Token e ação (CONFIRM ou REPUDIATE) são obrigatórios.' },
        { status: 400 }
      );
    }

    const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1';

    const result = await answerInquiry({
      token,
      action,
      notes,
      ipAddress
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Erro na resposta da diligência:', error);
    return NextResponse.json(
      { error: error?.message || 'Erro ao processar resposta da diligência.' },
      { status: 500 }
    );
  }
}
