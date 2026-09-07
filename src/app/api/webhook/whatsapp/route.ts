import { NextRequest, NextResponse } from 'next/server';
import { validateMedicalAttestation } from '@/lib/crypto/validator';
import { formatWhatsAppResponse } from '@/lib/whatsapp/message-formatter';
import { sendWhatsAppMessage } from '@/lib/whatsapp/client';
import { getCompanyDocumentHashes, saveValidationLog, deductCredit } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Validação de Webhook (GET)
 */
export async function GET() {
  return NextResponse.json({ status: 'active', message: 'Vurio WhatsApp Webhook pronto para escuta.' });
}

/**
 * Receptor de Mensagens do WhatsApp (POST) - Compatível com Z-API e Evolution API
 */
export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();

    // Extrair remetente e detalhes da mídia
    const { phone, mediaUrl, mimeType, fileName, mediaBase64, rawEvolutionData } = extractMediaInfoFromPayload(payload);

    if (!phone) {
      return NextResponse.json({ received: true, ignored: 'Sem número de telefone no payload' });
    }

    if (!mediaUrl && !mediaBase64) {
      // Mensagem de texto comum sem anexo
      return NextResponse.json({
        received: true,
        message: 'Mensagem recebida sem arquivo de atestado médico anexado.'
      });
    }

    // 1. Enviar mensagem automática instantânea de processamento
    await sendWhatsAppMessage({
      phone,
      message: '🔍 *Analisando assinatura digital e integridade do atestado...*'
    });

    // 2. Obter buffer do arquivo (Base64 direto, descriptografia Evolution API ou download da URL)
    let fileBuffer: Buffer | null = null;
    if (mediaBase64) {
      fileBuffer = Buffer.from(mediaBase64, 'base64');
    } else if (rawEvolutionData) {
      try {
        const apiUrl = process.env.WHATSAPP_API_URL || '';
        const instanceId = process.env.WHATSAPP_INSTANCE_ID || 'vurio';
        const apiKey = process.env.WHATSAPP_API_TOKEN || '';
        if (apiUrl && instanceId) {
          const decryptRes = await fetch(`${apiUrl}/chat/getBase64FromMediaMessage/${instanceId}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': apiKey
            },
            body: JSON.stringify({
              message: rawEvolutionData,
              convertToMp4: false
            })
          });
          const decryptData = await decryptRes.json();
          if (decryptData && decryptData.base64) {
            fileBuffer = Buffer.from(decryptData.base64, 'base64');
          }
        }
      } catch (err) {
        console.error('Falha ao descriptografar mídia via Evolution API:', err);
      }
    }

    if (!fileBuffer && mediaUrl && !mediaUrl.includes('whatsapp.net')) {
      const response = await fetch(mediaUrl);
      const arrayBuffer = await response.arrayBuffer();
      fileBuffer = Buffer.from(arrayBuffer);
    }

    if (!fileBuffer) {
      await sendWhatsAppMessage({
        phone,
        message: '⚠️ Não foi possível processar o arquivo enviado. Por favor, tente enviar novamente em PDF.'
      });
      return NextResponse.json({ error: 'Falha no download da mídia' }, { status: 400 });
    }

    const companyId = payload.companyId || 'demo-company-1';

    // 3. Buscar hashes para trava de duplicidade
    const existingHashes = await getCompanyDocumentHashes(companyId);

    // 4. Executar validação criptográfica e triagem do documento
    const startTime = Date.now();
    const report = await validateMedicalAttestation(fileBuffer, mimeType, fileName, existingHashes);
    const executionTimeMs = Date.now() - startTime;

    // 5. Salvar auditoria LGPD e debitar crédito
    await saveValidationLog(companyId, report, fileName, executionTimeMs);
    await deductCredit(companyId);

    // 6. Formatar mensagem de resposta de acordo com a regra de negócio
    const whatsappResponse = formatWhatsAppResponse(report);

    // 7. Enviar resposta para o WhatsApp do colaborador/RH
    await sendWhatsAppMessage({
      phone,
      message: whatsappResponse
    });

    return NextResponse.json({
      success: true,
      phone,
      status: report.status,
      executionTimeMs,
      whatsappResponse
    });
  } catch (error: any) {
    console.error('Erro no processamento do webhook WhatsApp:', error);
    return NextResponse.json({ error: error?.message || 'Erro no webhook' }, { status: 500 });
  }
}

/**
 * Normaliza os formatos de payload recebidos da Z-API ou Evolution API
 */
function extractMediaInfoFromPayload(payload: any) {
  let phone = '';
  let mediaUrl = '';
  let mimeType = '';
  let fileName = '';
  let mediaBase64 = '';
  let rawEvolutionData: any = null;

  // Formato Z-API
  if (payload.phone) {
    phone = String(payload.phone);
    if (payload.document) {
      mediaUrl = payload.document.documentUrl || '';
      mimeType = payload.document.mimeType || 'application/pdf';
      fileName = payload.document.fileName || 'atestado.pdf';
    } else if (payload.image) {
      mediaUrl = payload.image.imageUrl || '';
      mimeType = payload.image.mimeType || 'image/jpeg';
      fileName = 'foto_atestado.jpg';
    }
  }
  // Formato Evolution API
  else if (payload.data && payload.data.key) {
    phone = String(payload.data.key.remoteJid || '').replace('@s.whatsapp.net', '');
    rawEvolutionData = payload.data;
    const message = payload.data.message || {};
    
    // Captura base64 caso já venha injetado no webhook
    if (message.base64) mediaBase64 = message.base64;
    else if (payload.data.base64) mediaBase64 = payload.data.base64;
    else if (message.documentMessage?.base64) mediaBase64 = message.documentMessage.base64;
    else if (message.imageMessage?.base64) mediaBase64 = message.imageMessage.base64;

    if (message.documentMessage) {
      mediaUrl = message.documentMessage.url || '';
      mimeType = message.documentMessage.mimetype || 'application/pdf';
      fileName = message.documentMessage.fileName || 'atestado.pdf';
    } else if (message.imageMessage) {
      mediaUrl = message.imageMessage.url || '';
      mimeType = message.imageMessage.mimetype || 'image/jpeg';
      fileName = 'foto_atestado.jpg';
    }
  }

  // Suporte a payload direto de teste / simulador
  if (payload.mediaBase64) mediaBase64 = payload.mediaBase64;
  if (payload.base64 && !mediaBase64) mediaBase64 = payload.base64;
  if (payload.mediaUrl) mediaUrl = payload.mediaUrl;
  if (payload.mimeType) mimeType = payload.mimeType;
  if (payload.fileName) fileName = payload.fileName;
  if (payload.number && !phone) phone = String(payload.number);

  // Limpeza de prefixo Data-URI se existir
  if (mediaBase64 && mediaBase64.includes('base64,')) {
    mediaBase64 = mediaBase64.split('base64,')[1];
  }

  return { phone, mediaUrl, mimeType, fileName, mediaBase64, rawEvolutionData };
}
