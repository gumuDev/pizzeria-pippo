"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PaymentValidationService } from "../services/paymentValidation.service";
import type { PaymentMatchedPayload, PaymentValidationState } from "../types/payment-validation.types";

// Mirrors the backend's PAYMENT_VALIDATION_WINDOW_MINUTES default so the
// cashier sees the manual fallback appear right around when the backend
// would stop matching anyway.
const TIMEOUT_MS = 5 * 60 * 1000;

export function usePaymentValidation(branchId: string | undefined) {
  const [state, setState] = useState<PaymentValidationState>({ status: "idle" });
  const subscriptionRef = useRef<ReturnType<typeof PaymentValidationService.subscribeToMatch> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cleanup = useCallback(() => {
    if (subscriptionRef.current) {
      PaymentValidationService.unsubscribe(subscriptionRef.current);
      subscriptionRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  useEffect(() => cleanup, [cleanup]);

  const start = useCallback(async (amount: number) => {
    if (!branchId) return;
    cleanup();

    const { requestId } = await PaymentValidationService.start(branchId, amount);
    setState({ status: "waiting", requestId });

    subscriptionRef.current = PaymentValidationService.subscribeToMatch(branchId, (payload: PaymentMatchedPayload) => {
      if (payload.requestId !== requestId) return;
      setState({
        status: "matched",
        requestId,
        notificationId: payload.notificationId,
        payerName: payload.payerName,
        amount: payload.amount,
      });
    });

    timeoutRef.current = setTimeout(() => {
      setState((current) => (current.status === "idle" ? current : { status: "timedOut", requestId }));
    }, TIMEOUT_MS);
  }, [branchId, cleanup]);

  const rejectMatch = useCallback(() => {
    if (state.status !== "matched") return;
    PaymentValidationService.reject(state.requestId, state.notificationId);
    setState({ status: "waiting", requestId: state.requestId });
  }, [state]);

  const cancel = useCallback(() => {
    if (state.status !== "idle") {
      PaymentValidationService.cancel(state.requestId);
    }
    cleanup();
    setState({ status: "idle" });
  }, [state, cleanup]);

  return { state, start, rejectMatch, cancel };
}
