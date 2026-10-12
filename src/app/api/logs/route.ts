import { NextRequest, NextResponse } from 'next/server';
import { getRecentValidationLogs } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const companyId = searchParams.get('companyId') || undefined;
  const logs = await getRecentValidationLogs(companyId);
  return NextResponse.json({ logs });
}
