import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateEmployeeFolder } from '@/lib/services/absenteeism-service';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const employee = searchParams.get('employee');
  const companyId = searchParams.get('companyId') || 'default';
  const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()), 10);

  if (!employee) {
    return NextResponse.json({ error: 'Parâmetro employee obrigatório (CPF ou Nome)' }, { status: 400 });
  }

  const folder = getOrCreateEmployeeFolder(employee, companyId, year);
  return NextResponse.json({ folder });
}
