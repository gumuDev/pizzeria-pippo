// Single source of truth for online payment providers — add a new provider
// here (e.g. when the payment gateway launches) and every report/POS screen
// that displays payment_provider picks it up automatically.
export const PAYMENT_PROVIDERS = {
  pedidos_ya: { label: "PedidosYa", emoji: "🌐" },
} as const;

export type PaymentProvider = keyof typeof PAYMENT_PROVIDERS;
