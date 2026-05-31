"use client";

import Image from "next/image";
import { useDisplay } from "@/features/display/hooks/useDisplay";
import { DisplayMenu } from "@/features/display/components/DisplayMenu";
import { DisplayCart } from "@/features/display/components/DisplayCart";
import { DisplayThankYou } from "@/features/display/components/DisplayThankYou";
import { useBusinessConfigPublic } from "@/features/business-config/hooks/useBusinessConfigPublic";

export default function DisplayPage() {
  const { mode, cartItems, cartTotal, orderType, products, menuPage } = useDisplay();
  const { config } = useBusinessConfigPublic();

  return (
    <div style={{ height: "100vh", width: "100vw", overflow: "hidden", background: "#030712", color: "#fff", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 32px", background: config.business_primary_color, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {config.business_logo_url ? (
            <Image
              src={config.business_logo_url}
              alt={config.business_name}
              width={44}
              height={44}
              style={{ borderRadius: "50%", objectFit: "contain", background: "rgba(255,255,255,0.15)", padding: 4, flexShrink: 0 }}
            />
          ) : (
            <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(255,255,255,0.2)", flexShrink: 0 }} />
          )}
          <span style={{ fontSize: 26, fontWeight: 800, letterSpacing: "0.02em" }}>{config.business_name || "Mi Negocio"}</span>
        </div>
        <span style={{ color: "#fed7aa", fontSize: 16 }}>
          {mode === "order"
            ? orderType === "takeaway" ? "🥡 Pedido para llevar" : "🍽️ Pedido para comer aquí"
            : mode === "thanks" ? ""
            : "Nuestro menú"}
        </span>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        {mode === "thanks" && <DisplayThankYou />}
        {mode === "order" && <DisplayCart cartItems={cartItems} cartTotal={cartTotal} />}
        {mode === "menu" && <DisplayMenu products={products} menuPage={menuPage} />}
      </div>
    </div>
  );
}
