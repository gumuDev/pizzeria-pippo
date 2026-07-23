import { nestFetch } from "@/lib/nestFetch";
import { API_ENDPOINTS } from "@/lib/api-endpoints";

export interface AttendanceScanResult {
  employee: { full_name: string };
  type: "entrada" | "salida";
  occurred_at: string;
}

export const AttendanceScanService = {
  async scan(payload: { token?: string; manual_code?: string }): Promise<{ ok: boolean; result?: AttendanceScanResult; error?: string }> {
    const res = await nestFetch(API_ENDPOINTS.attendance.scan, { method: "POST", body: JSON.stringify(payload) });
    if (!res.ok) {
      const data = await res.json();
      return { ok: false, error: data.error };
    }
    return { ok: true, result: await res.json() };
  },
};
