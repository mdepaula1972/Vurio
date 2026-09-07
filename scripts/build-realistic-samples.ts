import * as forge from 'node-forge';
import fs from 'fs';
import path from 'path';
import { validateMedicalAttestation } from '../src/lib/crypto/validator';
import { extractPdfSignatures, getSignedBytes } from '../src/lib/crypto/pdf-parser';

async function main() {
  const outDir = path.join(__dirname, '..', 'test-samples');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  console.log('--- GERANDO AMOSTRAS MÉDICAS ULTRA-REALISTAS E COMPLETAS ---');

  // 1. Gerar Chaves e Certificado X.509 ICP-Brasil Real
  const keys = forge.pki.rsa.generateKeyPair(2048);
  const cert = forge.pki.createCertificate();
  cert.publicKey = keys.publicKey;
  cert.serialNumber = '01';
  cert.validity.notBefore = new Date();
  cert.validity.notAfter = new Date();
  cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 2);
  cert.setSubject([
    { name: 'commonName', value: 'DR. CARLOS EDUARDO SILVA:12345678901' },
    { name: 'countryName', value: 'BR' },
    { name: 'organizationName', value: 'ICP-Brasil' },
    { shortName: 'OU', value: 'Pessoa Fisica A3' }
  ]);
  cert.setIssuer([
    { name: 'commonName', value: 'AC SOLUTI Multipla v5' },
    { name: 'countryName', value: 'BR' },
    { shortName: 'OU', value: 'Autoridade Certificadora Raiz Brasileira ICP-Brasil' },
    { name: 'organizationName', value: 'Soluti Certificacao Digital' }
  ]);
  cert.sign(keys.privateKey, forge.md.sha256.create());

  // 2. Visual Rico e Formatado do Atestado
  const visualContent = [
    '0.1 0.3 0.7 rg 40 800 515 4 re f 0 0 0 rg',
    'BT /F2 16 Tf 40 770 Td (HOSPITAL E MATERNIDADE SAO LUCAS) Tj ET',
    'BT /F1 9 Tf 40 755 Td (Medicina Diagnostica e Saude Ocupacional - CNPJ 45.123.789/0001-10) Tj ET',
    'BT /F1 9 Tf 40 742 Td (Av. Paulista, 1500 - Bela Vista - Sao Paulo/SP - Tel: (11) 3456-7890) Tj ET',
    '0.8 0.8 0.8 RG 40 725 m 555 725 l S',
    'BT /F2 14 Tf 190 685 Td (ATESTADO MEDICO DE DISPENSA) Tj ET',
    'BT /F2 10 Tf 40 640 Td (IDENTIFICACAO DO PACIENTE:) Tj ET',
    'BT /F1 10 Tf 40 625 Td (Paciente: Marcos Antonio de Paula | CPF: ***.456.789-** | RG: 28.910.234-5 SSP/SP) Tj ET',
    'BT /F2 10 Tf 40 585 Td (PARECER CLINICO E DETERMINACAO:) Tj ET',
    'BT /F1 10 Tf 40 565 Td (Atesto para os devidos fins que o paciente esteve sob atendimento medico nesta data.) Tj ET',
    'BT /F1 10 Tf 40 550 Td (Apresentou quadro clinico que demanda afastamento de suas atividades laborais por) Tj ET',
    'BT /F2 11 Tf 40 530 Td (um periodo de 05 (cinco) dias a partir de 12/09/2026 para repouso e recuperacao.) Tj ET',
    'BT /F1 10 Tf 40 505 Td (Diagnostico: Classificacao Internacional de Doencas CID-10 J06.9.) Tj ET',
    '0.9 0.9 0.9 RG 40 370 515 95 re S 0.96 0.98 1 rg 41 371 513 93 re f 0 0 0 rg',
    'BT /F2 9 Tf 55 445 Td ([ ASSINATURA ELETRONICA AVANCADA ICP-BRASIL PADRAO PAdES / PKCS#7 ]) Tj ET',
    'BT /F1 8 Tf 55 430 Td (Signatario: DR. CARLOS EDUARDO SILVA:12345678901) Tj ET',
    'BT /F1 8 Tf 55 416 Td (Registro Profissional: CRM 789101/SP | Especialidade: Clinica Geral) Tj ET',
    'BT /F1 8 Tf 55 402 Td (Autoridade Certificadora: AC SOLUTI Multipla v5 | ICP-Brasil A3) Tj ET',
    'BT /F1 8 Tf 55 388 Td (Respaldo Juridico: Medida Provisoria no 2.200-2/2001 e Resolucao CFM 2.299/2021) Tj ET',
    'BT /F1 9 Tf 40 320 Td (Sao Paulo, 12 de Setembro de 2026.) Tj ET',
    '0.8 0.8 0.8 RG 180 260 m 415 260 l S',
    'BT /F2 10 Tf 220 245 Td (Dr. Carlos Eduardo Silva) Tj ET',
    'BT /F1 9 Tf 245 232 Td (CRM 789101/SP) Tj ET'
  ].join('\n');

  const streamBuf = Buffer.from(visualContent, 'latin1');
  const pdfHeader = [
    '%PDF-1.4',
    '1 0 obj',
    '<< /Type /Catalog /Pages 2 0 R >>',
    'endobj',
    '2 0 obj',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    'endobj',
    '3 0 obj',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 6 0 R /F2 7 0 R >> >> >>',
    'endobj',
    '4 0 obj',
    '<< /Length ' + streamBuf.length + ' >>',
    'stream\n' + visualContent + '\nendstream',
    'endobj',
    '6 0 obj',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    'endobj',
    '7 0 obj',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>',
    'endobj',
    ''
  ].join('\n');

  const sigPrefix = '5 0 obj\n<< /Type /Sig /Filter /Adobe.PPKLite /SubFilter /adbe.pkcs7.detached /ByteRange [ ';
  const reservedHexLen = 6000;
  const endPart = Buffer.from('>\n>>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF\n', 'latin1');

  // Cálculo binário rigoroso:
  // Queremos que o ByteRange tenha exatamente tamanho fixo com 8 dígitos cada:
  // "00000000 00000000 00000000 00000000 ] /Contents <"
  const dummyRange = '00000000 00000000 00000000 00000000 ] /Contents <';
  const prefixBuf = Buffer.from(pdfHeader + sigPrefix, 'latin1');
  const len1 = prefixBuf.length + Buffer.from(dummyRange, 'latin1').length;
  const start2 = len1 + reservedHexLen;
  const len2 = endPart.length;

  const pad8 = (n: number) => String(n).padStart(8, '0');
  const actualRange = pad8(0) + ' ' + pad8(len1) + ' ' + pad8(start2) + ' ' + pad8(len2) + ' ] /Contents <';

  const finalPart1 = Buffer.from(pdfHeader + sigPrefix + actualRange, 'latin1');

  if (finalPart1.length !== len1) {
    throw new Error(`Inconsistência de cálculo: finalPart1.length (${finalPart1.length}) !== len1 (${len1})`);
  }

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
  const paddedHex = p7Hex.padEnd(reservedHexLen, '0');

  const signedPdf = Buffer.concat([
    finalPart1,
    Buffer.from(paddedHex, 'latin1'),
    endPart
  ]);

  const sigs = extractPdfSignatures(signedPdf);
  const extractedBytes = getSignedBytes(signedPdf, sigs[0].byteRange);

  console.log('bytesToSign length:', bytesToSign.length);
  console.log('extractedBytes length:', extractedBytes.length);
  console.log('sigs[0].byteRange:', sigs[0].byteRange);
  console.log('dummyRange len:', dummyRange.length);
  console.log('actualRange len:', actualRange.length);

  for (let i = 0; i < Math.min(bytesToSign.length, extractedBytes.length); i++) {
    if (bytesToSign[i] !== extractedBytes[i]) {
      console.log(`Divergência no índice ${i}: esperado ${bytesToSign[i]} ('${String.fromCharCode(bytesToSign[i])}'), obtido ${extractedBytes[i]} ('${String.fromCharCode(extractedBytes[i])}')`);
      break;
    }
  }

  if (!bytesToSign.equals(extractedBytes)) {
    throw new Error('Alerta: bytes extraídos pelo parser diferem dos bytes assinados!');
  }

  console.log('✅ Bytes binários conferidos: 100% IDÊNTICOS.');

  // Validar através do motor do Vurio
  const report1 = await validateMedicalAttestation(signedPdf, 'application/pdf', '01_atestado_icp_brasil_valido.pdf');
  console.log('STATUS VALIDADO DO ARQUIVO 01:', report1.status);
  console.log('IS_AUTHENTIC:', report1.isAuthentic);
  console.log('MÉDICO EXTRAÍDO:', report1.doctor.name, report1.doctor.crm);
  console.log('AFASTAMENTO:', report1.restPeriod.days, 'dias a partir de', report1.restPeriod.startDate);

  if (report1.status !== 'VALID_INTACT') {
    throw new Error(`Falha na validação do arquivo 01: status obtido foi ${report1.status}`);
  }

  // 1. Gravar Arquivo 01 Válido
  fs.writeFileSync(path.join(outDir, '01_atestado_icp_brasil_valido.pdf'), signedPdf);
  console.log('💾 Gravado: 01_atestado_icp_brasil_valido.pdf (Formatado e Válido)');

  // 2. Gravar Arquivo 02 Adulterado (Fraude)
  // Alteramos os dias de repouso no corpo visual (de 05 para 15 dias) quebrando a integridade SHA-256
  const tamperedPdf = Buffer.from(signedPdf);
  const targetStr = 'um periodo de 05 (cinco) dias';
  const replaceStr = 'um periodo de 15 (quinze) dia';
  const targetBuf = Buffer.from(targetStr, 'latin1');
  const replaceBuf = Buffer.from(replaceStr, 'latin1');
  const idx = tamperedPdf.indexOf(targetBuf);
  if (idx !== -1) {
    replaceBuf.copy(tamperedPdf, idx);
  } else {
    // Fallback: alterar byte no stream
    tamperedPdf[100] = tamperedPdf[100] === 0x41 ? 0x42 : 0x41;
  }

  const report2 = await validateMedicalAttestation(tamperedPdf, 'application/pdf', '02_atestado_adulterado_fraude.pdf');
  console.log('STATUS VALIDADO DO ARQUIVO 02:', report2.status);

  fs.writeFileSync(path.join(outDir, '02_atestado_adulterado_fraude.pdf'), tamperedPdf);
  console.log('💾 Gravado: 02_atestado_adulterado_fraude.pdf (Formatado e Adulterado)');

  // 3. Gravar Arquivo 03 Sem Assinatura Digital (Visual completo, sem certificado)
  const unsignedVisual = [
    '0.1 0.4 0.8 rg 40 800 515 4 re f 0 0 0 rg',
    'BT /F2 16 Tf 40 770 Td (CONSULTORIO MEDICO DR. PAULO SOUZA) Tj ET',
    'BT /F1 9 Tf 40 755 Td (Clinica Geral e Atendimento Ambulatorial) Tj ET',
    'BT /F1 9 Tf 40 742 Td (Rua das Palmeiras, 300 - Campinas / SP - Tel: (19) 3211-0000) Tj ET',
    '0.8 0.8 0.8 RG 40 725 m 555 725 l S',
    'BT /F2 14 Tf 210 685 Td (DECLARACAO MEDICA) Tj ET',
    'BT /F1 10 Tf 40 620 Td (Declaro para os devidos fins que o colaborador Marcos Antonio de Paula compareceu a este consultorio,) Tj ET',
    'BT /F1 10 Tf 40 605 Td (sendo recomendado repouso por 2 dias a partir de hoje.) Tj ET',
    'BT /F1 9 Tf 40 500 Td (Dr. Paulo Souza - CRM 123456/SP) Tj ET',
    'BT /F1 8 Tf 40 480 Td (Documento impresso em PDF comum, sem assinatura digital ICP-Brasil e-CPF) Tj ET'
  ].join('\n');
  const uBuf = Buffer.from(unsignedVisual, 'latin1');
  const unsignedPdf = [
    '%PDF-1.4',
    '1 0 obj',
    '<< /Type /Catalog /Pages 2 0 R >>',
    'endobj',
    '2 0 obj',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    'endobj',
    '3 0 obj',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>',
    'endobj',
    '4 0 obj',
    '<< /Length ' + uBuf.length + ' >>',
    'stream\n' + unsignedVisual + '\nendstream',
    'endobj',
    '5 0 obj',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    'endobj',
    '6 0 obj',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>',
    'endobj',
    'trailer',
    '<< /Root 1 0 R >>',
    '%%EOF\n'
  ].join('\n');

  const unsignedBuffer = Buffer.from(unsignedPdf, 'latin1');
  const report3 = await validateMedicalAttestation(unsignedBuffer, 'application/pdf', '03_atestado_sem_assinatura.pdf');
  console.log('STATUS VALIDADO DO ARQUIVO 03:', report3.status);

  fs.writeFileSync(path.join(outDir, '03_atestado_sem_assinatura.pdf'), unsignedBuffer);
  console.log('💾 Gravado: 03_atestado_sem_assinatura.pdf (Formatado e Sem Assinatura)');

  // 4. Gravar Arquivo 05 Duplicado
  fs.copyFileSync(path.join(outDir, '01_atestado_icp_brasil_valido.pdf'), path.join(outDir, '05_atestado_duplicado.pdf'));
  console.log('💾 Gravado: 05_atestado_duplicado.pdf (Clone do 01 para teste de duplicidade)');

  console.log('\n🎉 TODOS OS 5 ARQUIVOS ULTRA-REALISTAS ESTÃO PRONTOS COM VISUAL E CRIPTOGRAFIA!');
}

main().catch(err => {
  console.error('ERRO FATAL:', err);
  process.exit(1);
});
