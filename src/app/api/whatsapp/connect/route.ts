import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Endpoint interno para gerenciar a conexão da Evolution API e geração de QR Code
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const instance = searchParams.get('instance') || process.env.WHATSAPP_INSTANCE_ID || 'vurio';
  const apiUrl = process.env.WHATSAPP_API_URL || 'http://localhost:8080';
  const apiKey = process.env.WHATSAPP_API_TOKEN || 'vurio_secret_key_2026';

  try {
    // 1. Consultar estado da conexão
    const stateRes = await fetch(`${apiUrl}/instance/connectionState/${instance}`, {
      headers: { apikey: apiKey },
      cache: 'no-store'
    });

    if (!stateRes.ok) {
      return NextResponse.json({
        online: true,
        state: 'close',
        instance,
        message: 'Instância desconectada ou inexistente.'
      });
    }

    const stateData = await stateRes.json();
    const currentState = stateData?.instance?.state || 'close';

    // Se já estiver conectado
    if (currentState === 'open') {
      return NextResponse.json({
        online: true,
        state: 'open',
        instance,
        phone: stateData?.instance?.owner || stateData?.instance?.profileName || 'WhatsApp Conectado',
        message: 'WhatsApp conectado com sucesso e pronto para escuta.'
      });
    }

    // 2. Se não estiver conectado, solicitar o QR Code atualizado
    const connectRes = await fetch(`${apiUrl}/instance/connect/${instance}`, {
      headers: { apikey: apiKey },
      cache: 'no-store'
    });

    const connectData = await connectRes.json();
    const qrcode = connectData?.base64 || connectData?.qrcode?.base64 || null;

    return NextResponse.json({
      online: true,
      state: currentState,
      instance,
      qrcode,
      pairingCode: connectData?.pairingCode || null,
      message: 'Aguardando leitura do QR Code.'
    });
  } catch (error: any) {
    return NextResponse.json({
      online: false,
      state: 'offline',
      instance,
      error: error?.message || 'Servidor Evolution API inacessível em localhost:8080.',
      dockerCommand: 'docker-compose up -d'
    });
  }
}

export async function POST(req: NextRequest) {
  const apiUrl = process.env.WHATSAPP_API_URL || 'http://localhost:8080';
  const apiKey = process.env.WHATSAPP_API_TOKEN || 'vurio_secret_key_2026';

  try {
    const body = await req.json();
    const instance = body.instance || process.env.WHATSAPP_INSTANCE_ID || 'vurio';
    const action = body.action || 'logout';

    if (action === 'logout') {
      await fetch(`${apiUrl}/instance/logout/${instance}`, {
        method: 'DELETE',
        headers: { apikey: apiKey }
      });

      return NextResponse.json({ success: true, message: 'Instância desconectada com sucesso.' });
    }

    return NextResponse.json({ success: false, error: 'Ação desconhecida' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}
