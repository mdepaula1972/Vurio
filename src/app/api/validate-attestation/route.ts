import { NextRequest, NextResponse } from 'next/server';
import { validateMedicalAttestation } from '@/lib/crypto/validator';
import { formatWhatsAppResponse, formatEmployeeReceiptMessage } from '@/lib/whatsapp/message-formatter';
import { getCompanyDocumentHashes, saveValidationLog, deductCredit } from '@/lib/supabase/service';
import { formatProtocolId, buildForensicReport, generateHumanizedComplianceReport } from '@/lib/services/compliance-report-service';
import { sendWhatsAppMessage } from '@/lib/whatsapp/client';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs'; // Necessário para operações criptográficas nativas e de buffer

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    let fileBuffer: Buffer | null = null;
    let mimeType = 'application/pdf';
    let fileName = 'atestado.pdf';
    let companyId = 'solucione-matriz';
    let employeePhone: string | null = null;
    let notifyEmployeeViaWhatsApp = false;

    const contentType = req.headers.get('content-type') || '';

    // 1. Suporte a Multipart / Form-Data (Upload de arquivo direto no balcão/web)
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      const customCompanyId = (formData.get('companyId') || formData.get('company_id')) as string | null;
      const rawPhone = (formData.get('employeePhone') || formData.get('phone') || formData.get('senderPhone')) as string | null;
      notifyEmployeeViaWhatsApp = formData.get('notifyWhatsApp') === 'true';

      if (!file) {
        return NextResponse.json({ error: 'Nenhum arquivo enviado no campo "file".' }, { status: 400 });
      }

      const arrayBuffer = await file.arrayBuffer();
      fileBuffer = Buffer.from(arrayBuffer);
      mimeType = file.type || mimeType;
      fileName = file.name || fileName;
      if (customCompanyId) companyId = customCompanyId;
      if (rawPhone) employeePhone = rawPhone;
    }
    // 2. Suporte a JSON Payload (Base64 enviado por Webhooks / APIs)
    else if (contentType.includes('application/json')) {
      const body = await req.json();
      const { 
        fileBase64, 
        mimeType: bodyMime, 
        fileName: bodyName, 
        companyId: bodyCompanyId,
        company_id: bodyCompanyIdAlt,
        employeePhone: bodyPhone,
        notifyWhatsApp: bodyNotify
      } = body;

      if (!fileBase64) {
        return NextResponse.json({ error: 'Payload JSON deve conter "fileBase64".' }, { status: 400 });
      }

      fileBuffer = Buffer.from(fileBase64, 'base64');
      if (bodyMime) mimeType = bodyMime;
      if (bodyName) fileName = bodyName;
      if (bodyCompanyId || bodyCompanyIdAlt) companyId = bodyCompanyId || bodyCompanyIdAlt;
      if (bodyPhone) employeePhone = bodyPhone;
      if (bodyNotify) notifyEmployeeViaWhatsApp = Boolean(bodyNotify);
    } else {
      // Buffer binário bruto
      const arrayBuffer = await req.arrayBuffer();
      if (arrayBuffer.byteLength > 0) {
        fileBuffer = Buffer.from(arrayBuffer);
      }
    }

    if (!fileBuffer || fileBuffer.length === 0) {
      return NextResponse.json({ error: 'Conteúdo do arquivo vazio ou não reconhecido.' }, { status: 400 });
    }

    // 3. Buscar hashes existentes da empresa para Trava de Duplicidade por Hash SHA-256
    const existingHashes = await getCompanyDocumentHashes(companyId);

    // 4. Executar Validação Criptográfica e Triagem Inteligente
    const report = await validateMedicalAttestation(fileBuffer, mimeType, fileName, existingHashes);

    // 5. Paridade de Protocolo e Laudo Pericial Sanitizado (LGPD Estrita: Zero CID / Zero Storage)
    const protocolId = formatProtocolId(report.fileSha256);
    const forensicReport = buildForensicReport(report, protocolId, 'WEB');
    const complianceReport = generateHumanizedComplianceReport(forensicReport);
    const employeeReceipt = formatEmployeeReceiptMessage(protocolId, new Date());
    const whatsappMessage = formatWhatsAppResponse(report);

    const executionTimeMs = Date.now() - startTime;

    // 6. Registrar Auditoria no Supabase com canal 'WEB'
    await saveValidationLog({
      companyId,
      report,
      fileName,
      executionTimeMs,
      protocolId,
      channel: 'WEB',
      senderPhone: employeePhone,
      patientName: report.patient?.name || null,
      forensicReport
    });

    if (report.status !== 'NOT_AN_ATTESTATION') {
      await deductCredit(companyId);
    }

    // 7. Se solicitado envio do comprovante para o WhatsApp do colaborador (atendimento de balcão)
    if (notifyEmployeeViaWhatsApp && employeePhone) {
      try {
        await sendWhatsAppMessage({
          phone: employeePhone,
          message: employeeReceipt
        });
      } catch (waErr) {
        console.warn('Não foi possível disparar WhatsApp para o colaborador:', waErr);
      }
    }

    return NextResponse.json({
      success: true,
      protocolId,
      channel: 'WEB',
      executionTimeMs,
      status: report.status,
      isAuthentic: report.isAuthentic,
      report,
      forensicReport,
      complianceReport,
      employeeReceipt,
      whatsappMessage
    });
  } catch (error: any) {
    console.error('Erro na rota /api/validate-attestation:', (error as any)?.message || 'Erro interno');
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Erro interno durante o processamento do atestado.',
        executionTimeMs: Date.now() - startTime
      },
      { status: 500 }
    );
  }
}
