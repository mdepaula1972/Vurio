import fs from 'fs';
import path from 'path';

// Carregar .env.local
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const [k, ...v] = line.split('=');
    if (k && v.length) process.env[k.trim()] = v.join('=').trim();
  }
}

import { validateMedicalAttestation, AttestationValidationReport } from '../src/lib/crypto/validator';

interface BenchmarkManifestItem {
  id: string;
  category: string;
  filename: string;
  expectedStatus: string;
  description: string;
}

interface TestResult {
  id: string;
  category: string;
  filename: string;
  expectedStatus: string;
  obtainedStatus: string;
  isPassed: boolean;
  timeMs: number;
  doctorName?: string | null;
  crm?: string | null;
  alerts?: string[];
}

async function runBenchmark() {
  console.log('================================================================');
  console.log('🚀 INICIANDO AUDITORIA DO BENCHMARK FORENSE VURIO (100 AMOSTRAS)');
  console.log('================================================================\n');

  const datasetDir = path.join(process.cwd(), 'benchmark-dataset');
  const manifestPath = path.join(datasetDir, 'manifest.json');

  if (!fs.existsSync(manifestPath)) {
    console.error('Manifesto não encontrado. Execute generate-benchmark-dataset.ts primeiro.');
    return;
  }

  const manifest: BenchmarkManifestItem[] = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

  const results: TestResult[] = [];
  const registeredHashes: string[] = [];
  const startTimeTotal = Date.now();

  // Processa arquivo por arquivo
  for (let i = 0; i < manifest.length; i++) {
    const item = manifest[i];
    const filePath = path.join(datasetDir, item.filename);
    const fileBuffer = fs.readFileSync(filePath);
    const mimeType = item.filename.endsWith('.jpg') ? 'image/jpeg' : 'application/pdf';

    // Se for foto (chamada externa ao Gemini), aguarda 2.5s para respeitar a cota RPM da API gratuita
    if (item.category.includes('Foto') && i > 50) {
      await new Promise(res => setTimeout(res, 2500));
    }

    const tStart = Date.now();
    // Para a categoria de duplicidade, enviamos os hashes registrados anteriormente
    const hashesToCheck = item.category.includes('Duplicidade') ? registeredHashes : [];
    const report = await validateMedicalAttestation(fileBuffer, mimeType, item.filename, hashesToCheck);
    const tElapsed = Date.now() - tStart;

    // Registra hash se for da Categoria 1 (para ser detectado na Categoria 6)
    if (item.category.includes('ICP-Brasil')) {
      registeredHashes.push(report.fileSha256);
    }

    let isPassed = false;
    const alerts: string[] = [];

    // Checagem de sucesso por categoria
    if (item.category.includes('Inconsistência')) {
      // Deve ter detectado inconsistência no CFM ou data futura
      const hasCfmAlert = report.cfmAudit && (report.cfmAudit.status === 'SUSPENSO' || report.cfmAudit.status === 'CANCELADO');
      const hasConsistencyAlert = report.consistency && report.consistency.hasInconsistencies;
      isPassed = Boolean(hasCfmAlert || hasConsistencyAlert);
      if (hasCfmAlert) alerts.push(`CFM: ${report.cfmAudit?.status}`);
      if (hasConsistencyAlert) alerts.push(...(report.consistency?.alerts.map(a => a.title) || []));
    } else {
      isPassed = report.status === item.expectedStatus;
    }

    results.push({
      id: item.id,
      category: item.category,
      filename: item.filename,
      expectedStatus: item.expectedStatus,
      obtainedStatus: report.status,
      isPassed,
      timeMs: tElapsed,
      doctorName: report.doctor.name,
      crm: report.doctor.crm ? `${report.doctor.crm}/${report.doctor.uf}` : null,
      alerts
    });

    const statusIcon = isPassed ? '✅' : '❌';
    console.log(
      `[${(i + 1).toString().padStart(3, '0')}/100] ${statusIcon} ${item.id} | ${item.category.padEnd(25, ' ')} | Esperado: ${item.expectedStatus.padEnd(18, ' ')} | Obtido: ${report.status.padEnd(18, ' ')} | ${tElapsed}ms`
    );
  }

  // Também roda o Contrato Social da Jucesp anexado pelo usuário
  const jucespPath = path.join(process.cwd(), 'test-samples', 'Contrato Social.pdf');
  if (fs.existsSync(jucespPath)) {
    const buf = fs.readFileSync(jucespPath);
    const tStart = Date.now();
    const rep = await validateMedicalAttestation(buf, 'application/pdf', 'Contrato Social.pdf', []);
    const tElapsed = Date.now() - tStart;
    console.log(`\n📄 [TESTE REAL JUCESP] Status: ${rep.status} | CRM extraído: ${rep.doctor.crm || 'NENHUM (Correto!)'} | Tempo: ${tElapsed}ms`);
  }

  const totalElapsed = Date.now() - startTimeTotal;
  const passedCount = results.filter(r => r.isPassed).length;
  const accuracy = ((passedCount / results.length) * 100).toFixed(1);

  console.log('\n================================================================');
  console.log('📊 CONSOLIDAÇÃO DO BENCHMARK FORENSE:');
  console.log('================================================================');
  console.log(`• Total de Amostras Testadas: ${results.length}`);
  console.log(`• Aprovados com Sucesso:     ${passedCount}/${results.length}`);
  console.log(`• Taxa de Acurácia Global:   ${accuracy}%`);
  console.log(`• Tempo Total de Execução:   ${(totalElapsed / 1000).toFixed(2)}s`);
  console.log(`• Tempo Médio por Documento: ${Math.round(totalElapsed / results.length)}ms`);

  // Breakdown por categoria
  console.log('\n--- PERFORMANCE POR CATEGORIA FORENSE ---');
  const categories = Array.from(new Set(results.map(r => r.category)));
  for (const cat of categories) {
    const inCat = results.filter(r => r.category === cat);
    const passedInCat = inCat.filter(r => r.isPassed).length;
    const catAcc = ((passedInCat / inCat.length) * 100).toFixed(0);
    const avgTime = Math.round(inCat.reduce((acc, c) => acc + c.timeMs, 0) / inCat.length);
    console.log(`• ${cat.padEnd(28, ' ')}: ${passedInCat}/${inCat.length} (${catAcc}%) | Média: ${avgTime}ms`);
  }
}

runBenchmark().catch(console.error);
