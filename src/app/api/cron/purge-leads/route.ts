import { NextRequest, NextResponse } from 'next/server';
import { purgeExpiredLeads, LEAD_RETENTION_DAYS } from '@/lib/services/lead-service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Endpoint de Expurgo Programado LGPD
 * Finalidade: Destruição segura de leads inativos após período de retenção.
 * Pode ser acionado via Vercel Cron ou chamada autorizada com CRON_SECRET.
 */
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    // Se houver CRON_SECRET configurado, exige validação de Bearer token
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const result = await purgeExpiredLeads(LEAD_RETENTION_DAYS);

    return NextResponse.json({
      success: result.success,
      deletedCount: result.deletedCount,
      retentionDaysApplied: LEAD_RETENTION_DAYS,
      executedAt: new Date().toISOString(),
      error: result.error || null
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Erro no expurgo' }, { status: 500 });
  }
}
