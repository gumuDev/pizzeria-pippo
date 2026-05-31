"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";
import { BusinessConfig } from "../types/business-config.types";

interface Props {
  config: BusinessConfig;
}

export function OnboardingStep3({ config }: Props) {
  const tc = useTranslations("businessConfig");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, alignItems: "center" }}>
      <div
        style={{
          background: config.business_primary_color,
          borderRadius: 12,
          padding: "24px 48px",
          display: "flex",
          alignItems: "center",
          gap: 16,
          minWidth: 300,
        }}
      >
        {config.business_logo_url ? (
          <Image
            src={config.business_logo_url}
            alt="Logo"
            width={48}
            height={48}
            style={{ objectFit: "contain", borderRadius: 8, background: "white", padding: 4 }}
          />
        ) : (
          <div style={{ width: 48, height: 48, background: "rgba(255,255,255,0.3)", borderRadius: 8 }} />
        )}
        <span style={{ color: "white", fontWeight: 700, fontSize: 20 }}>
          {config.business_name || "Mi Negocio"}
        </span>
      </div>

      <div style={{ background: "#f9fafb", borderRadius: 8, padding: 16, width: "100%", maxWidth: 400 }}>
        <div style={{ fontWeight: 600, marginBottom: 8, color: "#374151" }}>Configuración guardada</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4, color: "#6b7280", fontSize: 14 }}>
          <div><b>Nombre:</b> {config.business_name}</div>
          <div><b>{tc("businessType")}:</b> {tc(`types.${config.business_type}`)}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <b>{tc("primaryColor")}:</b>
            <span
              style={{
                display: "inline-block",
                width: 16,
                height: 16,
                background: config.business_primary_color,
                borderRadius: 3,
                border: "1px solid #e5e7eb",
              }}
            />
            {config.business_primary_color}
          </div>
        </div>
      </div>
    </div>
  );
}
