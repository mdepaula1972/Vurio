import { NextResponse } from 'next/server';
import { getRecentValidationLogs } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';

export async function GET() {
  const logs = await getRecentValidationLogs();
  return NextResponse.json({ logs });
}
