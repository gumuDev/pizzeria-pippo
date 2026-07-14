import { nestFetch } from "@/lib/nestFetch";
import { API_ENDPOINTS } from "@/lib/api-endpoints";
import { DEFAULT_PAPER_WIDTH } from "../constants/printing.constants";
import type { PaperWidth } from "../types/printing.types";

/** Reads the configured paper width. Falls back to the default on any error. */
export async function getPaperWidth(): Promise<PaperWidth> {
  try {
    const res = await nestFetch(API_ENDPOINTS.settings.printer);
    if (!res.ok) return DEFAULT_PAPER_WIDTH;
    const data = await res.json();
    return data.printer_paper_width === 80 ? 80 : 58;
  } catch {
    return DEFAULT_PAPER_WIDTH;
  }
}
