/**
 * SUÍTE DE TESTES E SIMULAÇÃO COMPLETA:
 * PLACAR DE LEADS, DEDUPLICAÇÃO, NORMALIZAÇÃO E PRIORIDADES NO WHATSAPP
 */

import { 
  normalizePhone, 
  isSameBrazilianPhone, 
  isDuplicateMessage, 
  isAdminPhone, 
  isRegisteredCompanyPhone, 
  registerOrUpdateLead, 
  generateLeadScoreboard, 
  purgeExpiredLeads,
  resetTestLeads,
  LEAD_GREETING_MESSAGE
} from '../src/lib/services/lead-service';

async function runTests() {
  console.log('======================================================================');
  console.log('🧪 INICIANDO TESTES DO PLACAR DE LEADS E WEBHOOK DO VURIO');
  console.log('======================================================================\n');

  process.env.NODE_ENV = 'test';
  process.env.ADMIN_WHATSAPP = '5513987654321';
  resetTestLeads();

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    totalTests++;
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passedTests++;
    } else {
      console.error(`❌ [FAIL] ${testName} -> ${detail || 'Condição não satisfeita'}`);
    }
  }

  // -------------------------------------------------------------------------
  // TESTE 1: Normalização de Telefones e Comparação com Tolerância (DDI e 9º Dígito)
  // -------------------------------------------------------------------------
  console.log('--- TESTE 1: Normalização e Comparação de Telefones ---');
  const t1_a = normalizePhone('(13) 99999-0002'); // Com máscara
  const t1_b = normalizePhone('+55 13 9999-0002'); // Sem nono dígito com DDI
  const t1_c = normalizePhone('013999990002'); // Com 0 na frente

  assert(isSameBrazilianPhone('(13) 99999-0002', '551399990002'), 'Reconhece mesmo número com e sem o nono dígito');
  assert(isSameBrazilianPhone('+55 13 98765-4321', '13987654321'), 'Reconhece com e sem DDI 55');
  assert(isSameBrazilianPhone('5513987654321', '5513987654321'), 'Reconhece números idênticos');
  assert(!isSameBrazilianPhone('5513987654321', '5511987654321'), 'Diferencia DDDs diferentes (13 vs 11)');

  // -------------------------------------------------------------------------
  // TESTE 2: Prioridade 1 - ADMIN_WHATSAPP
  // -------------------------------------------------------------------------
  console.log('\n--- TESTE 2: Reconhecimento de Admin ---');
  const adminRaw = '13987654321'; // Enviado sem 55
  assert(isAdminPhone(adminRaw), 'Admin reconhecido mesmo se o WhatsApp enviar sem o DDI 55');
  assert(!isAdminPhone('5513999999999'), 'Número não-admin NÃO é reconhecido como admin');

  // -------------------------------------------------------------------------
  // TESTE 3: Prioridade 2 - Cliente Cadastrado (Empresa Existente)
  // -------------------------------------------------------------------------
  console.log('\n--- TESTE 3: Reconhecimento de Cliente Existente ---');
  // Hospital São Lucas cadastrado com '+55 13 99999-0002' em company-service
  const clientMatch = await isRegisteredCompanyPhone('551399990002'); // Sem nono dígito
  assert(clientMatch, 'Cliente existente reconhecido mesmo com formato de telefone diferente (sem 9º dígito)');
  const clientNotMatch = await isRegisteredCompanyPhone('5513991234567');
  assert(!clientNotMatch, 'Lead comum NÃO é classificado como cliente existente');

  // -------------------------------------------------------------------------
  // TESTE 4: Deduplicação de Webhook (Reenvios do provedor)
  // -------------------------------------------------------------------------
  console.log('\n--- TESTE 4: Deduplicação de Mensagens de Webhook ---');
  const messageId = 'wamid_TEST_123456789';
  const firstCheck = await isDuplicateMessage(messageId, '5513991112222');
  const secondCheck = await isDuplicateMessage(messageId, '5513991112222');
  assert(!firstCheck, 'Primeira chegada da mensagem NÃO é duplicada');
  assert(secondCheck, 'Segunda chegada com o mesmo messageId É detectada como duplicada (ignora reenvio)');

  // -------------------------------------------------------------------------
  // TESTE 5: Prioridade 3 - Lead Novo (1ª Mensagem e Resposta Automática)
  // -------------------------------------------------------------------------
  console.log('\n--- TESTE 5: Registro de Lead Novo ---');
  const leadPhone = '5513991113333';
  const resLead1 = await registerOrUpdateLead(leadPhone, 'Quero saber mais sobre o Vurio');
  assert(resLead1.isNewLead === true, 'Lead marcado como novo');
  assert(resLead1.messageCount === 1, 'Contagem inicial de mensagens é 1');
  assert(resLead1.shouldSendAutoReply === true, 'Dispara resposta automática do Marcos na 1ª mensagem');

  // -------------------------------------------------------------------------
  // TESTE 6: Lead com [ref:xxx]
  // -------------------------------------------------------------------------
  console.log('\n--- TESTE 6: Rastreio de Campanha com [ref:v1] ---');
  const leadRefPhone = '5513991114444';
  const resLeadRef = await registerOrUpdateLead(leadRefPhone, 'Quero saber mais sobre o Vurio [ref:video_anuncio_1]');
  assert(resLeadRef.isNewLead === true, 'Lead com ref registrado');
  assert(resLeadRef.shouldSendAutoReply === true, 'Lead com ref recebe resposta automática');

  // -------------------------------------------------------------------------
  // TESTE 7: Lead que Responde à Pergunta (2ª Mensagem)
  // -------------------------------------------------------------------------
  console.log('\n--- TESTE 7: Lead Responde à Pergunta (Não duplicar auto-reply) ---');
  const resLead2 = await registerOrUpdateLead(leadPhone, 'Temos cerca de 120 colaboradores');
  assert(resLead2.isNewLead === false, 'Reconhece como lead existente');
  assert(resLead2.messageCount === 2, 'Contador de mensagens incrementado para 2');
  assert(resLead2.shouldSendAutoReply === false, 'NÃO repete saudação automática (sem loop)');

  // -------------------------------------------------------------------------
  // TESTE 8: Lead com Opt-out ('sair' ou 'parar')
  // -------------------------------------------------------------------------
  console.log('\n--- TESTE 8: Opt-Out do Lead ---');
  const optOutPhone = '5513991115555';
  await registerOrUpdateLead(optOutPhone, 'Olá [ref:v2]');
  const resOptOut = await registerOrUpdateLead(optOutPhone, 'parar');
  assert(resOptOut.isOptOut === true, 'Lead marcado com opt_out = true');
  assert(resOptOut.shouldSendAutoReply === false, 'Nenhuma mensagem enviada após opt-out');

  // -------------------------------------------------------------------------
  // TESTE 9: Placar do Vurio (Comando do Admin)
  // -------------------------------------------------------------------------
  console.log('\n--- TESTE 9: Geração do Placar de Leads (Admin) ---');
  const scoreboardText = await generateLeadScoreboard('score');
  console.log('Placar retornado:\n' + scoreboardText);
  assert(scoreboardText.includes('PLACAR VURIO'), 'Contém cabeçalho do Placar');
  assert(scoreboardText.includes('Leads únicos: 2'), 'Conta 2 leads válidos (excluído opt-out)');
  assert(scoreboardText.includes('Responderam à pergunta: 1'), 'Conta 1 lead que respondeu (messageCount >= 2)');

  const scoreboardRefText = await generateLeadScoreboard('score ref');
  console.log('\nPlacar Ref:\n' + scoreboardRefText);
  assert(scoreboardRefText.includes('Detalhamento por REF:'), 'Contém detalhamento por REF');
  assert(scoreboardRefText.includes('[video_anuncio_1]'), 'Identifica tag ref [video_anuncio_1]');

  // -------------------------------------------------------------------------
  // TESTE 10: Número Estranho Pedindo 'score' (Tratado como Lead, Não Recebe Placar)
  // -------------------------------------------------------------------------
  console.log('\n--- TESTE 10: Estranho Enviando Score ---');
  const strangerPhone = '5511999998888';
  assert(!isAdminPhone(strangerPhone), 'Estranho não é admin');
  // Se o estranho mandar 'score', ele é registrado como lead
  const strangerLead = await registerOrUpdateLead(strangerPhone, 'score');
  assert(strangerLead.isNewLead === true, 'Estranho vira lead comum e não recebe placar');

  // -------------------------------------------------------------------------
  // TESTE 11: Placar Sem Banco Conectado Fora de Teste Local (Requisito 3)
  // -------------------------------------------------------------------------
  console.log('\n--- TESTE 11: Comportamento sem Banco Fora de Teste Local ---');
  process.env.NODE_ENV = 'production'; // Simula preview/produção sem mock
  const fallbackScore = await generateLeadScoreboard('score');
  assert(fallbackScore === 'Placar indisponível: banco não conectado', 'Retorna explicitamente "Placar indisponível: banco não conectado"');
  process.env.NODE_ENV = 'test'; // Retorna para teste

  // -------------------------------------------------------------------------
  // TESTE 12: Rotina de Expurgo LGPD (purgeExpiredLeads)
  // -------------------------------------------------------------------------
  console.log('\n--- TESTE 12: Rotina Real de Expurgo LGPD ---');
  const purgeResult = await purgeExpiredLeads(90);
  assert(purgeResult.success === true, 'Rotina de expurgo executada com sucesso');

  console.log('\n======================================================================');
  console.log(`📊 RESULTADO FINAL: ${passedTests}/${totalTests} TESTES APROVADOS!`);
  console.log('======================================================================\n');

  if (passedTests === totalTests) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Erro fatal nos testes:', err);
  process.exit(1);
});
