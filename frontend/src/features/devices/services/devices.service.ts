import { nestFetch } from "@/lib/nestFetch";
import { API_ENDPOINTS } from "@/lib/api-endpoints";
import type { Device, CreateDeviceResult } from "../types/device.types";

export const DevicesService = {
  async getDevices(): Promise<Device[]> {
    const res = await nestFetch(API_ENDPOINTS.devices.base);
    if (!res.ok) return [];
    return res.json();
  },

  async createDevice(values: { branch_id: string; name: string }): Promise<{ ok: boolean; result?: CreateDeviceResult; error?: string }> {
    const res = await nestFetch(API_ENDPOINTS.devices.base, { method: "POST", body: JSON.stringify(values) });
    if (!res.ok) {
      const data = await res.json();
      return { ok: false, error: data.error };
    }
    return { ok: true, result: await res.json() };
  },

  async updateDevice(id: string, values: { name?: string; is_active?: boolean }): Promise<{ ok: boolean; error?: string }> {
    const res = await nestFetch(API_ENDPOINTS.devices.byId(id), { method: "PATCH", body: JSON.stringify(values) });
    if (!res.ok) {
      const data = await res.json();
      return { ok: false, error: data.error };
    }
    return { ok: true };
  },
};
