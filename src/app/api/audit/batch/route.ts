import { NextRequest, NextResponse } from 'next/server';
import { executeBatchAudit, TaxRegime } from '@/lib/services/batch-audit-service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';
    const files: { name: string; buffer: Buffer }[] = [];
    let averageMonthlySalary = 3000.0;
    let taxRegime: TaxRegime = 'LUCRO_PRESUMIDO';
    let companyId = 'demo-company-1';

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const salaryVal = formData.get('averageMonthlySalary');
      const regimeVal = formData.get('taxRegime');
      const companyVal = formData.get('companyId');

      if (salaryVal) averageMonthlySalary = parseFloat(salaryVal.toString()) || averageMonthlySalary;
      if (regimeVal) taxRegime = regimeVal.toString() as TaxRegime;
      if (companyVal) companyId = companyVal.toString();

      // Múltiplos arquivos ou ZIP
      const allEntries = Array.from(formData.entries());
      for (const [key, value] of allEntries) {
        if (value instanceof File) {
          const arrayBuffer = await value.arrayBuffer();
          files.push({
            name: value.name,
            buffer: Buffer.from(arrayBuffer)
          });
        }
      }
    } else if (contentType.includes('application/json')) {
      const body = await req.json();
      if (body.averageMonthlySalary) averageMonthlySalary = parseFloat(body.averageMonthlySalary);
      if (body.taxRegime) taxRegime = body.taxRegime as TaxRegime;
      if (body.companyId) companyId = body.companyId;

      if (Array.isArray(body.files)) {
        for (const item of body.files) {
          if (item.name && item.base64) {
            files.push({
              name: item.name,
              buffer: Buffer.from(item.base64, 'base64')
            });
          }
        }
      }
    }

    const summary = await executeBatchAudit({
      companyId,
      files,
      averageMonthlySalary,
      taxRegime,
      auditTitle: `Auditoria de Passivo Trabalhista (${files.length} documentos)`
    });

    return NextResponse.json({
      success: true,
      summary
    });
  } catch (error: any) {
    console.error('Erro na auditoria em lote:', error);
    return NextResponse.json(
      { error: error?.message || 'Erro ao processar auditoria retroativa.' },
      { status: 500 }
    );
  }
}
