import { io, type Socket } from "socket.io-client";
import { getToken } from "@/lib/auth";
import { nestFetch } from "@/lib/nestFetch";
import { API_ENDPOINTS } from "@/lib/api-endpoints";
import type { PaymentMatchedPayload } from "../types/payment-validation.types";

const NEST_API_URL = process.env.NEXT_PUBLIC_NEST_API_URL;

type MatchSubscription = { socket: Socket };

export const PaymentValidationService = {
  async start(branchId: string, amount: number): Promise<{ requestId: string }> {
    const res = await nestFetch(API_ENDPOINTS.paymentValidation.start, {
      method: "POST",
      body: JSON.stringify({ branch_id: branchId, amount }),
    });
    return res.json();
  },

  async reject(requestId: string, notificationId: string): Promise<void> {
    await nestFetch(API_ENDPOINTS.paymentValidation.reject, {
      method: "POST",
      body: JSON.stringify({ request_id: requestId, notification_id: notificationId }),
    });
  },

  async cancel(requestId: string): Promise<void> {
    await nestFetch(API_ENDPOINTS.paymentValidation.cancel, {
      method: "POST",
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
