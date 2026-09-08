import fs from 'fs';
import * as forge from 'node-forge';
import { validateMedicalAttestation } from '../src/lib/crypto/validator';

async function generate() {
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

  // Validar antes de salvar
  const res = await validateMedicalAttestation(signedPdfBuffer, 'application/pdf', 'teste.pdf');
  console.log('STATUS VALIDADO:', res.status);
  console.log('IS_AUTHENTIC:', res.isAuthentic);
  console.log('DOCTOR:', res.doctor);

  if (res.status === 'VALID_INTACT') {
    fs.writeFileSync('test-samples/01_atestado_icp_brasil_valido.pdf', signedPdfBuffer);
    fs.writeFileSync('test-samples/05_atestado_duplicado.pdf', signedPdfBuffer);
    console.log('✅ Arquivo 01_atestado_icp_brasil_valido.pdf gravado com status VALID_INTACT!');
  } else {
    console.error('Falhou na validação!', res);
  }
}

generate();
