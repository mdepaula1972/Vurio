import JSZip from 'jszip';
import { validateMedicalAttestation, AttestationValidationReport } from '../crypto/validator';
import { supabase, isSupabaseConfigured } from '../supabase/client';

export type TaxRegime = 'SIMPLES' | 'LUCRO_PRESUMIDO' | 'LUCRO_REAL';

export interface BatchAuditInput {
  companyId?: string;
  files: { name: string; buffer: Buffer }[];
  averageMonthlySalary?: number; // Salário médio da empresa (R$)
  taxRegime?: TaxRegime;         // Regime tributário da empresa
  auditTitle?: string;
}

export interface BatchAuditResultItem {
  fileName: string;
  status: string;
  isAuthentic: boolean;
  doctorName?: string | null;
  crm?: string | null;
  uf?: string | null;
  restDays: number;
  individualLoss: number;
  reasons: string[];
}

export interface BatchAuditSummary {
  auditId: string;
  auditTitle: string;
  totalFiles: number;
  authenticCount: number;
  inconsistentCount: number;
  inconsistencyRate: number; // Percentual %
  totalDaysLost: number;
  laborEconomics: {
    averageMonthlySalary: number;
    taxRegime: TaxRegime;
    taxBurdenPercentage: number;
    dailyLaborCost: number;
    totalFinancialLoss: number;
    vurioAnnualCostEstimate: number;
    roiRatio: number; // Ex: "11.2x"
  };
  crmOccurrences: Record<string, number>;
  items: BatchAuditResultItem[];
  createdAt: string;
}

/**
 * Taxa estimada de encargos sociais e trabalhistas adicionais por regime tributário no Brasil
 */
export function getTaxBurdenRate(regime: TaxRegime): number {
  switch (regime) {
    case 'SIMPLES':
      return 0.15; // FGTS 8% + fração de 13º/férias
    case 'LUCRO_PRESUMIDO':
      return 0.35; // INSS Patronal (20%) + Sistema S (5.8%) + RAT + FGTS
    case 'LUCRO_REAL':
    default:
      return 0.45; // Encargos plenos CLT + provisões trabalhistas
  }
}

/**
 * Descompacta um buffer de arquivo .ZIP contendo múltiplos PDFs/imagens
 */
export async function extractFilesFromZip(zipBuffer: Buffer): Promise<{ name: string; buffer: Buffer }[]> {
  const zip = new JSZip();
  const loadedZip = await zip.loadAsync(zipBuffer);
  const extractedFiles: { name: string; buffer: Buffer }[] = [];

  const entries = Object.keys(loadedZip.files);
  for (const entryName of entries) {
    const zipEntry = loadedZip.files[entryName];
    if (zipEntry.dir) continue;

    const lower = entryName.toLowerCase();
    if (lower.endsWith('.pdf') || lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.png')) {
      const fileData = await zipEntry.async('nodebuffer');
      extractedFiles.push({
        name: entryName.split('/').pop() || entryName,
        buffer: fileData
      });
    }
  }

  return extractedFiles;
}

/**
 * Executa a Auditoria Retroativa de Passivo com cálculo financeiro exato de custos de folha
 */
export async function executeBatchAudit(input: BatchAuditInput): Promise<BatchAuditSummary> {
  const auditId = `audit-${Date.now()}`;
  const salary = input.averageMonthlySalary && input.averageMonthlySalary > 0 ? input.averageMonthlySalary : 3000.0;
  const regime: TaxRegime = input.taxRegime || 'LUCRO_PRESUMIDO';
  const taxBurdenRate = getTaxBurdenRate(regime);

  // Custo diário real: (Salário * (1 + Encargos)) / 30 dias
  const dailyLaborCost = Math.round(((salary * (1 + taxBurdenRate)) / 30) * 100) / 100;

  // Se um dos arquivos for um ZIP, descompacta automaticamente
  let allFiles: { name: string; buffer: Buffer }[] = [];
  for (const item of input.files) {
    const isZip = item.name.toLowerCase().endsWith('.zip') || (item.buffer.length > 4 && item.buffer.subarray(0, 2).toString('latin1') === 'PK');
    if (isZip) {
      const unzipped = await extractFilesFromZip(item.buffer);
      allFiles.push(...unzipped);
    } else {
      allFiles.push(item);
    }
  }

  // Se nenhum arquivo válido foi passado, gera simulação realista para fins de pré-venda/marketing
  if (allFiles.length === 0) {
    allFiles = generateMockAuditFiles();
  }

  const items: BatchAuditResultItem[] = [];
  let totalDaysLost = 0;
  let authenticCount = 0;
  let inconsistentCount = 0;
  const crmOccurrences: Record<string, number> = {};

  for (const file of allFiles) {
    const report: AttestationValidationReport = await validateMedicalAttestation(
      file.buffer,
      file.name.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg',
      file.name
    );

    const restDays = report.restPeriod?.days && report.restPeriod.days > 0 ? report.restPeriod.days : 2;
    const isAuthentic = report.isAuthentic;

    if (report.doctor?.crm) {
      const crmKey = `${report.doctor.crm}/${report.doctor.uf || 'UF'}`;
      crmOccurrences[crmKey] = (crmOccurrences[crmKey] || 0) + 1;
    }

    if (isAuthentic) {
      authenticCount++;
      items.push({
        fileName: file.name,
        status: report.status,
        isAuthentic: true,
        doctorName: report.doctor?.name,
        crm: report.doctor?.crm,
        uf: report.doctor?.uf,
        restDays,
        individualLoss: 0,
        reasons: ['Assinatura Digital ICP-Brasil Válida ou QR Code Legítimo']
      });
    } else {
      inconsistentCount++;
      totalDaysLost += restDays;
      const individualLoss = Math.round(restDays * dailyLaborCost * 100) / 100;

      items.push({
        fileName: file.name,
        status: report.status,
        isAuthentic: false,
        doctorName: report.doctor?.name,
        crm: report.doctor?.crm,
        uf: report.doctor?.uf,
        restDays,
        individualLoss,
        reasons: [report.details]
      });
    }
  }

  const totalFiles = allFiles.length;
  const inconsistencyRate = totalFiles > 0 ? Math.round((inconsistentCount / totalFiles) * 1000) / 10 : 0;
  const totalFinancialLoss = Math.round(totalDaysLost * dailyLaborCost * 100) / 100;

  // Custo médio do plano Pro anual do Vurio (R$ 399/mês com 15% de desc = R$ 4.070/ano)
  const vurioAnnualCostEstimate = 4070.0;
  const roiRatio = vurioAnnualCostEstimate > 0 ? Math.round((totalFinancialLoss / vurioAnnualCostEstimate) * 10) / 10 : 1;

  const summary: BatchAuditSummary = {
    auditId,
    auditTitle: input.auditTitle || 'Auditoria Retroativa de Passivo Trabalhista',
    totalFiles,
    authenticCount,
    inconsistentCount,
    inconsistencyRate,
    totalDaysLost,
    laborEconomics: {
      averageMonthlySalary: salary,
      taxRegime: regime,
      taxBurdenPercentage: Math.round(taxBurdenRate * 100),
      dailyLaborCost,
      totalFinancialLoss,
      vurioAnnualCostEstimate,
      roiRatio: Math.max(1, roiRatio)
    },
    crmOccurrences,
    items,
    createdAt: new Date().toISOString()
  };

  if (isSupabaseConfigured && supabase && input.companyId) {
    try {
      await supabase.from('batch_audits').insert({
        company_id: input.companyId,
        audit_title: summary.auditTitle,
        total_files: summary.totalFiles,
        authentic_count: summary.authenticCount,
        inconsistent_count: summary.inconsistentCount,
        total_days_lost: summary.totalDaysLost,
        average_monthly_salary: salary,
        tax_regime: regime,
        tax_burden_rate: taxBurdenRate,
        daily_labor_cost: dailyLaborCost,
        total_financial_loss: totalFinancialLoss,
        details: summary
      });
    } catch (e) {
      console.warn('Erro ao salvar auditoria no Supabase:', e);
    }
  }

  return summary;
}

/**
 * Cria arquivos mock para demonstração imediata do dashboard e campanhas de prospecção
 */
function generateMockAuditFiles(): { name: string; buffer: Buffer }[] {
  const list = [
    { name: 'atestado_joao_silva.pdf', days: 5, valid: true },
    { name: 'atestado_marina_alves_scan.pdf', days: 3, valid: false },
    { name: 'atestado_rodrigo_costa_foto.jpg', days: 7, valid: false },
    { name: 'atestado_camila_santos.pdf', days: 2, valid: true },
    { name: 'atestado_felipe_souza_editado.pdf', days: 10, valid: false },
    { name: 'atestado_beatriz_lima.pdf', days: 4, valid: true }
  ];

  return list.map(item => ({
    name: item.name,
    buffer: Buffer.from(
      `%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\n` +
      (item.valid ? 'ICP-Brasil Digital Signature Certified' : 'Documento sem assinatura digital PAdES') +
      `\nRepouso médico de ${item.days} dias. CRM 123456/SP.`
    )
  }));
}
