export type BusinessType = "pizzeria" | "snack" | "store" | "other";

export interface BusinessConfig {
  business_name: string;
  business_type: BusinessType;
  business_logo_url: string;
  business_primary_color: string;
}

export const DEFAULT_CONFIG: BusinessConfig = {
  business_name: "",
  business_type: "other",
  business_logo_url: "",
  business_primary_color: "#f97316",
};
