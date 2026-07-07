export interface PaymentMatchedPayload {
  requestId: string;
  notificationId: string;
  amount: number;
  payerName: string;
  rawText: string;
}

export type PaymentValidationState =
  | { status: "idle" }
  | { status: "waiting"; requestId: string }
  | { status: "matched"; requestId: string; notificationId: string; payerName: string; amount: number }
  | { status: "timedOut"; requestId: string };
