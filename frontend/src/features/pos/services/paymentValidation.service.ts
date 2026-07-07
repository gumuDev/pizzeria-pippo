import { io, type Socket } from "socket.io-client";
import { getToken } from "@/lib/auth";
import type { PaymentMatchedPayload } from "../types/payment-validation.types";

const NEST_API_URL = process.env.NEXT_PUBLIC_NEST_API_URL;

type MatchSubscription = { socket: Socket };

export const PaymentValidationService = {
  async start(branchId: string, amount: number): Promise<{ requestId: string }> {
    const token = await getToken();
    const res = await fetch(`${NEST_API_URL}/payment-validation/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ branch_id: branchId, amount }),
    });
    return res.json();
  },

  async reject(requestId: string, notificationId: string): Promise<void> {
    const token = await getToken();
    await fetch(`${NEST_API_URL}/payment-validation/reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ request_id: requestId, notification_id: notificationId }),
    });
  },

  async cancel(requestId: string): Promise<void> {
    const token = await getToken();
    await fetch(`${NEST_API_URL}/payment-validation/cancel`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ request_id: requestId }),
    });
  },

  subscribeToMatch(branchId: string, onMatched: (payload: PaymentMatchedPayload) => void): MatchSubscription {
    const socket: Socket = io(NEST_API_URL, {
      auth: (cb) => { getToken().then((token) => cb({ token })); },
      query: { branchId },
      transports: ["websocket"],
    });
    socket.on("payment:matched", onMatched);
    return { socket };
  },

  unsubscribe(subscription: MatchSubscription) {
    subscription.socket.disconnect();
  },
};
