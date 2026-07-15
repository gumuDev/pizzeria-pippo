// Bolivia country code prefix — required for wa.me links to work from any device.
export const WHATSAPP_NUMBER = "59167106933";
export const CONTACT_EMAIL = "pippopizzabolivia@gmail.com";
export const FACEBOOK_URL = "https://www.facebook.com/pippopizzabolivia";
export const TIKTOK_URL = "https://www.tiktok.com/@pippo.bolivia";

export function buildWhatsAppOrderLink(pizzaName: string): string {
  const message = `Hola! Quiero pedir la pizza ${pizzaName}`;
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

export function buildWhatsAppGeneralLink(): string {
  const message = "Hola! Quiero hacer un pedido";
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
