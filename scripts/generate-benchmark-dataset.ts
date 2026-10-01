import fs from 'fs';
import path from 'path';
import * as forge from 'node-forge';

const DATASET_DIR = path.join(process.cwd(), 'benchmark-dataset');

if (!fs.existsSync(DATASET_DIR)) {
  fs.mkdirSync(DATASET_DIR, { recursive: true });
}

interface BenchmarkItem {
  id: string;
  category: string;
  filename: string;
  expectedStatus: string;
  description: string;
}

const manifest: BenchmarkItem[] = [];

// Helper para assinar PDF simulado
function createSignedPdf(
  doctorName: string,
  crm: string,
  uf: string,
  days: number,
  startDate: string,
  tamper: boolean = false
): Buffer {
  const keys = forge.pki.rsa.generateKeyPair(1024);
  const cert = forge.pki.createCertificate();
  cert.publicKey = keys.publicKey;
  cert.serialNumber = Math.floor(Math.random() * 1000000).toString();
  cert.validity.notBefore = new Date();
  cert.validity.notAfter = new Date();
  cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1);

  cert.setSubject([
    { name: 'commonName', value: `DR. ${doctorName}:12345678901` },
    { name: 'countryName', value: 'BR' },
    { shortName: 'OU', value: 'Certificado ICP-Brasil' },
    { name: 'organizationName', value: 'Conselho Federal de Medicina' }
  ]);

  cert.setIssuer([
    { name: 'commonName', value: 'AC SOLUTI Multipla v5' },
    { name: 'countryName', value: 'BR' },
    { shortName: 'OU', value: 'Autoridade Certificadora Raiz Brasileira ICP-Brasil' },
    { name: 'organizationName', value: 'Soluti Certificacao Digital' }
  ]);

  cert.sign(keys.privateKey, forge.md.sha256.create());

  const cleanDays = days.toString().padStart(2, '0');
  const pdfHeader = `%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /Contents 4 0 R >>\nendobj\n4 0 obj\n<< /Length 210 >>\nstream\nBT /F1 12 Tf 50 750 Td (CLINICA MEDICA CENTRAL - ATESTADO MEDICO OFICIAL) Tj ET\nBT /F1 11 Tf 50 700 Td (Atesto que o paciente esteve em consulta medica. Afastamento por ${cleanDays} dias iniciando em ${startDate}.) Tj ET\nBT /F1 10 Tf 50 650 Td (Medico: Dr. ${doctorName} - CRM ${crm}/${uf} - Assinatura ICP-Brasil) Tj ET\nendstream\nendobj\n`;
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
  const der = forge.asn1.toDer(p7.toAsn1()).getBytes();
  const hexSig = Buffer.from(der, 'binary').toString('hex');
  const paddedHex = hexSig.padEnd(reservedHexLength, '0');

  let fullPdf = Buffer.concat([
    finalPart1,
    Buffer.from(paddedHex, 'latin1'),
    endPart
  ]);

  if (tamper) {
    const tamperStr = fullPdf.toString('latin1');
    const modifiedStr = tamperStr.replace(`Afastamento por ${cleanDays}`, `Afastamento por 99`);
    fullPdf = Buffer.from(modifiedStr, 'latin1');
  }

  return fullPdf;
}

// Helper para PDF não assinado
function createUnsignedPdf(doctorName: string, crm: string, uf: string, days: number, startDate: string): Buffer {
  const streamBody = `BT /F1 12 Tf 50 750 Td (CONSULTORIO MEDICO SANTA CLARA - ATESTADO MEDICO) Tj ET\nBT /F1 11 Tf 50 710 Td (Declaro para os devidos fins que o colaborador necessita de ${days} dias de repouso.) Tj ET\nBT /F1 11 Tf 50 670 Td (Periodo com inicio a partir de ${startDate}. CID J00.) Tj ET\nBT /F1 10 Tf 50 630 Td (Dr(a). ${doctorName} - CRM ${crm}/${uf}) Tj ET\n`;
  const streamLen = Buffer.from(streamBody, 'latin1').length;
  const content = `%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /Contents 4 0 R >>\nendobj\n4 0 obj\n<< /Length ${streamLen} >>\nstream\n${streamBody}endstream\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF`;
  return Buffer.from(content, 'latin1');
}

// Helper para Documento Não Médico (Contratos, Holerites, etc.)
function createNonMedicalPdf(title: string, bodyText: string): Buffer {
  const streamBody = `BT /F1 14 Tf 50 750 Td (${title}) Tj ET\nBT /F1 10 Tf 50 700 Td (${bodyText}) Tj ET\nBT /F1 9 Tf 50 650 Td (Documento registrado para efeitos comerciais e financeiros. Sem carater de saude.) Tj ET\n`;
  const streamLen = Buffer.from(streamBody, 'latin1').length;
  const content = `%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /Contents 4 0 R >>\nendobj\n4 0 obj\n<< /Length ${streamLen} >>\nstream\n${streamBody}endstream\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF`;
  return Buffer.from(content, 'latin1');
}

async function main() {
  console.log('⚡ Gerando Dataset Sintético de Benchmark (100 Amostras)...');

  let count = 0;

  // 1. Categoria: PDF ICP-Brasil Autêntico (25 arquivos)
  const doctors = [
    { name: 'CARLOS EDUARDO SILVA', crm: '789101', uf: 'SP' },
    { name: 'PAULO SOUZA', crm: '123456', uf: 'SP' },
    { name: 'MARIANA COSTA FERREIRA', crm: '998877', uf: 'RJ' },
    { name: 'FERNANDA LIMA ALCANTARA', crm: '112233', uf: 'BA' }
  ];

  for (let i = 1; i <= 25; i++) {
    count++;
    const doc = doctors[i % doctors.length];
    const days = (i % 7) + 1;
    const buf = createSignedPdf(doc.name, doc.crm, doc.uf, days, '15/09/2026', false);
    const filename = `cat1_icp_valido_${i.toString().padStart(2, '0')}.pdf`;
    fs.writeFileSync(path.join(DATASET_DIR, filename), buf);
    manifest.push({
      id: `BM-${count.toString().padStart(3, '0')}`,
      category: '1. ICP-Brasil Válido',
      filename,
      expectedStatus: 'VALID_INTACT',
      description: `Atestado PDF assinado com PAdES íntegro (Dr. ${doc.name} - CRM ${doc.crm}/${doc.uf})`
    });
  }

  // 2. Categoria: PDF Adulterado / Fraude (15 arquivos)
  for (let i = 1; i <= 15; i++) {
    count++;
    const doc = doctors[i % doctors.length];
    const buf = createSignedPdf(doc.name, doc.crm, doc.uf, 3, '15/09/2026', true);
    const filename = `cat2_adulterado_${i.toString().padStart(2, '0')}.pdf`;
    fs.writeFileSync(path.join(DATASET_DIR, filename), buf);
    manifest.push({
      id: `BM-${count.toString().padStart(3, '0')}`,
      category: '2. PDF Adulterado (Fraude)',
      filename,
      expectedStatus: 'TAMPERED',
      description: `Assinatura válida violada cirurgicamente no texto (hash SHA-256 diverge)`
    });
  }

  // 3. Categoria: PDF Sem Assinatura Digital (20 arquivos)
  for (let i = 1; i <= 20; i++) {
    count++;
    const doc = doctors[i % doctors.length];
    const days = (i % 5) + 2;
    const buf = createUnsignedPdf(doc.name, doc.crm, doc.uf, days, '10/09/2026');
    const filename = `cat3_sem_assinatura_${i.toString().padStart(2, '0')}.pdf`;
    fs.writeFileSync(path.join(DATASET_DIR, filename), buf);
    manifest.push({
      id: `BM-${count.toString().padStart(3, '0')}`,
      category: '3. PDF Sem Assinatura',
      filename,
      expectedStatus: 'NO_DIGITAL_SIGNATURE',
      description: `Atestado médico em PDF gerado por sistema clínico comum sem e-CPF`
    });
  }

  // 4. Categoria: Fotos de Papel Físico / QR Code (5 arquivos)
  const samplePhoto = fs.readFileSync(path.join(process.cwd(), 'test-samples', '04_foto_atestado_papel.jpg'));
  for (let i = 1; i <= 5; i++) {
    count++;
    const filename = `cat4_foto_papel_${i.toString().padStart(2, '0')}.jpg`;
    fs.writeFileSync(path.join(DATASET_DIR, filename), samplePhoto);
    manifest.push({
      id: `BM-${count.toString().padStart(3, '0')}`,
      category: '4. Foto de Atestado Físico',
      filename,
      expectedStatus: 'PHOTO_MANUAL_PAPER',
      description: `Foto de receituário físico em papel para triagem pericial via Gemini Vision`
    });
  }

  // 5. Categoria: Inconsistências CFM / Datas / Regras (15 arquivos)
  const problemDoctors = [
    { name: 'LUCAS HENRIQUE OLIVEIRA', crm: '445566', uf: 'MG', problem: 'CRM Suspenso no CFM' },
    { name: 'GABRIEL RIBEIRO NEVES', crm: '334455', uf: 'RS', problem: 'CRM Cancelado no CFM' }
  ];

  for (let i = 1; i <= 15; i++) {
    count++;
    const prob = problemDoctors[i % problemDoctors.length];
    const isFuture = i % 2 === 0;
    const startDate = isFuture ? '25/12/2026' : '15/09/2026';
    const buf = createUnsignedPdf(prob.name, prob.crm, prob.uf, 5, startDate);
    const filename = `cat5_inconsistencia_${i.toString().padStart(2, '0')}.pdf`;
    fs.writeFileSync(path.join(DATASET_DIR, filename), buf);
    manifest.push({
      id: `BM-${count.toString().padStart(3, '0')}`,
      category: '5. Inconsistência CFM/Data',
      filename,
      expectedStatus: 'NO_DIGITAL_SIGNATURE',
      description: `${prob.problem} / ${isFuture ? 'Atestado pre-datado para o futuro' : 'Prazo regular'}`
    });
  }

  // 6. Categoria: Documentos Duplicados (10 arquivos)
  for (let i = 1; i <= 10; i++) {
    count++;
    const sourceFile = `cat1_icp_valido_${i.toString().padStart(2, '0')}.pdf`;
    const sourceBuf = fs.readFileSync(path.join(DATASET_DIR, sourceFile));
    const filename = `cat6_duplicado_reenvio_${i.toString().padStart(2, '0')}.pdf`;
    fs.writeFileSync(path.join(DATASET_DIR, filename), sourceBuf);
    manifest.push({
      id: `BM-${count.toString().padStart(3, '0')}`,
      category: '6. Trava de Duplicidade',
      filename,
      expectedStatus: 'DUPLICATE_DOCUMENT',
      description: `Reenvio do mesmo arquivo para validar trava antifraude por SHA-256`
    });
  }

  // 7. Categoria: Controle Negativo - Documentos Não Médicos (10 arquivos)
  const nonMedicalExamples = [
    { title: 'CONTRATO DE PRESTACAO DE SERVICOS', body: 'As partes contratam o servico de integracao de CRM 2024 para vendas.' },
    { title: 'DEMONSTRATIVO DE PAGAMENTO - HOLERITE', body: 'Referencia mes 08/2026. Vencimentos e descontos do empregado.' },
    { title: 'NOTA FISCAL DE SERVICOS ELETRONICA', body: 'Prestacao de consultoria de marketing e gestao de software CRM.' },
    { title: 'COMPROVANTE DE TRANSFERENCIA PIX', body: 'Transferencia realizada com sucesso para conta corrente comercial.' },
    { title: 'RELATORIO MENSAL DE METAS E VENDAS', body: 'Modulo CRM ativo com 45 novas oportunidades fechadas no periodo.' }
  ];

  for (let i = 1; i <= 10; i++) {
    count++;
    const item = nonMedicalExamples[i % nonMedicalExamples.length];
    const buf = createNonMedicalPdf(item.title, item.body);
    const filename = `cat7_nao_medico_${i.toString().padStart(2, '0')}.pdf`;
    fs.writeFileSync(path.join(DATASET_DIR, filename), buf);
    manifest.push({
      id: `BM-${count.toString().padStart(3, '0')}`,
      category: '7. Controle Não Médico',
      filename,
      expectedStatus: 'NOT_AN_ATTESTATION',
      description: `Documento corporativo comum (${item.title}) contendo siglas comerciais`
    });
  }

  fs.writeFileSync(
    path.join(DATASET_DIR, 'manifest.json'),
    JSON.stringify(manifest, null, 2)
  );

  console.log(`✅ Dataset gerado com sucesso! Total de arquivos: ${manifest.length}`);
  console.log(`📁 Local: ${DATASET_DIR}`);
}

main().catch(console.error);
