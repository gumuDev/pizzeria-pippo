import * as QRCode from 'qrcode';

export function generateQrDataUrl(content: string): Promise<string> {
  return QRCode.toDataURL(content);
}
