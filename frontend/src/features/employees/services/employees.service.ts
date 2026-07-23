import { nestFetch } from "@/lib/nestFetch";
import { API_ENDPOINTS } from "@/lib/api-endpoints";
import type { Employee, CreateEmployeeResult } from "../types/employee.types";

export const EmployeesService = {
  async getEmployees(branchId?: string, showInactive = false): Promise<Employee[]> {
    const params = new URLSearchParams();
    if (branchId) params.set("branchId", branchId);
    if (showInactive) params.set("showInactive", "true");
    const res = await nestFetch(API_ENDPOINTS.employees.list(params.toString()));
    if (!res.ok) return [];
    return res.json();
  },

  async createEmployee(values: { branch_id: string; full_name: string; position: string }): Promise<{ ok: boolean; result?: CreateEmployeeResult; error?: string }> {
    const res = await nestFetch(API_ENDPOINTS.employees.base, { method: "POST", body: JSON.stringify(values) });
    if (!res.ok) {
      const data = await res.json();
      return { ok: false, error: data.error };
    }
    return { ok: true, result: await res.json() };
  },

  async updateEmployee(id: string, values: { branch_id: string; full_name: string; position: string }): Promise<{ ok: boolean; error?: string }> {
    const res = await nestFetch(API_ENDPOINTS.employees.byId(id), { method: "PUT", body: JSON.stringify(values) });
    if (!res.ok) {
      const data = await res.json();
      return { ok: false, error: data.error };
    }
    return { ok: true };
  },

  async toggleActive(id: string, is_active: boolean): Promise<{ ok: boolean; error?: string }> {
    const res = await nestFetch(API_ENDPOINTS.employees.byId(id), { method: "PATCH", body: JSON.stringify({ is_active }) });
    if (!res.ok) {
      const data = await res.json();
      return { ok: false, error: data.error };
    }
    return { ok: true };
  },

  async regenerateCredential(id: string): Promise<{ ok: boolean; result?: CreateEmployeeResult; error?: string }> {
    const res = await nestFetch(API_ENDPOINTS.employees.credential(id), { method: "POST" });
    if (!res.ok) {
      const data = await res.json();
      return { ok: false, error: data.error };
    }
    return { ok: true, result: await res.json() };
  },
};
