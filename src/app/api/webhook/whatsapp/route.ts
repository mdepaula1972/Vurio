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
    const { phone, mediaUrl, mimeType, fileName, mediaBase64 } = extractMediaInfoFromPayload(payload);

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

    // 2. Obter buffer do arquivo (via download da URL ou Base64)
    let fileBuffer: Buffer | null = null;
    if (mediaBase64) {
      fileBuffer = Buffer.from(mediaBase64, 'base64');
    } else if (mediaUrl) {
      const response = await fetch(mediaUrl);
      const arrayBuffer = await response.arrayBuffer();
      fileBuffer = Buffer.from(arrayBuffer);
    }

    if (!fileBuffer) {
      await sendWhatsAppMessage({
        phone,
        message: '⚠️ Não foi possível baixar o arquivo enviado. Por favor, tente enviar novamente em PDF.'
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
    const message = payload.data.message || {};
    
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
  if (payload.mediaUrl) mediaUrl = payload.mediaUrl;
  if (payload.mimeType) mimeType = payload.mimeType;
  if (payload.fileName) fileName = payload.fileName;
  if (payload.number && !phone) phone = String(payload.number);

  return { phone, mediaUrl, mimeType, fileName, mediaBase64 };
}
