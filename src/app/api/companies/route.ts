import { NextRequest, NextResponse } from 'next/server';
import { getAllCompanies, createCompany, updateCompany } from '@/lib/services/company-service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    const companies = await getAllCompanies();
    return NextResponse.json({ success: true, companies });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.name || !body.cnpj) {
      return NextResponse.json({ success: false, error: 'Razão Social e CNPJ são obrigatórios.' }, { status: 400 });
    }

    const company = await createCompany({
      name: body.name,
      tradeName: body.tradeName || body.name,
      cnpj: body.cnpj,
      plan: body.plan || 'COMPLIANCE_PRO',
      creditsBalance: Number(body.creditsBalance) || 100,
      whatsappInstance: body.whatsappInstance || ('vurio_' + body.cnpj.replace(/\D/g, '').substring(0, 6)),
      whatsappPhone: body.whatsappPhone,
      whatsappStatus: 'waiting_qr',
      workCity: body.workCity || 'São Paulo',
      workState: body.workState || 'SP',
      contactEmail: body.contactEmail || 'contato@empresa.com.br',
      active: true
    });

    return NextResponse.json({ success: true, company });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.id) {
      return NextResponse.json({ success: false, error: 'ID da empresa é obrigatório.' }, { status: 400 });
    }

    const updated = await updateCompany(body.id, body);
    return NextResponse.json({ success: true, company: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}
