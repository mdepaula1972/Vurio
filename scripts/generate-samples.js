const fs = require('fs');
const path = require('path');
const forge = require('node-forge');

const outDir = path.join(__dirname, '..', 'test-samples');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

console.log('Gerando amostras em:', outDir);

// 1. Gerar Chaves e Certificado X.509 ICP-Brasil
const keys = forge.pki.rsa.generateKeyPair(2048);
const cert = forge.pki.createCertificate();
cert.publicKey = keys.publicKey;
cert.serialNumber = '01';
cert.validity.notBefore = new Date();
cert.validity.notAfter = new Date();
cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 2);

const subjectAttrs = [
  { name: 'commonName', value: 'DR. CARLOS EDUARDO SILVA:12345678901' },
  { name: 'countryName', value: 'BR' },
  { name: 'organizationName', value: 'ICP-Brasil' },
  { shortName: 'OU', value: 'Pessoa Fisica A3' }
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

// 2. Montar PDF com assinatura digital PKCS#7
const pdfHeader = '%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /Contents 4 0 R >>\nendobj\n4 0 obj\n<< /Length 135 >>\nstream\nBT /F1 12 Tf 100 700 Td (Atestado Medico - CRM 789101/SP - Afastamento por 05 dias a partir de 12/09/2026) Tj ET\nendstream\nendobj\n';
const sigDictPrefix = '5 0 obj\n<< /Type /Sig /Filter /Adobe.PPKLite /SubFilter /adbe.pkcs7.detached /ByteRange [ ';

const reservedHexLength = 3000;
const part2Trailer = '\n>>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF\n';
const endPart = Buffer.from('>' + part2Trailer, 'latin1');

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
    { type: forge.pki.oids.signingTime, value: new Date() }
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

// 1. Arquivo 01: Válido ICP-Brasil
fs.writeFileSync(path.join(outDir, '01_atestado_icp_brasil_valido.pdf'), signedPdfBuffer);
console.log('✅ Criado: 01_atestado_icp_brasil_valido.pdf');

// 2. Arquivo 02: Adulterado (Fraude)
const tamperedPdfBuffer = Buffer.from(signedPdfBuffer);
tamperedPdfBuffer[50] = tamperedPdfBuffer[50] === 0x41 ? 0x42 : 0x41;
fs.writeFileSync(path.join(outDir, '02_atestado_adulterado_fraude.pdf'), tamperedPdfBuffer);
console.log('✅ Criado: 02_atestado_adulterado_fraude.pdf');

// 3. Arquivo 03: Sem Assinatura Digital
const unsignedPdf = '%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /Contents 4 0 R >>\nendobj\n4 0 obj\n<< /Length 120 >>\nstream\nBT /F1 12 Tf 100 700 Td (Atestado Medico Simples - Dr. Paulo Souza CRM 123456/SP - 2 dias de repouso) Tj ET\nendstream\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF\n';
fs.writeFileSync(path.join(outDir, '03_atestado_sem_assinatura.pdf'), Buffer.from(unsignedPdf, 'latin1'));
console.log('✅ Criado: 03_atestado_sem_assinatura.pdf');

// 4. Arquivo 04: Foto de Papel Tradicional (JPEG com cabeçalho EXIF/JFIF válido)
const fakeJpgBuffer = Buffer.from([
  0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x01, 0x00, 0x48,
  0x00, 0x48, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x43, 0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08,
  0x07, 0x07, 0x07, 0x09, 0x09, 0x08, 0x0a, 0x0c, 0x14, 0x0d, 0x0c, 0x0b, 0x0b, 0x0c, 0x19, 0x12,
  0x13, 0x0f, 0x14, 0x1d, 0x1a, 0x1f, 0x1e, 0x1d, 0x1a, 0x1c, 0x1c, 0x20, 0x24, 0x2e, 0x27, 0x20,
  0x22, 0x2c, 0x23, 0x1c, 0x1c, 0x28, 0x37, 0x29, 0x2c, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1f, 0x27,
  0x39, 0x3d, 0x38, 0x32, 0x3c, 0x2e, 0x33, 0x34, 0x32, 0xff, 0xc0, 0x00, 0x0b, 0x08, 0x00, 0x0a,
  0x00, 0x0a, 0x01, 0x01, 0x11, 0x00, 0xff, 0xc4, 0x00, 0x1f, 0x00, 0x00, 0x01, 0x05, 0x01, 0x01,
  0x01, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03, 0x04,
  0xff, 0xda, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3f, 0x00, 0x37, 0xff, 0xd9
]);
fs.writeFileSync(path.join(outDir, '04_foto_atestado_papel.jpg'), fakeJpgBuffer);
console.log('✅ Criado: 04_foto_atestado_papel.jpg');

// 5. Arquivo 05: Cópia para Duplicidade
fs.copyFileSync(path.join(outDir, '01_atestado_icp_brasil_valido.pdf'), path.join(outDir, '05_atestado_duplicado.pdf'));
console.log('✅ Criado: 05_atestado_duplicado.pdf');

console.log('\n🎉 TODAS AS 5 AMOSTRAS FORAM GERADAS COM SUCESSO!');
