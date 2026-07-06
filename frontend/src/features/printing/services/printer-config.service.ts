import { getToken } from "@/lib/auth";
import { DEFAULT_PAPER_WIDTH } from "../constants/printing.constants";
import type { PaperWidth } from "../types/printing.types";

const NEST_API_URL = process.env.NEXT_PUBLIC_NEST_API_URL;

/** Reads the configured paper width. Falls back to the default on any error. */
export async function getPaperWidth(): Promise<PaperWidth> {
  try {
    const res = await fetch(`${NEST_API_URL}/settings/printer`, {
      headers: { Authorization: `Bearer ${await getToken()}` },
    });
    if (!res.ok) return DEFAULT_PAPER_WIDTH;
    const data = await res.json();
    return data.printer_paper_width === 80 ? 80 : 58;
  } catch {
    return DEFAULT_PAPER_WIDTH;
  }
}
