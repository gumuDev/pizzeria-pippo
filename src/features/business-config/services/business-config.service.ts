import { BusinessConfig } from "../types/business-config.types";

export async function getBusinessConfig(token: string): Promise<BusinessConfig> {
  const res = await fetch("/api/settings/business", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to load business config");
  return res.json();
}

export async function saveBusinessConfig(token: string, config: Partial<BusinessConfig>): Promise<void> {
  const res = await fetch("/api/settings/business", {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(config),
  });
  if (!res.ok) throw new Error("Failed to save business config");
}

export async function uploadLogo(token: string, file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch("/api/settings/business/logo", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  if (!res.ok) throw new Error("Failed to upload logo");
  const { url } = await res.json();
  return url;
}

export async function getBusinessConfigPublic(): Promise<BusinessConfig> {
  const res = await fetch("/api/settings/business/public");
  if (!res.ok) throw new Error("Failed to load business config");
  return res.json();
}
