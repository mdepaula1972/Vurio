import fs from 'fs';
import crypto from 'crypto';
import * as forge from 'node-forge';
import { validateMedicalAttestation } from '../src/lib/crypto/validator';
import { parseCrmFromText } from '../src/lib/crypto/crm-extractor';
import { extractRestDaysAndPeriod } from '../src/lib/crypto/days-extractor';
import { formatWhatsAppResponse } from '../src/lib/whatsapp/message-formatter';

async function runTests() {
  console.log('====================================================');
  console.log('INICIANDO BATERIA DE TESTES AMPLIADA DO MOTOR');
  console.log('====================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, label: string) {
    totalTests++;
    if (condition) {
      console.log(`✅ [PASSOU] ${label}`);
      passedTests++;
    } else {
      console.error(`❌ [FALHOU] ${label}`);
    }
  }

  // --- TESTE 1: Regex e Extração de CRM / UF ---
  console.log('--- TESTE 1: Extração de CRM e UF ---');
  const sampleText1 = 'Atesto para os devidos fins que o paciente... Dr. Roberto Santos CRM/SP 123456';
  const crm1 = parseCrmFromText(sampleText1);
  assert(crm1.crm === '123456' && crm1.uf === 'SP', 'Extração CRM/SP 123456');

  const sampleText2 = 'Médico Responsável: Dra. Camila Lima - CRM: 98765-MG';
  const crm2 = parseCrmFromText(sampleText2);
  assert(crm2.crm === '98765' && crm2.uf === 'MG', 'Extração CRM: 98765-MG');

  const sampleText3 = 'Conselho Regional: CRM 554433 RS';
  const crm3 = parseCrmFromText(sampleText3);
  assert(crm3.crm === '554433' && crm3.uf === 'RS', 'Extração CRM 554433 RS');

  // --- TESTE 2: Extração de Dias de Afastamento (LGPD Compliant) ---
  console.log('\n--- TESTE 2: Extração de Dias de Afastamento ---');
  const sampleRest1 = 'O paciente necessita de 03 (três) dias de repouso a partir de 05/09/2026 para recuperação.';
  const rest1 = extractRestDaysAndPeriod(sampleRest1);
  assert(rest1.days === 3, 'Extração de 03 dias de repouso');
  assert(rest1.startDate === '05/09/2026', 'Extração da data de início 05/09/2026');

  const sampleRest2 = 'Atesto dispensa do trabalho por 15 dias iniciando em 10/10/2026.';
  const rest2 = extractRestDaysAndPeriod(sampleRest2);
  assert(rest2.days === 15 && rest2.startDate === '10/10/2026', 'Extração de 15 dias e data');

  // --- TESTE 3: Foto de Papel Tradicional (Caso B1) ---
  console.log('\n--- TESTE 3: Detecção de Foto de Papel Tradicional ---');
  const fakeJpgBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]);
  const imageResult = await validateMedicalAttestation(fakeJpgBuffer, 'image/jpeg', 'atestado_foto.jpg');
  assert(imageResult.status === 'PHOTO_MANUAL_PAPER', 'Status identificado como PHOTO_MANUAL_PAPER');
  assert(!imageResult.isAuthentic, 'isAuthentic é false para foto de papel manual');
  const msgImage = formatWhatsAppResponse(imageResult);
  assert(msgImage.includes('🟡 *Triagem de Atestado Físico (Papel Tradicional)*'), 'Mensagem WhatsApp de foto formatada');

  // --- TESTE 4: Trava Antifraude de Duplicidade ---
  console.log('\n--- TESTE 4: Trava Antifraude de Duplicidade (Reenvio) ---');
  const fakeFileBuffer = Buffer.from('conteudo-do-atestado-teste-12345');
  const knownHash = crypto.createHash('sha256').update(fakeFileBuffer).digest('hex').toLowerCase();
  const duplicateResult = await validateMedicalAttestation(fakeFileBuffer, 'application/pdf', 'atestado.pdf', [knownHash]);
  assert(duplicateResult.status === 'DUPLICATE_DOCUMENT', 'Status identificado como DUPLICATE_DOCUMENT');
  assert(!duplicateResult.isAuthentic, 'isAuthentic é false para documento duplicado');
  const msgDuplicate = formatWhatsAppResponse(duplicateResult);
  assert(msgDuplicate.includes('🔴 *Alerta de Duplicidade*'), 'Mensagem WhatsApp de duplicidade formatada');

  // --- TESTE 5: PDF Sem Assinatura Digital ---
  console.log('\n--- TESTE 5: PDF Sem Assinatura ---');
  const unsignedPdf = Buffer.from('%PDF-1.4\n1 0 obj\n<< /Title (Atestado Sem Assinatura) >>\nendobj\ntrailer\n<<>>\n%%EOF');
  const unsignedResult = await validateMedicalAttestation(unsignedPdf, 'application/pdf', 'sem_assinatura.pdf');
  assert(unsignedResult.status === 'NO_DIGITAL_SIGNATURE', 'Status identificado como NO_DIGITAL_SIGNATURE');
  assert(!unsignedResult.isAuthentic, 'isAuthentic é falso para PDF sem assinatura');
  const msgUnsigned = formatWhatsAppResponse(unsignedResult);
  assert(msgUnsigned.includes('🔴 *Alerta de Inconsistência*'), 'Mensagem WhatsApp Caso B formatada corretamente');

  // --- TESTE 6: Assinatura Digital PAdES e Detecção de Adulteração (Caso A1 & C1) ---
  console.log('\n--- TESTE 6: Assinatura Digital PAdES e Detecção de Adulteração ---');

  const keys = forge.pki.rsa.generateKeyPair(1024);
  const cert = forge.pki.createCertificate();
  cert.publicKey = keys.publicKey;
  cert.serialNumber = '01';
  cert.validity.notBefore = new Date();
  cert.validity.notAfter = new Date();
  cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1);

  const subjectAttrs = [
    { name: 'commonName', value: 'DR. CARLOS EDUARDO SILVA:12345678901' },
    { name: 'countryName', value: 'BR' },
    { shortName: 'OU', value: 'Certificado ICP-Brasil' },
    { name: 'organizationName', value: 'Conselho Regional de Medicina' }
  ];

  const issuerAttrs = [
    { name: 'commonName', value: 'AC SOLUTI Multipla v5' },
    { name: 'countryName', value: 'BR' },
    { shortName: 'OU', value: 'Autoridade Certificadora Raiz Brasileira ICP-Brasil' },
    { name: 'organizationName', value: 'Soluti Certificacao Digital' }
  ];

  cert.setSubject(subjectAttrs);
  cert.setIssuer(issuerAttrs);
  cert.sign(keys.privateKey, forge.md.sha256.create());

  const pdfHeader = '%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /Contents 4 0 R >>\nendobj\n4 0 obj\n<< /Length 135 >>\nstream\nBT /F1 12 Tf 100 700 Td (Atestado Medico - CRM 789101/SP - Afastamento por 05 dias a partir de 12/09/2026) Tj ET\nendstream\nendobj\n';
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
      {
        type: forge.pki.oids.contentType,
        value: forge.pki.oids.data
      },
      {
        type: forge.pki.oids.messageDigest
      },
      {
        type: forge.pki.oids.signingTime,
        value: new Date() as any
      }
    ]
  });
  p7.sign({ detached: true });

  const p7Der = forge.asn1.toDer(p7.toAsn1()).getBytes();
  const p7Hex = Buffer.from(p7Der, 'binary').toString('hex');
  const paddedP7Hex = p7Hex.padEnd(reservedHexLength, '0');

  const signedPdfBuffer = Buffer.concat([
    finalPart1,
    Buffer.from(paddedP7Hex, 'latin1'),
    endPart
  ]);

  // Salvar amostra oficial validada
  fs.writeFileSync('test-samples/01_atestado_icp_brasil_valido.pdf', signedPdfBuffer);
  fs.writeFileSync('test-samples/05_atestado_duplicado.pdf', signedPdfBuffer);

  // Validar o PDF íntegro (Caso A1)
  const validResult = await validateMedicalAttestation(signedPdfBuffer, 'application/pdf', 'atestado_valido.pdf');
  assert(validResult.status === 'VALID_INTACT', 'Status do PDF íntegro é VALID_INTACT');
  assert(validResult.isAuthentic === true, 'isAuthentic é true');
  assert(validResult.doctor.name === 'DR. CARLOS EDUARDO SILVA', `Nome do médico extraído: ${validResult.doctor.name}`);
  assert(validResult.doctor.cpf === '123.456.789-01', `CPF do médico extraído: ${validResult.doctor.cpf}`);
  assert(validResult.doctor.crm === '789101' && validResult.doctor.uf === 'SP', `CRM/UF: CRM ${validResult.doctor.crm}/${validResult.doctor.uf}`);
  assert(validResult.restPeriod.days === 5, `Dias de afastamento extraídos: ${validResult.restPeriod.days} dias`);
  assert(validResult.signature.integrityConfirmed === true, 'Integridade SHA-256 confirmada');
  assert(validResult.signature.issuer?.includes('SOLUTI') === true, `Emissor: ${validResult.signature.issuer}`);

  const msgValid = formatWhatsAppResponse(validResult);
  assert(msgValid.includes('🟢 *Atestado Autêntico e Íntegro*'), 'Mensagem WhatsApp Caso A formatada');
  assert(msgValid.includes('*Afastamento:* 5 dias a partir de 12/09/2026'), 'Afastamento presente na mensagem WhatsApp');

  // --- TESTE 7: Detecção de Adulteração (Caso C1) ---
  console.log('\n--- TESTE 7: Simulação de Adulteração de Bytes (Tampering) ---');
  const tamperedPdfBuffer = Buffer.from(signedPdfBuffer);
  tamperedPdfBuffer[50] = tamperedPdfBuffer[50] === 0x41 ? 0x42 : 0x41;

  const tamperedResult = await validateMedicalAttestation(tamperedPdfBuffer, 'application/pdf', 'atestado_adulterado.pdf');
  assert(tamperedResult.status === 'TAMPERED', 'Status identificado como TAMPERED');
  assert(tamperedResult.isAuthentic === false, 'isAuthentic é false para documento adulterado');
  assert(tamperedResult.signature.integrityConfirmed === false, 'Integridade SHA-256 rejeitada');
  
  const msgTampered = formatWhatsAppResponse(tamperedResult);
  assert(msgTampered.includes('🔴 *Alerta de Inconsistência*'), 'Mensagem WhatsApp Caso C1 formatada');

  console.log('\n====================================================');
  console.log(`RESULTADO FINAL DOS TESTES AMPLIADOS: ${passedTests}/${totalTests} PASSARAM`);
  console.log('====================================================');

  if (passedTests === totalTests) {
    console.log('🚀 TODOS OS TESTES AMPLIADOS FORAM APROVADOS COM SUCESSO!');
    process.exit(0);
  } else {
    console.error('❌ ALGUNS TESTES FALHARAM.');
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Erro durante os testes:', err);
  process.exit(1);
});
