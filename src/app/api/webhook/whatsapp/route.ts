import { NextRequest, NextResponse } from 'next/server';
import { validateMedicalAttestation } from '@/lib/crypto/validator';
import { formatWhatsAppResponse, formatEmployeeReceiptMessage } from '@/lib/whatsapp/message-formatter';
import { getCompanyById } from '@/lib/services/company-service';
import { sendWhatsAppMessage } from '@/lib/whatsapp/client';
import { getCompanyDocumentHashes, saveValidationLog, deductCredit } from '@/lib/supabase/service';
import { 
  isAdminPhone, 
  isRegisteredCompanyPhone, 
  isDuplicateMessage, 
  registerOrUpdateLead, 
  generateLeadScoreboard, 
  LEAD_GREETING_MESSAGE,
  normalizePhone
} from '@/lib/services/lead-service';

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

    // Extrair remetente e detalhes da mídia ou texto
    const { 
      phone, 
      mediaUrl, 
      mimeType, 
      fileName, 
      mediaBase64, 
      rawEvolutionData, 
      text, 
      messageId, 
      fromMe, 
      isGroup 
    } = extractMediaInfoFromPayload(payload);

    // 1. FILTRO DE DESCARTE IMEDIATO:
    // Ignora mensagens de grupos ou originadas do próprio número da instância
    const botPhone = process.env.WHATSAPP_BOT_PHONE || '551331500987';
    const isBotSelf = botPhone && normalizePhone(botPhone) === normalizePhone(phone);
    if (!phone || isGroup || fromMe || isBotSelf) {
      return NextResponse.json({ 
        received: true, 
        ignored: 'Mensagem de grupo, própria instância ou sem telefone identificado' 
      });
    }

    // Flag de controle do experimento de leads / placar
    const LEAD_SCOREBOARD_ENABLED = process.env.LEAD_SCOREBOARD_ENABLED === 'true';

    // =========================================================================
    // FLUXO DE LEADS / PLACAR (SOMENTE QUANDO LEAD_SCOREBOARD_ENABLED === TRUE)
    // =========================================================================
    if (LEAD_SCOREBOARD_ENABLED) {
      try {
        // DEDUPLICAÇÃO DE WEBHOOK (REQUISITO 3.1):
        // Fica restrita ao escopo da flag. Impede reenvios do provedor de inflar message_count
        if (messageId && await isDuplicateMessage(messageId, phone)) {
          return NextResponse.json({ 
            received: true, 
            deduplicated: true, 
            messageId 
          });
        }

        const cleanText = (text || '').trim();
        const lowerText = cleanText.toLowerCase();

        // ---------------------------------------------------------------------
        // PRIORIDADE 1: ADMIN_WHATSAPP (COMANDOS DO PLACAR)
        // ---------------------------------------------------------------------
        if (isAdminPhone(phone)) {
          const isScoreCommand = 
            lowerText === 'score' ||
            lowerText.includes('score de leads') ||
            lowerText.includes('score hoje') ||
            lowerText.includes('score 7d') ||
            lowerText.includes('score ref') ||
            lowerText === 'placar' ||
            lowerText.includes('placar de leads');

          if (isScoreCommand) {
            const scoreboardText = await generateLeadScoreboard(lowerText);
            await sendWhatsAppMessage({
              phone,
              message: scoreboardText
            });

            return NextResponse.json({
              received: true,
              type: 'admin_scoreboard_sent',
              phone
            });
          }

          // Se o admin enviar outro texto qualquer
          await sendWhatsAppMessage({
            phone,
            message: 'Comandos disponíveis para o Admin:\n• *score* (placar geral)\n• *score hoje* (foco em hoje)\n• *score 7d* (últimos 7 dias)\n• *score ref* (detalhamento por código ref)'
          });

          return NextResponse.json({
            received: true,
            type: 'admin_command_guide',
            phone
          });
        }

        // ---------------------------------------------------------------------
        // PRIORIDADE 2: ISOLAMENTO OPERACIONAL - ANEXOS E CLIENTES CADASTRADOS
        // Se a mensagem contiver documento/mídia ou originar de empresa cadastrada,
        // o tráfego é estritamente operacional de DP e JAMAIS concorre com leads comerciais.
        // ---------------------------------------------------------------------
        const hasMediaAttachment = !!(mediaUrl || mediaBase64);
        const isClient = await isRegisteredCompanyPhone(phone);

        if (hasMediaAttachment || isClient) {
          return await processClientAttestationFlow({
            payload,
            phone,
            text,
            mediaUrl,
            mimeType,
            fileName,
            mediaBase64,
            rawEvolutionData
          });
        }

        // ---------------------------------------------------------------------
        // PRIORIDADE 3: QUALQUER OUTRO NÚMERO (TRATADO COMO LEAD DO VURIO)
        // Mensagens e anexos de leads NUNCA são processados como atestado médico
        // ---------------------------------------------------------------------
        const leadResult = await registerOrUpdateLead(phone, cleanText);

        // Resposta automática do Marcos apenas na 1ª mensagem do lead
        if (leadResult.shouldSendAutoReply && !leadResult.isOptOut) {
          await sendWhatsAppMessage({
            phone,
            message: LEAD_GREETING_MESSAGE
          });
        }

        return NextResponse.json({
          received: true,
          type: 'lead_processed',
          phone,
          isNewLead: leadResult.isNewLead,
          messageCount: leadResult.messageCount,
          optOut: leadResult.isOptOut
        });

      } catch (leadError) {
        // REQUISITO 3.2: Qualquer erro no código novo (banco, rede, etc.)
        // é capturado e NUNCA derruba o webhook, respondendo 200 ao provedor
        console.error('[Webhook] Erro no fluxo de leads (capturado com segurança):', (leadError as any)?.message || 'Erro interno');
        return NextResponse.json({ 
          received: true, 
          status: 'fallback_handled', 
          error: 'Falha interna absorvida no processador de leads' 
        });
      }
    }

    // =========================================================================
    // FLUXO ORIGINAL DE CLIENTES (QUANDO LEAD_SCOREBOARD_ENABLED === FALSE)
    // Nenhuma consulta nem gravação em leads é executada
    // =========================================================================
    return await processClientAttestationFlow({
      payload,
      phone,
      text,
      mediaUrl,
      mimeType,
      fileName,
      mediaBase64,
      rawEvolutionData
    });

  } catch (error: any) {
    console.error('Erro geral no webhook WhatsApp:', (error as any)?.message || 'Erro no webhook');
    // Sempre responde 200 com status de erro tratado para evitar loops de retentativa do provedor
    return NextResponse.json({ 
      received: true, 
      error: error?.message || 'Erro no webhook' 
    });
  }
}

/**
 * Fluxo de recepção e análise de atestados médicos de clientes cadastrados
 */
async function processClientAttestationFlow(params: {
  payload: any;
  phone: string;
  text: string;
  mediaUrl: string;
  mimeType: string;
  fileName: string;
  mediaBase64: string;
  rawEvolutionData: any;
}) {
  const { payload, phone, text, mediaUrl, mimeType, fileName, mediaBase64, rawEvolutionData } = params;

  // Se for mensagem de texto sem anexo
  if (!mediaUrl && !mediaBase64) {
    const lowerText = (text || '').toLowerCase().trim();

    if (
      lowerText.includes('assinar') || 
      lowerText.includes('plano') || 
      lowerText.includes('starter') || 
      lowerText.includes('compliance') || 
      lowerText.includes('enterprise') || 
      lowerText.includes('proposta')
    ) {
      await sendWhatsAppMessage({
        phone,
        message: 'Olá! Seja muito bem-vindo ao *Vurio*! 🛡️\n\nRecebemos seu pedido de ativação! Para gerarmos sua fatura oficial na InfinitePay (*Pix ou Cartão de Crédito*) e liberarmos o acesso da sua empresa, por favor nos informe:\n\n1️⃣ *Razão Social ou Nome Completo*\n2️⃣ *CNPJ ou CPF*\n3️⃣ *E-mail corporativo*\n\nAssim que enviar, vincularemos sua empresa em instantes!'
      });

      return NextResponse.json({
        received: true,
        type: 'subscription_inquiry',
        message: 'Mensagem de interesse em plano respondida automaticamente.'
      });
    }

    // Qualquer mensagem de texto sem anexo orienta o colaborador sobre o envio do atestado
    await sendWhatsAppMessage({
      phone,
      message: 'Olá! Sou o assistente de recepção e validação de atestados do *Vurio* 🛡️\n\nPara entregar seu atestado médico ao Departamento Pessoal, basta enviar por aqui:\n📄 O arquivo *PDF* original ou uma *foto nítida e bem iluminada* do documento.\n\nAssim que você enviar, faremos a leitura e confirmação do recebimento em instantes.'
    });

    return NextResponse.json({
      received: true,
      type: 'greeting',
      message: 'Orientação de envio de atestado respondida automaticamente.'
    });
  }

  // 1. Enviar mensagem automática instantânea de processamento
  await sendWhatsAppMessage({
    phone,
    message: '📄 *Documento recebido. Aguarde a confirmação do seu protocolo de entrega...*'
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
      console.error('Falha ao descriptografar mídia via Evolution API:', (err as any)?.message || 'Erro de rede');
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
      message: '⚠️ Não foi possível processar o arquivo enviado. Por favor, tente enviar novamente em PDF ou foto legível.'
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

  // 5. Salvar auditoria LGPD e debitar crédito (somente para atestados médicos válidos)
  await saveValidationLog(companyId, report, fileName, executionTimeMs);
  if (report.status !== 'NOT_AN_ATTESTATION') {
    await deductCredit(companyId);
  }

  // 6. Formatar identificador de protocolo asséptico e relatórios
  const protocolId = report.fileSha256
    ? `VUR-${report.fileSha256.substring(0, 8).toUpperCase()}`
    : `VUR-${Date.now().toString(36).toUpperCase()}`;

  const employeeReceipt = formatEmployeeReceiptMessage(protocolId);
  const dpDetailedReport = formatWhatsAppResponse(report);

  // Identifica se o remetente é o próprio contato autorizado do DP/RH ou administrador
  const company = await getCompanyById(companyId);
  const dpAuthorizedPhone = company?.whatsappPhone || process.env.DP_NOTIFICATION_PHONE;
  const isSenderAuthorizedDP = 
    (dpAuthorizedPhone && normalizePhone(phone) === normalizePhone(dpAuthorizedPhone)) || 
    isAdminPhone(phone);

  if (isSenderAuthorizedDP) {
    // 7.1. Se o remetente for o próprio DP/RH, devolve o relatório pericial detalhado diretamente
    await sendWhatsAppMessage({
      phone,
      message: dpDetailedReport
    });
  } else {
    // 7.2. Se o remetente for o COLABORADOR, devolve ESTRITAMENTE a confirmação asséptica de protocolo
    // (Blindagem jurídica contra constrangimento / passivo trabalhista)
    await sendWhatsAppMessage({
      phone,
      message: employeeReceipt
    });

    // 7.3. O relatório pericial detalhado é direcionado exclusivamente ao contato/grupo autorizado do DP/RH
    if (dpAuthorizedPhone && normalizePhone(dpAuthorizedPhone) !== normalizePhone(phone)) {
      await sendWhatsAppMessage({
        phone: dpAuthorizedPhone,
        message: `📋 *Novo Atestado Triado - Protocolo #${protocolId}*\n*Remetente (Colaborador):* ***${phone.slice(-4)}\n\n` + dpDetailedReport
      });
    }
  }

  return NextResponse.json({
    success: true,
    phone,
    protocolId,
    status: report.status,
    executionTimeMs,
    employeeReceiptSent: !isSenderAuthorizedDP,
    dpReportSent: true
  });
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
  let text = '';
  let messageId = '';
  let fromMe = false;
  let isGroup = false;

  // Formato Z-API
  if (payload.phone) {
    phone = String(payload.phone);
    messageId = payload.messageId || payload.id || payload.wamid || '';
    fromMe = Boolean(payload.fromMe || payload.isFromMe);
    isGroup = Boolean(payload.isGroup || phone.includes('@g.us'));

    if (payload.text?.message) text = payload.text.message;
    else if (payload.message?.text) text = payload.message.text;
    else if (typeof payload.text === 'string') text = payload.text;

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
    const remoteJid = String(payload.data.key.remoteJid || '');
    phone = remoteJid.replace('@s.whatsapp.net', '');
    messageId = payload.data.key.id || '';
    fromMe = Boolean(payload.data.key.fromMe);
    isGroup = Boolean(remoteJid.includes('@g.us') || payload.data.key.participant);
    rawEvolutionData = payload.data;
    const message = payload.data.message || {};

    if (message.conversation) text = message.conversation;
    else if (message.extendedTextMessage?.text) text = message.extendedTextMessage.text;
    
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
  if (payload.text && !text) text = typeof payload.text === 'string' ? payload.text : (payload.text.message || '');
  if (payload.messageId && !messageId) messageId = payload.messageId;
  if (payload.id && !messageId) messageId = payload.id;
  if (payload.fromMe !== undefined) fromMe = Boolean(payload.fromMe);
  if (payload.isGroup !== undefined) isGroup = Boolean(payload.isGroup);

  if (mediaBase64 && mediaBase64.includes('base64,')) {
    mediaBase64 = mediaBase64.split('base64,')[1];
  }

  return { phone, mediaUrl, mimeType, fileName, mediaBase64, rawEvolutionData, text, messageId, fromMe, isGroup };
}
