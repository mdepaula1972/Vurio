const fs = require('fs');
const path = require('path');
const forge = require('node-forge');

const outDir = path.join(__dirname, '..', 'test-samples');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

console.log('Gerando atestados profissionais formatados em:', outDir);

// 1. Gerar Chaves e Certificado X.509 ICP-Brasil Real
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

// 2. Criar Layout Gráfico de Atestado Médico Profissional em PDF
function buildPdfStream(contentInstructions) {
  const streamBody = Buffer.from(contentInstructions, 'latin1');
  const streamLen = streamBody.length;

  return `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 6 0 R /F2 7 0 R >> >> >>
endobj
4 0 obj
<< /Length ${streamLen} >>
stream
${contentInstructions}
endstream
endobj
6 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
7 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>
endobj
`;
}

const formalCertificateContent = `
0.1 0.4 0.8 rg
50 790 495 2 re f
0 0 0 rg

BT /F2 16 Tf 50 765 Td (HOSPITAL & CLINICA SAO LUCAS) Tj ET
BT /F1 9 Tf 50 750 Td (Medicina do Trabalho e Diagnostico Avancado - CNPJ 45.123.789/0001-10) Tj ET
BT /F1 9 Tf 50 738 Td (Av. Paulista, 1500 - Bela Vista - Sao Paulo / SP - Tel: (11) 3456-7890) Tj ET

0.8 0.8 0.8 RG
50 720 m 545 720 l S

BT /F2 14 Tf 180 680 Td (ATESTADO MEDICO OCUPACIONAL) Tj ET

BT /F2 10 Tf 50 635 Td (IDENTIFICACAO DO PACIENTE:) Tj ET
BT /F1 10 Tf 50 620 Td (Nome: Marcos Antonio de Paula) Tj ET
BT /F1 10 Tf 50 605 Td (Documento: CPF: 123.456.789-01 | RG: 28.910.234-5 SSP/SP) Tj ET

BT /F2 10 Tf 50 565 Td (DECLARACAO MEDICA DE AFASTAMENTO:) Tj ET
BT /F1 10 Tf 50 545 Td (Atesto para os devidos fins trabalhistas e de comprovacao de frequencia laboral que o(a)) Tj ET
BT /F1 10 Tf 50 530 Td (paciente acima esteve sob consulta e atendimento medico nesta unidade hospitalar.) Tj ET

BT /F1 10 Tf 50 500 Td (Em decorrencia do quadro clinico constatado, faz-se necessario o seu) Tj ET
BT /F2 11 Tf 50 482 Td (Afastamento por 05 dias a partir de 12/09/2026 para repouso e tratamento.) Tj ET
BT /F1 10 Tf 50 460 Td (Diagnostico Preliminar - Classificacao Internacional de Doencas: CID J06.9.) Tj ET

0.9 0.9 0.9 RG
50 330 495 105 re S

0.95 0.97 1 rg
51 331 493 103 re f
0 0 0 rg

BT /F2 9 Tf 65 415 Td ([ METADADOS DA ASSINATURA DIGITAL ICP-BRASIL ] ) Tj ET
BT /F1 8 Tf 65 398 Td (Signatario: DR. CARLOS EDUARDO SILVA:12345678901) Tj ET
BT /F1 8 Tf 65 383 Td (Registro Profissional do Medico: CRM 789101/SP) Tj ET
BT /F1 8 Tf 65 368 Td (Certificado: AC SOLUTI Multipla v5 | ICP-Brasil A3 | Algoritmo SHA-256 RSA-2048) Tj ET
BT /F1 8 Tf 65 353 Td (Conformidade Legal: Medida Provisoria no 2.200-2/2001 e Resolucao CFM no 2.299/2021) Tj ET
BT /F1 8 Tf 65 338 Td (Integridade criptografica: Hash SHA-256 e carimbo de tempo gravados no envelope binario.) Tj ET

BT /F1 8 Tf 50 290 Td (Sao Paulo, 12 de Setembro de 2026.) Tj ET

0.8 0.8 0.8 RG
200 240 m 395 240 l S
BT /F2 9 Tf 225 225 Td (Dr. Carlos Eduardo Silva) Tj ET
BT /F1 8 Tf 245 212 Td (CRM 789101/SP) Tj ET
`;

const pdfHeader = buildPdfStream(formalCertificateContent);
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

// 1. Arquivo 01: Válido ICP-Brasil Formatado
fs.writeFileSync(path.join(outDir, '01_atestado_icp_brasil_valido.pdf'), signedPdfBuffer);
console.log('✅ Criado com visual profissional: 01_atestado_icp_brasil_valido.pdf');

// 2. Arquivo 02: Adulterado (Fraude) - Quebra do Hash Criptográfico
const tamperedPdfBuffer = Buffer.from(signedPdfBuffer);
// Alterar byte no corpo do texto para quebrar integridade
const byteIdx = signedPdfBuffer.indexOf(Buffer.from('Afastamento por 05', 'latin1'));
if (byteIdx !== -1) {
  tamperedPdfBuffer[byteIdx + 16] = 0x31; // Altera de 05 para 15 dias!
  tamperedPdfBuffer[byteIdx + 17] = 0x35;
}
fs.writeFileSync(path.join(outDir, '02_atestado_adulterado_fraude.pdf'), tamperedPdfBuffer);
console.log('✅ Criado com fraude de adulteração: 02_atestado_adulterado_fraude.pdf');

// 3. Arquivo 03: Sem Assinatura Digital (PDF visual completo, porém sem certificado digital)
const unsignedContent = `
0.1 0.4 0.8 rg
50 790 495 2 re f
0 0 0 rg

BT /F2 16 Tf 50 765 Td (CONSULTORIO MEDICO DR. PAULO SOUZA) Tj ET
BT /F1 9 Tf 50 750 Td (Clinica Geral e Atendimento Ambulatorial) Tj ET
BT /F1 9 Tf 50 738 Td (Rua das Palmeiras, 300 - Campinas / SP - Tel: (19) 3211-0000) Tj ET

0.8 0.8 0.8 RG
50 720 m 545 720 l S

BT /F2 14 Tf 210 680 Td (DECLARACAO MEDICA) Tj ET

BT /F1 10 Tf 50 620 Td (Declaro para os devidos fins que o colaborador Marcos Antonio compareceu a este consultorio,) Tj ET
BT /F1 10 Tf 50 605 Td (sendo recomendado repouso por 2 dias a partir de hoje.) Tj ET

BT /F1 9 Tf 50 500 Td (Dr. Paulo Souza - CRM 123456/SP) Tj ET
BT /F1 8 Tf 50 480 Td ((Documento impresso em PDF comum, sem assinatura digital ICP-Brasil e-CPF)) Tj ET
`;
const unsignedPdf = buildPdfStream(unsignedContent) + 'trailer\n<< /Root 1 0 R >>\n%%EOF\n';
fs.writeFileSync(path.join(outDir, '03_atestado_sem_assinatura.pdf'), Buffer.from(unsignedPdf, 'latin1'));
console.log('✅ Criado sem assinatura digital: 03_atestado_sem_assinatura.pdf');

// 4. Arquivo 05: Cópia para Duplicidade
fs.copyFileSync(path.join(outDir, '01_atestado_icp_brasil_valido.pdf'), path.join(outDir, '05_atestado_duplicado.pdf'));
console.log('✅ Criado para teste de duplicidade: 05_atestado_duplicado.pdf');

console.log('\n🎉 TODOS OS ARQUIVOS PROFISSIONAIS FORAM REGRAVADOS COM SUCESSO!');
