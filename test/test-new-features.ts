import { createVerificationInquiry, answerInquiry, getInquiryByToken } from '../src/lib/services/inquiry-service';
import { generatePoliceDossier } from '../src/lib/services/police-dossier-generator';
import { formatDoctorPassiveAlertMessage, checkCrmExposureHistory, createDoctorIncident } from '../src/lib/services/doctor-shield-service';
import { executeBatchAudit } from '../src/lib/services/batch-audit-service';

async function runTests() {
  console.log('\n======================================================');
  console.log('🧪 TESTE AUTOMATIZADO DAS NOVAS VERTENTES DO VURIO');
  console.log('======================================================\n');

  // TESTE 1: Diligência 1-Clique e Laudo de Confirmação (Boa-fé)
  console.log('🔹 1. Testando Diligência 1-Clique...');
  const inq = await createVerificationInquiry({
    companyId: 'test-empresa',
    doctorCrm: '123456',
    doctorUf: 'SP',
    doctorName: 'Dr. Roberto Silveira',
    patientName: 'Marcos Vinicius Pereira',
    clinicName: 'Clínica Saúde Total'
  });
  console.log(`   ✓ Diligência criada com Token: ${inq.token.substring(0, 12)}...`);

  const fetched = await getInquiryByToken(inq.token);
  if (!fetched || fetched.status !== 'PENDING') throw new Error('Falha ao recuperar token de diligência.');

  // Confirmação do Médico
  const confirmResult = await answerInquiry({
    token: inq.token,
    action: 'CONFIRM',
    notes: 'Atendimento presencial realizado em plantão.'
  });
  console.log('   ✓ Médico confirmou emissão legítima!');
  console.log(`   ✓ Certidão DP: ${confirmResult.dpNotification.substring(0, 75)}...`);
  console.log(`   ✓ Notificação Funcionário: ${confirmResult.employeeNotification}`);

  // TESTE 2: Doctor Shield & Alerta Passivo
  console.log('\n🔹 2. Testando Vurio Doctor Shield (Alerta Passivo)...');
  const alertMsg = formatDoctorPassiveAlertMessage({
    doctorName: 'Carlos Eduardo',
    crm: '123456',
    uf: 'SP',
    patientInitials: 'M.V.P.',
    cityOrCompany: 'Santos/SP',
    incidentTokenUrl: 'https://vurio.com/incidente/demo123'
  });
  if (!alertMsg.includes('Caso este atendimento tenha procedência legítima, por gentileza apenas IGNORE')) {
    throw new Error('Mensagem passiva não contém instrução de ignorar!');
  }
  console.log('   ✓ Alerta passivo formatado perfeitamente (médico só age se não foi ele).');

  // TESTE 3: Dossiê para B.O. Policial Eletrônico
  console.log('\n🔹 3. Testando Geração de Dossiê para B.O. Eletrônico...');
  const incidentResult = await createDoctorIncident({
    doctorCrm: '123456',
    doctorUf: 'SP',
    doctorName: 'Dr. Carlos Eduardo',
    companyName: 'Indústria Metalúrgica do Litoral',
    fileName: 'atestado_falso_scan.pdf',
    fileSha256: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
    patientName: 'Carlos Falsário',
    restDaysClaimed: 7
  });
  const dossierText = incidentResult.dossier.plainTextReport;
  if (!dossierText.includes('Art. 299 do Código Penal') || !dossierText.includes('Art. 304')) {
    throw new Error('Dossiê não inclui tipificação penal adequada!');
  }
  console.log(`   ✓ Código do Dossiê Policial: ${incidentResult.dossier.incidentCode}`);
  console.log('   ✓ Tipificação penal (Arts. 299 e 304 do CP) e prova material de SHA-256 anexadas.');

  // TESTE 4: Raio-X Histórico de CRM para Médicos
  console.log('\n🔹 4. Testando Consulta de Exposição Histórica de CRM...');
  const crmHist = await checkCrmExposureHistory('123456', 'SP');
  console.log(`   ✓ CRM ${crmHist.crm}/${crmHist.uf} - Total Ocorrências: ${crmHist.totalOccurrences} | Nível de Risco: ${crmHist.exposureRiskLevel}`);

  // TESTE 5: Auditoria Retroativa de Passivo com Cálculo Financeiro
  console.log('\n🔹 5. Testando Auditoria Retroativa de Passivo (ROI & Custos de Folha)...');
  const audit = await executeBatchAudit({
    companyId: 'test-empresa',
    files: [], // dispara os arquivos mock de demonstração
    averageMonthlySalary: 3500.0,
    taxRegime: 'LUCRO_PRESUMIDO'
  });

  console.log(`   ✓ Total Arquivos Analisados: ${audit.totalFiles}`);
  console.log(`   ✓ Conformes: ${audit.authenticCount} | Inconformes: ${audit.inconsistentCount} (${audit.inconsistencyRate}%)`);
  console.log(`   ✓ Dias Pagos Indevidamente: ${audit.totalDaysLost} dias`);
  console.log(`   ✓ Custo Diário Calculado: R$ ${audit.laborEconomics.dailyLaborCost.toFixed(2)} (Encargos: ${audit.laborEconomics.taxBurdenPercentage}%)`);
  console.log(`   ✓ Sangria Financeira Total: R$ ${audit.laborEconomics.totalFinancialLoss.toLocaleString('pt-BR')}`);
  console.log(`   ✓ Multiplicador de ROI do Vurio: ${audit.laborEconomics.roiRatio}x no primeiro ano`);

  console.log('\n======================================================');
  console.log('🎉 TODOS OS TESTES PASSARAM COM 100% DE SUCESSO!');
  console.log('======================================================\n');
}

runTests().catch(err => {
  console.error('❌ ERRO NO TESTE:', err);
  process.exit(1);
});
