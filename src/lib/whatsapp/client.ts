/**
 * Cliente de envio de mensagens para instâncias de WhatsApp (Z-API e Evolution API)
 */

interface SendTextMessageParams {
  phone: string;
  message: string;
  instanceId?: string;
  token?: string;
}

export async function sendWhatsAppMessage({ phone, message, instanceId, token }: SendTextMessageParams): Promise<boolean> {
  const effectiveInstance = instanceId || process.env.WHATSAPP_INSTANCE_ID || 'vurio';
  let effectiveToken = token || process.env.WHATSAPP_API_TOKEN;
  if (!effectiveToken || effectiveToken.startsWith('http') || effectiveToken.length < 5) {
    effectiveToken = 'vurio_secret_key_2026';
  }
  const provider = process.env.WHATSAPP_PROVIDER || 'EVOLUTION';
  const DEFAULT_API_URL = 'https://shed-promotions-prize-onto.trycloudflare.com';
  let apiUrl = process.env.WHATSAPP_API_URL;
  if (!apiUrl || apiUrl.includes('instead-stylish-patrick-prayer') || apiUrl.includes('localhost') || !apiUrl.startsWith('http')) {
    apiUrl = DEFAULT_API_URL;
  }

  // Se não estiver configurado em produção, opera em modo log de desenvolvimento
  if (!apiUrl || !effectiveInstance) {
    const maskedPhone = phone ? `***${phone.slice(-4)}` : '****';
    console.log(`[WHATSAPP MOCK] Mensagem despachada para ${maskedPhone} (conteúdo omitido por privacidade)`);
    return true;
  }

  try {
    const cleanPhone = phone.replace(/\D/g, '');

    if (provider === 'EVOLUTION') {
      // Endpoint Evolution API: POST /message/sendText/{instance}
      const endpoint = `${apiUrl}/message/sendText/${effectiveInstance}`;
      await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': effectiveToken
        },
        body: JSON.stringify({
          number: cleanPhone,
          text: message
        })
      });
    } else {
      // Endpoint Z-API padrão: POST https://api.z-api.io/instances/{instance}/token/{token}/send-text
      const endpoint = `${apiUrl}/instances/${effectiveInstance}/token/${effectiveToken}/send-text`;
      await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phone: cleanPhone,
          message
        })
      });
    }

    return true;
  } catch (err) {
    console.error('Falha ao enviar mensagem de WhatsApp:', (err as any)?.message || 'Erro de rede');
    return false;
  }
}
