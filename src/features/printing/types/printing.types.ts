export type PaperWidth = 58 | 80;

export type PrinterStatus =
  | "unsupported"
  | "disconnected"
  | "connecting"
  | "connected";

export interface TicketPrintConfig {
  paperWidth: PaperWidth;
  branchName?: string | null;
}
