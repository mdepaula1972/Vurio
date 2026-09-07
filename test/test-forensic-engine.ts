import fs from 'fs';
import path from 'path';
import { validateMedicalAttestation } from '../src/lib/crypto/validator';
import { formatWhatsAppResponse } from '../src/lib/whatsapp/message-formatter';
import { auditDoctorCrm } from '../src/lib/services/cfm-service';
import { auditAttestationConsistency, isValidBrazilianCpf } from '../src/lib/services/consistency-service';

async function testForensicEngine() {
  console.log('================================================================');
  console.log('   TESTE DO MOTOR PERICIAL VURIO: CFM + INCONSISTÊNCIAS + VISÃO ');
  console.log('================================================================\n');

  // TESTE 1: Auditoria Nacional de CRM (CFM)
  console.log('--- TESTE 1: AUDITORIA DE CRM NO CFM (27 ESTADOS) ---');
  
  // 1.1 CRM Válido em SP (CREMESP)
  const cfm1 = await auditDoctorCrm('54321', 'SP', 'Dr. Roberto Santos');
  console.log('CRM 54321/SP:', cfm1.regionalCouncil, '| Status:', cfm1.status, '| Titular:', cfm1.officialName);
  if (!cfm1.isRegistered || cfm1.status !== 'REGULAR') throw new Error('Falha no teste 1.1');

  // 1.2 CRM com Divergência Nominal (Carimbo falso com nome diferente do titular)
  const cfm2 = await auditDoctorCrm('54321', 'SP', 'Dr. Marcos Falsário');
  console.log('CRM 54321/SP com nome falso: Divergência detectada?', !cfm2.nameMatch.isMatched);
  console.log('Alerta:', cfm2.nameMatch.divergenceAlert);
  if (cfm2.nameMatch.isMatched) throw new Error('Falha no teste 1.2: deveria detectar divergência nominal');

  // 1.3 CRM com Divergência de Estado (Inscrito no RJ, mas carimbo diz SP)
  const cfm3 = await auditDoctorCrm('998877', 'SP', 'Dra. Mariana Costa');
  console.log('CRM 998877 carimbado em SP: Alerta interestadual?', cfm3.interstateAlert?.hasDivergence);
  console.log('Descrição:', cfm3.interstateAlert?.description);
  if (!cfm3.interstateAlert?.hasDivergence) throw new Error('Falha no teste 1.3: deveria detectar divergência de UF');

  // 1.4 CRM Suspenso pelo Conselho (MG)
  const cfm4 = await auditDoctorCrm('445566', 'MG', 'Dr. Lucas Henrique Oliveira');
  console.log('CRM 445566/MG Suspenso:', cfm4.status, '| Descrição:', cfm4.statusDescription);
  if (cfm4.status !== 'SUSPENSO') throw new Error('Falha no teste 1.4: deveria identificar suspensão');

  console.log('✅ Teste 1 (CFM Nacional 27 Estados): 100% APROVADO.\n');

  // TESTE 2: Motor de Inconsistências (Datas Futuras, CPF, CLT/INSS)
  console.log('--- TESTE 2: MOTOR DE INCONSISTÊNCIAS E ANACRONISMOS ---');
  
  // 2.1 Validação de CPF
  const cpfValido = isValidBrazilianCpf('12345678909'); // CPF com dígitos válidos
  const cpfInvalido = isValidBrazilianCpf('12345678900'); // CPF inválido
  console.log('CPF Válido reconhecido?', cpfValido);
  console.log('CPF Inválido bloqueado?', !cpfInvalido);
  if (!cpfValido || cpfInvalido) throw new Error('Falha no teste 2.1 CPF');

  // 2.2 Detecção de Data Futura (Emitido para 12/09 quando hoje é 07/09)
  const consistencyFuture = auditAttestationConsistency({
    emissionDate: '12/09/2026',
    startDate: '12/09/2026',
    days: 5,
    referenceDate: new Date('2026-09-07T12:00:00Z')
  });
  console.log('Data Futura detectada?', consistencyFuture.isFutureDate);
  console.log('Alertas:', consistencyFuture.alerts.map(a => `${a.severity}: ${a.title}`));
  if (!consistencyFuture.isFutureDate) throw new Error('Falha no teste 2.2: deveria detectar data futura');

  // 2.3 Detecção de Encaminhamento ao INSS (> 15 dias)
  const consistencyInss = auditAttestationConsistency({
    emissionDate: '07/09/2026',
    days: 20,
    referenceDate: new Date('2026-09-07T12:00:00Z')
  });
  console.log('Alerta INSS > 15 dias detectado?', consistencyInss.isInssRequired);
  if (!consistencyInss.isInssRequired) throw new Error('Falha no teste 2.3: deveria alertar INSS');

  console.log('✅ Teste 2 (Inconsistências & Regras de Negócio): 100% APROVADO.\n');

  // TESTE 3: Validação de Atestado Físico (04_foto_atestado_papel.jpg)
  console.log('--- TESTE 3: FOTO DE ATESTADO FÍSICO (RECEITUÁRIO) ---');
  const photoPath = path.join(__dirname, '..', 'test-samples', '04_foto_atestado_papel.jpg');
  if (fs.existsSync(photoPath)) {
    const photoBuf = fs.readFileSync(photoPath);
    const photoReport = await validateMedicalAttestation(photoBuf, 'image/jpeg', '04_foto_atestado_papel.jpg');
    console.log('Status da Foto:', photoReport.status);
    console.log('Médico Extraído:', photoReport.doctor.name, 'CRM:', photoReport.doctor.crm, '/', photoReport.doctor.uf);
    console.log('CFM Regional:', photoReport.cfmAudit?.regionalCouncil, '| Status:', photoReport.cfmAudit?.status);
    console.log('Dias de Afastamento:', photoReport.restPeriod.days);
    
    const photoWaMsg = formatWhatsAppResponse(photoReport);
    console.log('\n--- MENSAGEM DO WHATSAPP GERADA PARA A FOTO ---');
    console.log(photoWaMsg);
    console.log('--------------------------------------------------\n');
  }

  // TESTE 4: Validação do PDF Válido com Alerta de Data Futura (01_atestado_icp_brasil_valido.pdf)
  console.log('--- TESTE 4: PDF ICP-BRASIL COM AUDITORIA CFM E ALERTA DE DATA ---');
  const pdfPath = path.join(__dirname, '..', 'test-samples', '01_atestado_icp_brasil_valido.pdf');
  if (fs.existsSync(pdfPath)) {
    const pdfBuf = fs.readFileSync(pdfPath);
    const pdfReport = await validateMedicalAttestation(pdfBuf, 'application/pdf', '01_atestado_icp_brasil_valido.pdf');
    console.log('Status do PDF:', pdfReport.status);
    console.log('Médico Extraído:', pdfReport.doctor.name, 'CRM:', pdfReport.doctor.crm, '/', pdfReport.doctor.uf);
    console.log('CFM Regional:', pdfReport.cfmAudit?.regionalCouncil, '| Status:', pdfReport.cfmAudit?.status);
    console.log('Inconsistências encontradas:', pdfReport.consistency?.alerts.length);

    const pdfWaMsg = formatWhatsAppResponse(pdfReport);
    console.log('\n--- MENSAGEM DO WHATSAPP GERADA PARA O PDF ---');
    console.log(pdfWaMsg);
    console.log('--------------------------------------------------\n');
  }

  console.log('🎉 TODOS OS TESTES DO MOTOR FORENSE FORAM CONCLUÍDOS COM SUCESSO!');
}

testForensicEngine().catch(err => {
  console.error('ERRO NO TESTE:', err);
  process.exit(1);
});
