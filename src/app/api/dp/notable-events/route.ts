import { NextRequest, NextResponse } from 'next/server';
import { getNotableEvents, addNotableEvent, deleteNotableEvent } from '@/lib/services/absenteeism-service';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const companyId = searchParams.get('companyId') || 'default';
  const events = getNotableEvents(companyId);
  return NextResponse.json({ events });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.title || !body.startDate || !body.endDate) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: title, startDate, endDate' },
        { status: 400 }
      );
    }

    const newEvent = addNotableEvent({
      companyId: body.companyId || 'default',
      title: body.title,
      startDate: body.startDate,
      endDate: body.endDate,
      category: body.category || 'OUTRO',
      description: body.description
    });

    return NextResponse.json({ success: true, event: newEvent }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 });
  }
  const removed = deleteNotableEvent(id);
  return NextResponse.json({ success: removed });
}
