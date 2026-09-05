import jsQR from 'jsqr';
import jpeg from 'jpeg-js';
import { PNG } from 'pngjs';

export interface QrScanResult {
  hasQrCode: boolean;
  qrData: string | null;
  issuerType?: 'CFM' | 'MEMED' | 'ITI_GOV' | 'GENERIC_URL' | 'TEXT';
  isValidIssuerUrl?: boolean;
}

/**
 * Escaneia um buffer de imagem (JPEG ou PNG) em busca de QR Codes (ex: atestados impressos do CFM, Memed, etc).
 */
export async function scanQrCodeFromImageBuffer(imageBuffer: Buffer): Promise<QrScanResult> {
  try {
    let width = 0;
    let height = 0;
    let data: Uint8ClampedArray | Uint8Array | null = null;

    // Detectar JPEG (FF D8 FF)
    if (imageBuffer.length >= 3 && imageBuffer[0] === 0xff && imageBuffer[1] === 0xd8 && imageBuffer[2] === 0xff) {
      const decodedJpeg = jpeg.decode(imageBuffer, { useTArray: true });
      width = decodedJpeg.width;
      height = decodedJpeg.height;
      data = decodedJpeg.data;
    } else {
      // Tentar PNG
      try {
        const png = PNG.sync.read(imageBuffer);
        width = png.width;
        height = png.height;
        data = png.data;
      } catch {
        // Formato não decodificável como JPEG ou PNG direto
        return { hasQrCode: false, qrData: null };
      }
    }

    if (!data || width === 0 || height === 0) {
      return { hasQrCode: false, qrData: null };
    }

    const clampedArray = new Uint8ClampedArray(data.buffer, data.byteOffset, data.byteLength);
    const code = jsQR(clampedArray, width, height);

    if (!code || !code.data) {
      return { hasQrCode: false, qrData: null };
    }

    const qrData = code.data.trim();
    const issuerInfo = categorizeQrIssuer(qrData);

    return {
      hasQrCode: true,
      qrData,
      issuerType: issuerInfo.issuerType,
      isValidIssuerUrl: issuerInfo.isValidIssuerUrl
    };
  } catch (err) {
    return { hasQrCode: false, qrData: null };
  }
}

/**
 * Analisa se a URL do QR Code pertence a um emissor oficial reconhecido
 */
function categorizeQrIssuer(urlOrText: string): { issuerType: QrScanResult['issuerType']; isValidIssuerUrl: boolean } {
  const lower = urlOrText.toLowerCase();

  if (lower.includes('cfm.org.br') || lower.includes('prescricaoeletronica.cfm')) {
    return { issuerType: 'CFM', isValidIssuerUrl: true };
  }
  if (lower.includes('memed.com.br') || lower.includes('memed.app')) {
    return { issuerType: 'MEMED', isValidIssuerUrl: true };
  }
  if (lower.includes('validar.iti.gov.br') || lower.includes('iti.gov.br')) {
    return { issuerType: 'ITI_GOV', isValidIssuerUrl: true };
  }
  if (lower.startsWith('http://') || lower.startsWith('https://')) {
    return { issuerType: 'GENERIC_URL', isValidIssuerUrl: true };
  }

  return { issuerType: 'TEXT', isValidIssuerUrl: false };
}
