import { nestFetch } from "@/lib/nestFetch";
import { API_ENDPOINTS } from "@/lib/api-endpoints";
import type { AttendanceRecord } from "../types/attendance.types";

export const AttendanceHistoryService = {
  async getHistory(params: { branchId?: string; from?: string; to?: string }): Promise<AttendanceRecord[]> {
    const qs = new URLSearchParams();
    if (params.branchId) qs.set("branchId", params.branchId);
    if (params.from) qs.set("from", params.from);
    if (params.to) qs.set("to", params.to);

    const res = await nestFetch(API_ENDPOINTS.attendance.history(qs.toString()));
    if (!res.ok) return [];
    return res.json();
  },
};
