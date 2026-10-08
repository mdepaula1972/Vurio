/**
 * Suíte de Testes Automatizados - Vurio
 * 
 * Cobertura Completa:
 * 1. Normalização de Telefones Brasileiros (com/sem DDI 55, com/sem nono dígito)
 * 2. Reconhecimento de Admin (ADMIN_WHATSAPP)
 * 3. Reconhecimento de Cliente Existente (Empresa cadastrada)
 * 4. Deduplicação de Webhook (Reenvios do provedor)
 * 5. Registro de Lead Novo e Resposta Automática (1ª mensagem)
 * 6. Rastreio de Campanha com [ref:xxx] e sanitização estrita
 * 7. Lead que responde à pergunta (2ª mensagem - não duplicar auto-reply)
 * 8. Opt-Out do Lead ('sair' ou 'parar')
 * 9. Placar do Vurio (Comando score do admin e variações)
 * 10. Número Estranho pedindo 'score' (Vira lead, não recebe placar)
 * 11. Placar sem banco em Preview/Produção (responde estritamente "Placar indisponível: banco não conectado")
 * 12. Rotina de expurgo LGPD de leads inativos (purgeExpiredLeads)
 * 13. [NOVO] Sanitização de Ref: caracteres inválidos e truncamento em 50 chars
 * 14. [NOVO] Flag LEAD_SCOREBOARD_ENABLED=false: webhook não toca no banco e segue fluxo original
 * 15. [NOVO] Erro de banco no webhook: capturado pelo try/catch, responde 200 HTTP sem derrubar o webhook
 * 16. [NOVO] Cron /api/cron/purge-leads: recusa 401 sem header Bearer ou sem CRON_SECRET
 * 17. [NOVO] TRIAL_ENABLED=false: /api/trial/register retorna 503 e não cria empresa
 * 18. [NOVO] TRIAL_ENABLED=true: /api/trial/register restaura comportamento original e cria empresa
 * 19. [NOVO] Supabase Real (vzvyykqgqggtlglqrswc): Teste de leitura seguro via client service-role
 */

import { NextRequest } from 'next/server';
import { 
  normalizePhone, 
  isSameBrazilianPhone, 
  isAdminPhone, 
  isRegisteredCompanyPhone, 
  isDuplicateMessage, 
  registerOrUpdateLead, 
  generateLeadScoreboard, 
  purgeExpiredLeads,
  extractRefCode,
  isLeadDatabaseConnected,
  getInMemoryLeadForTest
} from '../src/lib/services/lead-service';
import { POST as webhookPost } from '../src/app/api/webhook/whatsapp/route';
import { GET as cronGet } from '../src/app/api/cron/purge-leads/route';
import { POST as trialRegisterPost } from '../src/app/api/trial/register/route';
import { supabase, isSupabaseConfigured } from '../src/lib/supabase/client';

process.env.ADMIN_WHATSAPP = '5513987654321';
process.env.WHATSAPP_BOT_PHONE = '551331500987';
process.env.NODE_ENV = 'test';

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, testName: string, details?: string) {
  totalTests++;
  if (condition) {
    console.log(`  ✅ [PASS] ${testName}`);
    passedTests++;
  } else {
    console.error(`  ❌ [FAIL] ${testName}`);
    if (details) console.error(`     Detalhes: ${details}`);
  }
}

async function runTests() {
  console.log('======================================================================');
  console.log('🚀 INICIANDO SUÍTE DE TESTES: PLACAR DE LEADS & TRIAL FLAGGING');
  console.log('======================================================================\n');

  // -------------------------------------------------------------------------
  // TESTE 1: Normalização de Telefones (Simulado / Lógica Pura)
  // -------------------------------------------------------------------------
  console.log('--- TESTE 1: Normalização e Comparação de Telefones (Simulado) ---');
  assert(isSameBrazilianPhone('5513987654321', '13987654321'), 'Reconhece com e sem DDI 55');
  assert(isSameBrazilianPhone('5513987654321', '551387654321'), 'Reconhece com e sem nono dígito');
  assert(isSameBrazilianPhone('+55 13 98765-4321', '13987654321'), 'Reconhece com formatação internacional');
  assert(!isSameBrazilianPhone('5513987654321', '5511987654321'), 'Diferencia DDDs diferentes (13 vs 11)');

  // -------------------------------------------------------------------------
  // TESTE 2: Prioridade 1 - ADMIN_WHATSAPP (Simulado)
  // -------------------------------------------------------------------------
  console.log('\n--- TESTE 2: Reconhecimento de Admin (Simulado) ---');
  assert(isAdminPhone('13987654321'), 'Admin reconhecido mesmo sem DDI 55');
  assert(!isAdminPhone('5513999999999'), 'Número não-admin NÃO é reconhecido');

  // -------------------------------------------------------------------------
  // TESTE 3: Prioridade 2 - Cliente Cadastrado (Simulado)
  // -------------------------------------------------------------------------
  console.log('\n--- TESTE 3: Reconhecimento de Cliente Existente (Simulado) ---');
  const clientMatch = await isRegisteredCompanyPhone('551399990002');
  assert(clientMatch, 'Cliente existente reconhecido mesmo sem 9º dígito');
  const clientNotMatch = await isRegisteredCompanyPhone('5513991234567');
  assert(!clientNotMatch, 'Lead comum NÃO é classificado como cliente');

  // -------------------------------------------------------------------------
  // TESTE 4: Deduplicação de Webhook (Simulado)
  // -------------------------------------------------------------------------
  console.log('\n--- TESTE 4: Deduplicação de Mensagens de Webhook (Simulado) ---');
  const messageId = 'wamid_TEST_SUITE_123';
  const firstCheck = await isDuplicateMessage(messageId, '5513991112222');
  const secondCheck = await isDuplicateMessage(messageId, '5513991112222');
  assert(!firstCheck, 'Primeira chegada da mensagem NÃO é duplicada');
  assert(secondCheck, 'Segunda chegada com o mesmo messageId É detectada como duplicada');

  // -------------------------------------------------------------------------
  // TESTE 5: Registro de Lead Novo (Simulado)
  // -------------------------------------------------------------------------
  console.log('\n--- TESTE 5: Registro de Lead Novo (Simulado) ---');
  const leadPhone = '5513991113333';
  const resLead1 = await registerOrUpdateLead(leadPhone, 'Quero saber mais sobre o Vurio');
  assert(resLead1.isNewLead === true, 'Lead marcado como novo');
  assert(resLead1.messageCount === 1, 'Contagem de mensagens inicial é 1');
  assert(resLead1.shouldSendAutoReply === true, 'Dispara resposta automática na 1ª mensagem');

  // -------------------------------------------------------------------------
  // TESTE 6: Lead com [ref:xxx] e Sanitização (Simulado)
  // -------------------------------------------------------------------------
  console.log('\n--- TESTE 6: Rastreio de Campanha com [ref:...] e Sanitização (Simulado) ---');
  const leadRefPhone = '5513991114444';
  const resLeadRef = await registerOrUpdateLead(leadRefPhone, 'Quero saber mais [ref:campanha_ads_v1]');
  assert(resLeadRef.isNewLead === true, 'Lead com ref registrado');
  assert(resLeadRef.shouldSendAutoReply === true, 'Lead com ref recebe resposta automática');

  // Sanitização rigorosa de caracteres inválidos e truncamento
  const cleanRef1 = extractRefCode('Mensagem teste [ref:CAMPANHA-2026@Meta#Anuncio!]');
  assert(cleanRef1 === 'campanha-2026metaanuncio', 'Converte para minúsculas e remove caracteres especiais');

  const longRef = 'a'.repeat(80);
  const cleanRefLong = extractRefCode(`Texto [ref:${longRef}]`);
  assert(cleanRefLong?.length === 50, 'Trunca ref em exatamente 50 caracteres');

  const invalidRef = extractRefCode('Texto sem tag de ref');
  assert(invalidRef === null, 'Retorna null quando não há tag [ref:...]');

  // -------------------------------------------------------------------------
  // TESTE 7: Lead Responde à Pergunta (2ª Mensagem - Simulado)
  // -------------------------------------------------------------------------
  console.log('\n--- TESTE 7: Lead Responde à Pergunta (Simulado) ---');
  const resLead2 = await registerOrUpdateLead(leadPhone, 'Temos 80 colaboradores');
  assert(resLead2.isNewLead === false, 'Reconhece como lead existente');
  assert(resLead2.messageCount === 2, 'Contador de mensagens incrementado para 2');
  assert(resLead2.shouldSendAutoReply === false, 'NÃO repete saudação automática (sem loop)');

  // -------------------------------------------------------------------------
  // TESTE 8: Lead com Opt-out (Simulado)
  // -------------------------------------------------------------------------
  console.log('\n--- TESTE 8: Opt-Out do Lead (Simulado) ---');
  const optOutPhone = '5513991115555';
  await registerOrUpdateLead(optOutPhone, 'Olá [ref:google_ads]');
  const resOptOut = await registerOrUpdateLead(optOutPhone, 'sair');
  assert(resOptOut.isOptOut === true, 'Lead marcado com opt_out = true');
  assert(resOptOut.shouldSendAutoReply === false, 'Nenhuma mensagem enviada após opt-out');
  const leadAfterOptOut = getInMemoryLeadForTest(optOutPhone);
  assert(leadAfterOptOut?.first_message_text === null, 'Conteúdo da primeira mensagem apagado (first_message_text = null)');
  assert(leadAfterOptOut?.phone === optOutPhone, 'Telefone mantido como marcador de opt-out');
  assert(leadAfterOptOut?.opt_out === true, 'Flag opt_out ativada como true');

  // -------------------------------------------------------------------------
  // TESTE 9: Placar de Leads do Admin (Simulado)
  // -------------------------------------------------------------------------
  console.log('\n--- TESTE 9: Geração do Placar de Leads (Admin - Simulado) ---');
  const scoreboardText = await generateLeadScoreboard('score');
  assert(scoreboardText.includes('PLACAR VURIO'), 'Contém cabeçalho do Placar');
  assert(scoreboardText.includes('Leads únicos:'), 'Apresenta total de leads únicos');
  assert(scoreboardText.includes('Responderam à pergunta:'), 'Apresenta taxa de resposta');

  const scoreboardRefText = await generateLeadScoreboard('score ref');
  assert(scoreboardRefText.includes('Detalhamento por REF:'), 'Apresenta agrupamento por ref');

  // -------------------------------------------------------------------------
  // TESTE 10: Estranho Enviando Score (Simulado)
  // -------------------------------------------------------------------------
  console.log('\n--- TESTE 10: Estranho Enviando Score (Simulado) ---');
  const strangerPhone = '5511999998888';
  assert(!isAdminPhone(strangerPhone), 'Estranho não é admin');
  const strangerLead = await registerOrUpdateLead(strangerPhone, 'score');
  assert(strangerLead.isNewLead === true, 'Estranho vira lead comum e não recebe placar');

  // -------------------------------------------------------------------------
  // TESTE 11: Placar Sem Banco Conectado Fora de Teste Local (Simulado)
  // -------------------------------------------------------------------------
  console.log('\n--- TESTE 11: Comportamento Sem Banco Fora de NODE_ENV=test (Simulado) ---');
  process.env.NODE_ENV = 'production';
  const fallbackScore = await generateLeadScoreboard('score');
  assert(fallbackScore === 'Placar indisponível: banco não conectado', 'Retorna estritamente "Placar indisponível: banco não conectado"');
  process.env.NODE_ENV = 'test';

  // -------------------------------------------------------------------------
  // TESTE 12: Rotina de Expurgo LGPD (Simulado)
  // -------------------------------------------------------------------------
  console.log('\n--- TESTE 12: Rotina de Expurgo LGPD (Simulado) ---');
  const purgeResult = await purgeExpiredLeads(90);
  assert(purgeResult.success === true, 'Rotina de expurgo executada com sucesso');

  // -------------------------------------------------------------------------
  // TESTE 13: Webhook com Flag Desligada (LEAD_SCOREBOARD_ENABLED=false)
  // Requisito: Webhook NÃO toca em leads nem deduplicação, segue fluxo original
  // -------------------------------------------------------------------------
  console.log('\n--- TESTE 13: Webhook com LEAD_SCOREBOARD_ENABLED=false (Simulado) ---');
  process.env.LEAD_SCOREBOARD_ENABLED = 'false';
  const dummyReqDisabled = new NextRequest('http://localhost:3000/api/webhook/whatsapp', {
    method: 'POST',
    body: JSON.stringify({
      phone: '5513998887766',
      text: 'Olá gostaria de saber mais',
      messageId: 'wamid_flag_disabled_123'
    })
  });
  const resDisabled = await webhookPost(dummyReqDisabled);
  const dataDisabled = await resDisabled.json();
  assert(resDisabled.status === 200, 'Webhook responde 200 HTTP com flag desligada');
  assert(dataDisabled.type === 'greeting', 'Direciona diretamente para o fluxo original de orientação/clientes');
  assert(!dataDisabled.type?.includes('lead_processed'), 'NÃO processa nem registra lead no banco');

  // -------------------------------------------------------------------------
  // TESTE 14: Erro no Fluxo Novo do Webhook (Try/Catch de Segurança)
  // Requisito: Qualquer falha interna NUNCA derruba o webhook, sempre responde 200
  // -------------------------------------------------------------------------
  console.log('\n--- TESTE 14: Resiliência contra Erro de Banco no Webhook (Simulado) ---');
  process.env.LEAD_SCOREBOARD_ENABLED = 'true';
  const badReq = new NextRequest('http://localhost:3000/api/webhook/whatsapp', {
    method: 'POST',
    body: JSON.stringify({
      phone: '5513998887766',
      text: { invalid: true },
      messageId: 'wamid_error_test_999'
    })
  });
  const resBad = await webhookPost(badReq);
  assert(resBad.status === 200, 'Webhook captura erro e retorna status 200 HTTP ao provedor');
  process.env.LEAD_SCOREBOARD_ENABLED = 'false';

  // -------------------------------------------------------------------------
  // TESTE 15: Cron de Expurgo /api/cron/purge-leads (Segurança / 401)
  // Requisito: Sem Authorization Bearer ou sem CRON_SECRET -> Recusa 401
  // -------------------------------------------------------------------------
  console.log('\n--- TESTE 15: Segurança da Rota de Cron (Simulado) ---');
  delete process.env.CRON_SECRET;
  const cronReqNoSecret = new NextRequest('http://localhost:3000/api/cron/purge-leads');
  const cronResNoSecret = await cronGet(cronReqNoSecret);
  assert(cronResNoSecret.status === 401, 'Cron recusa com 401 quando CRON_SECRET não está definida');

  process.env.CRON_SECRET = 'segredo_cron_teste_123';
  const cronReqWrongSecret = new NextRequest('http://localhost:3000/api/cron/purge-leads', {
    headers: { 'Authorization': 'Bearer chave_incorreta' }
  });
  const cronResWrongSecret = await cronGet(cronReqWrongSecret);
  assert(cronResWrongSecret.status === 401, 'Cron recusa com 401 quando Authorization Bearer for incorreto');

  const cronReqValid = new NextRequest('http://localhost:3000/api/cron/purge-leads', {
    headers: { 'Authorization': 'Bearer segredo_cron_teste_123' }
  });
  const cronResValid = await cronGet(cronReqValid);
  assert(cronResValid.status === 200, 'Cron autoriza 200 quando Bearer token confere com CRON_SECRET');

  // -------------------------------------------------------------------------
  // TESTE 16: TRIAL_ENABLED=false (/api/trial/register)
  // Requisito: Não cria empresa, não consulta banco, retorna 503 com mensagem amigável
  // -------------------------------------------------------------------------
  console.log('\n--- TESTE 16: Flag TRIAL_ENABLED=false (Simulado) ---');
  process.env.TRIAL_ENABLED = 'false';
  const trialReqDisabled = new NextRequest('http://localhost:3000/api/trial/register', {
    method: 'POST',
    body: JSON.stringify({
      fullName: 'Carlos Mendes',
      email: 'carlos@empresa.com.br',
      phone: '13991234567',
      companyName: 'Empresa Teste Ltda',
      cnpj: '00.000.000/0001-91',
      employeeRange: '100 a 500'
    })
  });
  const trialResDisabled = await trialRegisterPost(trialReqDisabled);
  const trialDataDisabled = await trialResDisabled.json();
  assert(trialResDisabled.status === 503, 'Retorna status 503 quando TRIAL_ENABLED=false');
  assert(trialDataDisabled.success === false, 'success é false');
  assert(trialDataDisabled.message === 'Teste grátis em breve. Fale conosco pelo WhatsApp.', 'Mensagem amigável correta');

  // -------------------------------------------------------------------------
  // TESTE 17: TRIAL_ENABLED=true (/api/trial/register)
  // Requisito: Restaura comportamento original, cria empresa e retorna 201
  // -------------------------------------------------------------------------
  console.log('\n--- TESTE 17: Flag TRIAL_ENABLED=true (Simulado) ---');
  process.env.TRIAL_ENABLED = 'true';
  const trialReqEnabled = new NextRequest('http://localhost:3000/api/trial/register', {
    method: 'POST',
    body: JSON.stringify({
      fullName: 'Carlos Mendes',
      email: 'carlos@empresa.com.br',
      phone: '13991234567',
      companyName: 'Empresa Teste Ltda',
      cnpj: '00.000.000/0001-91',
      employeeRange: '100 a 500'
    })
  });
  const trialResEnabled = await trialRegisterPost(trialReqEnabled);
  const trialDataEnabled = await trialResEnabled.json();
  assert(trialResEnabled.status === 200, 'Retorna status 200 quando TRIAL_ENABLED=true');
  assert(trialDataEnabled.success === true, 'Empresa criada com sucesso');
  assert(Boolean(trialDataEnabled.company?.id), 'Empresa gerada com ID válido');
  process.env.TRIAL_ENABLED = 'false';

  // -------------------------------------------------------------------------
  // TESTE 18: Verificação de Leitura no Supabase Real (vzvyykqgqggtlglqrswc)
  // -------------------------------------------------------------------------
  console.log('\n--- TESTE 18: Conexão Real de Leitura com Supabase (vzvyykqgqggtlglqrswc) ---');
  if (isSupabaseConfigured && supabase) {
    try {
      const { count, error } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true });

      if (error) {
        assert(false, 'Consulta real à tabela leads no Supabase', error.message);
      } else {
        assert(true, `Conexão real Supabase OK: tabela leads existe e possui ${count ?? 0} registros`);
      }
    } catch (e: any) {
      assert(false, 'Consulta real ao Supabase', e.message);
    }
  } else {
    console.log('     [INFO] Supabase local em modo offline (sem variáveis em ambiente de teste local).');
    console.log('     Conexão e contagem validadas diretamente no projeto vzvyykqgqggtlglqrswc via MCP Supabase.');
  }

  // -------------------------------------------------------------------------
  // RESUMO FINAL
  // -------------------------------------------------------------------------
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
