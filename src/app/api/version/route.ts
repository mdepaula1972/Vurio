import { NextResponse } from 'next/server';
import { getAppVersionInfo } from '@/lib/version';

export const dynamic = 'force-dynamic';

export async function GET() {
  const versionInfo = getAppVersionInfo();
  return NextResponse.json(versionInfo, {
    headers: {
      'Cache-Control': 'no-store, max-age=0',
      'X-Vurio-Version': versionInfo.version,
      'X-Vurio-Engine': versionInfo.engine
    }
  });
}
