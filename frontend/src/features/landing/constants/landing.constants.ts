// Bolivia country code prefix — required for wa.me links to work from any device.
// Used only as a fallback when no branch has a phone number registered yet.
export const WHATSAPP_NUMBER = "59167106933";
export const CONTACT_EMAIL = "pippopizzabolivia@gmail.com";
export const FACEBOOK_URL = "https://www.facebook.com/pippopizzabolivia";
export const TIKTOK_URL = "https://www.tiktok.com/@pippo.bolivia";

// Normalizes a branch phone (as typed by the admin, with or without the "591"
// country code) into the digits-only format wa.me links require — also used
// for display so the footer always shows the country code, even if the
// branch phone was entered without it.
export function toWhatsAppDigits(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return digits.startsWith("591") ? digits : `591${digits}`;
}

export function buildWhatsAppOrderLink(pizzaName: string, phone: string = WHATSAPP_NUMBER): string {
  const message = `Hola! Quiero pedir la pizza ${pizzaName}`;
  return `https://wa.me/${toWhatsAppDigits(phone)}?text=${encodeURIComponent(message)}`;
}

export function buildWhatsAppGeneralLink(phone: string = WHATSAPP_NUMBER): string {
  const message = "Hola! Quiero hacer un pedido";
  return `https://wa.me/${toWhatsAppDigits(phone)}?text=${encodeURIComponent(message)}`;
}
