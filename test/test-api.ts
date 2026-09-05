import crypto from 'crypto';
import * as forge from 'node-forge';
import { POST as validateAttestationRoute } from '../src/app/api/validate-attestation/route';
import { POST as webhookRoute } from '../src/app/api/webhook/whatsapp/route';
import { NextRequest } from 'next/server';

async function runApiTests() {
  console.log('====================================================');
  console.log('INICIANDO TESTE DAS ROTAS DE API SERVERLESS');
  console.log('====================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, label: string) {
    total++;
    if (condition) {
      console.log(`✅ [PASSOU] ${label}`);
      passed++;
    } else {
      console.error(`❌ [FALHOU] ${label}`);
    }
  }

  // 1. Gerar PDF assinado sintético
  const keys = forge.pki.rsa.generateKeyPair(1024);
  const cert = forge.pki.createCertificate();
  cert.publicKey = keys.publicKey;
  cert.serialNumber = '01';
  cert.validity.notBefore = new Date();
  cert.validity.notAfter = new Date();
  cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1);

  const subjectAttrs = [
    { name: 'commonName', value: 'DR. MARCOS PAULO:99887766554' },
    { name: 'countryName', value: 'BR' },
    { shortName: 'OU', value: 'Certificado ICP-Brasil' }
  ];
  const issuerAttrs = [
    { name: 'commonName', value: 'AC CERTISIGN Multipla v5' },
    { name: 'countryName', value: 'BR' }
  ];
  cert.setSubject(subjectAttrs);
  cert.setIssuer(issuerAttrs);
  cert.sign(keys.privateKey, forge.md.sha256.create());

  const pdfHeader = '%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /Contents 4 0 R >>\nendobj\n4 0 obj\n<< /Length 120 >>\nstream\nBT /F1 12 Tf 100 700 Td (Atestado Medico Dr Marcos - CRM 112233/RJ - Repouso de 03 dias a contar de 05/09/2026) Tj ET\nendstream\nendobj\n';
  const sigDictPrefix = '5 0 obj\n<< /Type /Sig /Filter /Adobe.PPKLite /SubFilter /adbe.pkcs7.detached /ByteRange [ ';
  const reservedHexLength = 3000;
  const part2Trailer = '\n>>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF\n';
  const endPart = Buffer.from(`>${part2Trailer}`, 'latin1');

  const dummyRangeStr = '000000 000000 000000 000000 ] /Contents <';
  const prefixLen = Buffer.from(pdfHeader + sigDictPrefix, 'latin1').length;
  const totalPart1Len = prefixLen + Buffer.from(dummyRangeStr, 'latin1').length;
  const start1 = 0;
  const len1 = totalPart1Len;
  const start2 = len1 + reservedHexLength;
  const len2 = endPart.length;

  const actualRangeStr = `${start1.toString().padStart(6, '0')} ${len1.toString().padStart(6, '0')} ${start2.toString().padStart(6, '0')} ${len2.toString().padStart(6, '0')} ] /Contents <`;
  const finalPart1 = Buffer.from(pdfHeader + sigDictPrefix + actualRangeStr, 'latin1');
  const bytesToSign = Buffer.concat([finalPart1, endPart]);

  const p7 = forge.pkcs7.createSignedData();
  p7.content = forge.util.createBuffer(bytesToSign.toString('binary'));
  p7.addCertificate(cert);
  p7.addSigner({
    key: keys.privateKey,
    certificate: cert,
    digestAlgorithm: forge.pki.oids.sha256,
    authenticatedAttributes: [
      { type: forge.pki.oids.contentType, value: forge.pki.oids.data },
      { type: forge.pki.oids.messageDigest },
      { type: forge.pki.oids.signingTime, value: new Date() as any }
    ]
  });
  p7.sign({ detached: true });

  const p7Der = forge.asn1.toDer(p7.toAsn1()).getBytes();
  const p7Hex = Buffer.from(p7Der, 'binary').toString('hex');
  const paddedP7Hex = p7Hex.padEnd(reservedHexLength, '0');

  const signedPdfBuffer = Buffer.concat([finalPart1, Buffer.from(paddedP7Hex, 'latin1'), endPart]);
  const base64Pdf = signedPdfBuffer.toString('base64');

  // --- TESTE 1: Rota /api/validate-attestation (Serverless < 3s) ---
  console.log('--- TESTE 1: Chamada POST /api/validate-attestation ---');
  const startTimer = Date.now();
  
  const req1 = new NextRequest('http://localhost:3000/api/validate-attestation', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fileBase64: base64Pdf,
      mimeType: 'application/pdf',
      fileName: 'atestado_dr_marcos.pdf'
    })
  });

  const res1 = await validateAttestationRoute(req1);
  const data1 = await res1.json();
  const duration = Date.now() - startTimer;

  assert(res1.status === 200, 'HTTP Status 200 retornado');
  assert(data1.success === true, 'Payload success: true');
  assert(data1.status === 'VALID_INTACT', 'Status de validação: VALID_INTACT');
  assert(duration < 3000, `Tempo de resposta abaixo de 3s: ${duration}ms medidos`);
  assert(data1.whatsappMessage.includes('🟢 *Atestado Autêntico e Íntegro*'), 'Mensagem WhatsApp incluída na resposta');
  console.log(`⏱️ Tempo total de execução: ${duration}ms (Meta < 3000ms)\n`);

  // --- TESTE 2: Chamada POST /api/webhook/whatsapp com novo atestado ---
  console.log('--- TESTE 2: Chamada POST /api/webhook/whatsapp ---');
  // Modificar ligeiramente o trailer para gerar hash único e testar novo documento autêntico
  const webhookPdfBuffer = Buffer.from(signedPdfBuffer);
  // Usar companyId separada para o webhook ou atestado distinto
  const req2 = new NextRequest('http://localhost:3000/api/webhook/whatsapp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      phone: '5511999998888',
      mediaBase64: base64Pdf,
      mimeType: 'application/pdf',
      fileName: 'atestado_colaborador.pdf',
      companyId: 'company-rh-nova' // Nova empresa para testar documento inédito
    })
  });

  const res2 = await webhookRoute(req2);
  const data2 = await res2.json();

  assert(res2.status === 200, 'Webhook retornou status 200');
  assert(data2.success === true, 'Webhook processou com sucesso');
  assert(data2.whatsappResponse.includes('🟢 *Atestado Autêntico e Íntegro*'), 'Resposta automática de WhatsApp formatada');
  console.log('\nResposta formatada do Webhook:\n' + data2.whatsappResponse);

  console.log('\n====================================================');
  console.log(`RESULTADO FINAL DAS ROTAS DE API: ${passed}/${total} PASSARAM`);
  console.log('====================================================');

  if (passed === total) {
    console.log('🚀 TODAS AS ROTAS DE API FORAM APROVADAS COM RESPOSTA ULTRA-RÁPIDA!');
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runApiTests().catch(err => {
  console.error('Erro nos testes de API:', err);
  process.exit(1);
});
