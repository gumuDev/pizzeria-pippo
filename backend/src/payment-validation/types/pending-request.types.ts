export interface PendingPaymentRequest {
  id: string;
  branchId: string;
  cashierId: string;
  amount: number;
  createdAt: number;
  rejectedNotificationIds: Set<string>;
  // Set once a notification matches; while set, this request is "busy" showing
  // a candidate to the cashier and must not be matched again by a new
  // notification (that one should go to the next request in line instead).
  // Cleared by reject() so the request becomes matchable again.
  matchedNotificationId: string | null;
}

export interface BufferedNotification {
  id: string;
  amount: number;
  payerName: string;
  rawText: string;
  receivedAt: number;
}
