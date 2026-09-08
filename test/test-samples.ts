import fs from 'fs';
import { validateMedicalAttestation } from '../src/lib/crypto/validator';

async function main() {
  const f1 = fs.readFileSync('test-samples/01_atestado_icp_brasil_valido.pdf');
  const r1 = await validateMedicalAttestation(f1, 'application/pdf', '01_atestado_icp_brasil_valido.pdf');
  console.log('--- ARQUIVO 01 (VÁLIDO) ---');
  console.log('STATUS:', r1.status);
  console.log('IS_AUTHENTIC:', r1.isAuthentic);
  console.log('CALCULATED_SHA:', r1.signature.calculatedSha256);
  console.log('EXPECTED_SHA:  ', r1.signature.expectedSha256);

  const f2 = fs.readFileSync('test-samples/02_atestado_adulterado_fraude.pdf');
  const r2 = await validateMedicalAttestation(f2, 'application/pdf', '02_atestado_adulterado_fraude.pdf');
  console.log('\n--- ARQUIVO 02 (ADULTERADO) ---');
  console.log('STATUS:', r2.status);
  console.log('IS_AUTHENTIC:', r2.isAuthentic);
  console.log('CALCULATED_SHA:', r2.signature.calculatedSha256);
  console.log('EXPECTED_SHA:  ', r2.signature.expectedSha256);
}

main();
