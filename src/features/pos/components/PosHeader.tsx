"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Button, Tag, Typography } from "antd";
import { LogoutOutlined, ShoppingCartOutlined, UnorderedListOutlined, BarChartOutlined } from "@ant-design/icons";
import { formatTimeBolivia } from "@/lib/timezone";
import type { Identity } from "../types/pos.types";

const { Text } = Typography;

export type PosTab = "sale" | "orders" | "summary";

interface Props {
  identity: Identity;
  activeTab: PosTab;
  pendingCount: number;
  onTabChange: (tab: PosTab) => void;
  onLogout: () => void;
}

export function PosHeader({ identity, activeTab, pendingCount, onTabChange, onLogout }: Props) {
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    const tick = () => setCurrentTime(formatTimeBolivia(new Date()));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  const tabBtn = (tab: PosTab, label: string, icon: React.ReactNode, badge?: number) => (
    <button
      onClick={() => onTabChange(tab)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "6px 16px",
        border: "none",
        borderBottom: activeTab === tab ? "2px solid #ea580c" : "2px solid transparent",
        background: "transparent",
        color: activeTab === tab ? "#ea580c" : "#6b7280",
        fontWeight: activeTab === tab ? 700 : 500,
        fontSize: 14,
        cursor: "pointer",
        transition: "color 0.15s",
        position: "relative",
      }}
    >
      {icon}
      {label}
      {badge != null && badge > 0 && (
        <span style={{ background: "#ef4444", color: "#fff", fontSize: 11, borderRadius: 10, padding: "1px 6px", marginLeft: 2 }}>
          {badge}
        </span>
      )}
    </button>
  );

  return (
    <div style={{ background: "#fff", borderBottom: "1px solid #f0f0f0", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
      {/* Top row */}
      <div style={{ padding: "10px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Image src="/pippo.jpg" alt="Pippo Pizza" width={34} height={34} style={{ borderRadius: "50%", objectFit: "cover" }} />
            <Text strong style={{ fontSize: 16, color: "#ea580c" }}>Pizzería Pippo — POS</Text>
          </div>
          <Tag color="blue" style={{ margin: 0 }}>{identity.name}</Tag>
          {identity.branch_id && <Tag color="green" style={{ margin: 0 }}>Sucursal</Tag>}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Text style={{ fontFamily: "monospace", fontSize: 16, fontWeight: 600, color: "#374151" }}>{currentTime}</Text>
          <Button icon={<LogoutOutlined />} onClick={onLogout}>Salir</Button>
        </div>
      </div>

      {/* Tabs row */}
      <div style={{ display: "flex", paddingLeft: 12, gap: 4, marginTop: -2 }}>
        {tabBtn("sale", "Venta", <ShoppingCartOutlined />)}
        {tabBtn("orders", "Pedidos del día", <UnorderedListOutlined />, pendingCount)}
        {tabBtn("summary", "Resumen", <BarChartOutlined />)}
      </div>
    </div>
  );
}
