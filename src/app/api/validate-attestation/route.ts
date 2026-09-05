import { NextRequest, NextResponse } from 'next/server';
import { validateMedicalAttestation } from '@/lib/crypto/validator';
import { formatWhatsAppResponse } from '@/lib/whatsapp/message-formatter';
import { getCompanyDocumentHashes, saveValidationLog, deductCredit } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs'; // Necessário para operações criptográficas nativas e de buffer

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    let fileBuffer: Buffer | null = null;
    let mimeType = 'application/pdf';
    let fileName = 'atestado.pdf';
    let companyId = 'demo-company-1';

    const contentType = req.headers.get('content-type') || '';

    // 1. Suporte a Multipart / Form-Data (Upload de arquivo direto)
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      const customCompanyId = formData.get('companyId') as string | null;

      if (!file) {
        return NextResponse.json({ error: 'Nenhum arquivo enviado no campo "file".' }, { status: 400 });
      }

      const arrayBuffer = await file.arrayBuffer();
      fileBuffer = Buffer.from(arrayBuffer);
      mimeType = file.type || mimeType;
      fileName = file.name || fileName;
      if (customCompanyId) companyId = customCompanyId;
    }
    // 2. Suporte a JSON Payload (Base64 enviado por Webhooks do WhatsApp)
    else if (contentType.includes('application/json')) {
      const body = await req.json();
      const { fileBase64, mimeType: bodyMime, fileName: bodyName, companyId: bodyCompanyId } = body;

      if (!fileBase64) {
        return NextResponse.json({ error: 'Payload JSON deve conter "fileBase64".' }, { status: 400 });
      }

      fileBuffer = Buffer.from(fileBase64, 'base64');
      if (bodyMime) mimeType = bodyMime;
      if (bodyName) fileName = bodyName;
      if (bodyCompanyId) companyId = bodyCompanyId;
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

    // 3. Buscar hashes existentes da empresa para Trava Antifraude de Duplicidade
    const existingHashes = await getCompanyDocumentHashes(companyId);

    // 4. Executar Validação Criptográfica e Triagem Inteligente
    const report = await validateMedicalAttestation(fileBuffer, mimeType, fileName, existingHashes);

    // 5. Formatar mensagem padrão para WhatsApp
    const whatsappMessage = formatWhatsAppResponse(report);

    const executionTimeMs = Date.now() - startTime;

    // 6. Registrar Auditoria no Supabase (LGPD Compliant) e Debitar Crédito
    await saveValidationLog(companyId, report, fileName, executionTimeMs);
    await deductCredit(companyId);

    return NextResponse.json({
      success: true,
      executionTimeMs,
      status: report.status,
      isAuthentic: report.isAuthentic,
      report,
      whatsappMessage
    });
  } catch (error: any) {
    console.error('Erro na rota /api/validate-attestation:', error);
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
