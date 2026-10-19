/**
 * Gerador de Payload Pix Copia e Cola (EMV BR Code Estático)
 * Padrão Banco Central do Brasil para recebimento direto no estabelecimento
 */

export interface PixPayloadParams {
  pixKey: string;
  beneficiaryName: string;
  city?: string;
  amount?: number;
  txid?: string;
}

function formatEmvField(id: string, value: string): string {
  const len = value.length.toString().padStart(2, '0');
  return `${id}${len}${value}`;
}

function calculateCRC16(payload: string): string {
  let crc = 0xffff;
  const polynomial = 0x1021;

  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ polynomial) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }

  return crc.toString(16).toUpperCase().padStart(4, '0');
}

export function generatePixCopyPaste(params: PixPayloadParams): string {
  const {
    pixKey,
    beneficiaryName,
    city = 'BRASIL',
    amount,
    txid = '***'
  } = params;

  if (!pixKey) return '';

  // Limpeza de caracteres especiais no nome e cidade para conformidade EMV
  const cleanName = beneficiaryName
    ? beneficiaryName.normalize('NFD').replace(/[\u0300-\u036f]/g, '').slice(0, 25).trim()
    : 'VURIO ESTABELECIMENTO';
  const cleanCity = city
    ? city.normalize('NFD').replace(/[\u0300-\u036f]/g, '').slice(0, 15).trim()
    : 'SAO PAULO';

  // 00: Payload Format Indicator (01)
  const f00 = formatEmvField('00', '01');

  // 26: Merchant Account Information
  const gui = formatEmvField('00', 'BR.GOV.BCB.PIX');
  const key = formatEmvField('01', pixKey.trim());
  const f26 = formatEmvField('26', `${gui}${key}`);

  // 52: Merchant Category Code (0000 = Geral)
  const f52 = formatEmvField('52', '0000');

  // 53: Transaction Currency (986 = Real BRL)
  const f53 = formatEmvField('53', '986');

  // 54: Transaction Amount (opcional se 0)
  let f54 = '';
  if (amount && amount > 0) {
    f54 = formatEmvField('54', amount.toFixed(2));
  }

  // 58: Country Code (BR)
  const f58 = formatEmvField('58', 'BR');

  // 59: Merchant Name
  const f59 = formatEmvField('59', cleanName);

  // 60: Merchant City
  const f60 = formatEmvField('60', cleanCity);

  // 62: Additional Data Field (TXID)
  const f62Data = formatEmvField('05', txid || '***');
  const f62 = formatEmvField('62', f62Data);

  // Montagem preliminar sem CRC
  const rawPayload = `${f00}${f26}${f52}${f53}${f54}${f58}${f59}${f60}${f62}6304`;

  // Cálculo do CRC16
  const crc = calculateCRC16(rawPayload);

  return `${rawPayload}${crc}`;
}
