import { auditGeoDistance } from '../src/lib/services/geo-audit-service';
import { getCompanyPolicy, updateCompanyPolicy } from '../src/lib/services/company-policy-service';
import { auditAttestationConsistency } from '../src/lib/services/consistency-service';

async function testGeoAndPolicy() {
  console.log('================================================================');
  console.log('   TESTE DO ADD-ON GEO-SHIELD & POLÍTICAS PERSONALIZADAS DE RH  ');
  console.log('================================================================\n');

  // TESTE 1: Incompatibilidade Geográfica (Santos x Ribeirão Preto)
  console.log('--- TESTE 1: DISTÂNCIA INCOMPATÍVEL SANTOS x RIBEIRÃO PRETO ---');
  const geoResult1 = auditGeoDistance({
    clinicAddressOrCity: 'Av. Nove de Julho, 1000 - Ribeirão Preto/SP',
    employeeWorkCity: 'Santos/SP',
    distanceThresholdKm: 100
  });

  console.log('Base de Trabalho:', geoResult1.workCity);
  console.log('Local da Clínica:', geoResult1.clinicCity);
  console.log('Distância Estimada:', geoResult1.distanceKm, 'km');
  console.log('Compatível presencialmente?', geoResult1.isCompatible);
  console.log('Alerta Disparado:', geoResult1.alert?.title);
  console.log('Descrição:', geoResult1.alert?.description);

  if (geoResult1.isCompatible) {
    throw new Error('Falha no teste 1: Santos x Ribeirão Preto deveria ser incompatível!');
  }
  console.log('✅ Teste 1 (Geo-Shield Santos x Ribeirão Preto): APROVADO.\n');

  // TESTE 2: Compatibilidade Geográfica (Santos x Praia Grande)
  console.log('--- TESTE 2: DISTÂNCIA COMPATÍVEL SANTOS x PRAIA GRANDE ---');
  const geoResult2 = auditGeoDistance({
    clinicAddressOrCity: 'Av. Brasil, 500 - Praia Grande/SP',
    employeeWorkCity: 'Santos/SP',
    distanceThresholdKm: 100
  });

  console.log('Distância Estimada Santos x Praia Grande:', geoResult2.distanceKm, 'km');
  console.log('Compatível presencialmente?', geoResult2.isCompatible);
  if (!geoResult2.isCompatible) {
    throw new Error('Falha no teste 2: Santos x Praia Grande deveria ser compatível!');
  }
  console.log('✅ Teste 2 (Geo-Shield Baixada Santista): APROVADO.\n');

  // TESTE 3: Telemedicina expressa dispensa deslocamento
  console.log('--- TESTE 3: DISPENSA DE DESLOCAMENTO EM TELEMEDICINA ---');
  const geoResult3 = auditGeoDistance({
    clinicAddressOrCity: 'Ribeirão Preto/SP',
    employeeWorkCity: 'Santos/SP',
    isTelemedicine: true
  });
  console.log('Telemedicina detectada:', geoResult3.telemedicineDetected);
  console.log('Compatível mesmo a 390 km?', geoResult3.isCompatible);
  if (!geoResult3.isCompatible) {
    throw new Error('Falha no teste 3: telemedicina deveria dispensar deslocamento!');
  }
  console.log('✅ Teste 3 (Telemedicina): APROVADO.\n');

  // TESTE 4: Política de RH Personalizada (CCT de 48h vs 72h)
  console.log('--- TESTE 4: CONFIGURAÇÃO DE TOLERÂNCIA DE CCT (48h) ---');
  updateCompanyPolicy({ maxRetroactiveHours: 48, workCity: 'Santos' });
  const policy = getCompanyPolicy();
  console.log('Política Atualizada:', policy.companyName, '| Tolerância:', policy.maxRetroactiveHours, 'horas');

  // Atestado entregue 4 dias depois (96h depois da emissão)
  const audit4 = auditAttestationConsistency({
    emissionDate: '01/09/2026',
    referenceDate: new Date('2026-09-05T12:00:00Z'), // 4 dias depois
    maxRetroactiveDays: Math.round(policy.maxRetroactiveHours / 24) // 2 dias
  });

  const retroactiveAlert = audit4.alerts.find(a => a.code === 'RETROACTIVE_SUBMISSION');
  console.log('Alerta Retroativo disparado?', !!retroactiveAlert);
  console.log('Descrição:', retroactiveAlert?.description);

  if (!retroactiveAlert) {
    throw new Error('Falha no teste 4: deveria alertar entrega fora das 48h da CCT!');
  }
  console.log('✅ Teste 4 (Política de RH CCT): APROVADO.\n');

  console.log('🎉 TODOS OS TESTES DE GEO-SHIELD E POLÍTICAS DE RH PASSARAM COM SUCESSO!');
}

testGeoAndPolicy().catch(err => {
  console.error('ERRO NO TESTE:', err);
  process.exit(1);
});
