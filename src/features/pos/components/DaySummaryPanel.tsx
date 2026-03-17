"use client";

import { Typography } from "antd";
import {
  ShoppingOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  TeamOutlined,
  ShoppingCartOutlined,
} from "@ant-design/icons";
import type { DayOrder } from "../types/pos.types";

const { Text } = Typography;

interface Props {
  dayOrders: DayOrder[];
}

export function DaySummaryPanel({ dayOrders }: Props) {
  const totalSales = dayOrders.reduce((sum, o) => sum + Number(o.total), 0);
  const pendingCount = dayOrders.filter((o) => o.kitchen_status === "pending").length;
  const readyCount = dayOrders.filter((o) => o.kitchen_status === "ready").length;
  const dineInCount = dayOrders.filter((o) => o.order_type === "dine_in").length;
  const takeawayCount = dayOrders.filter((o) => o.order_type === "takeaway").length;
  const efectivoTotal = dayOrders.filter((o) => o.payment_method === "efectivo").reduce((s, o) => s + Number(o.total), 0);
  const qrTotal = dayOrders.filter((o) => o.payment_method === "qr").reduce((s, o) => s + Number(o.total), 0);

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: 24, background: "#f5f5f5" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <Text strong style={{ fontSize: 16, color: "#374151" }}>Resumen del día</Text>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 12, color: "#9ca3af" }}>Total del día</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: "#ea580c" }}>Bs {totalSales.toFixed(2)}</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
        <SummaryCard
          icon={<ShoppingOutlined style={{ fontSize: 28, color: "#3b82f6" }} />}
          label="Ventas realizadas"
          value={String(dayOrders.length)}
          valueColor="#3b82f6"
        />
        <SummaryCard
          icon={<ClockCircleOutlined style={{ fontSize: 28, color: pendingCount > 0 ? "#f97316" : "#9ca3af" }} />}
          label="Pendientes"
          value={String(pendingCount)}
          valueColor={pendingCount > 0 ? "#f97316" : "#9ca3af"}
        />
        <SummaryCard
          icon={<CheckCircleOutlined style={{ fontSize: 28, color: "#16a34a" }} />}
          label="Listos"
          value={String(readyCount)}
          valueColor="#16a34a"
        />
        <SummaryCard
          icon={<TeamOutlined style={{ fontSize: 28, color: "#8b5cf6" }} />}
          label="🍽️ Local"
          value={String(dineInCount)}
          valueColor="#8b5cf6"
        />
        <SummaryCard
          icon={<ShoppingCartOutlined style={{ fontSize: 28, color: "#0891b2" }} />}
          label="🥡 Para llevar"
          value={String(takeawayCount)}
          valueColor="#0891b2"
        />
        <SummaryCard
          icon={<span style={{ fontSize: 28 }}>💵</span>}
          label="Efectivo"
          value={`Bs ${efectivoTotal.toFixed(2)}`}
          valueColor="#374151"
        />
        <SummaryCard
          icon={<span style={{ fontSize: 28 }}>📱</span>}
          label="QR"
          value={`Bs ${qrTotal.toFixed(2)}`}
          valueColor="#374151"
        />
      </div>
    </div>
  );
}

function SummaryCard({ icon, label, value, valueColor, accent }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  valueColor?: string;
  accent?: boolean;
}) {
  return (
    <div style={{
      background: accent ? "#fff7ed" : "#fff",
      border: `1px solid ${accent ? "#fed7aa" : "#e5e7eb"}`,
      borderRadius: 12,
      padding: "20px 24px",
      display: "flex",
      alignItems: "center",
      gap: 16,
      boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
    }}>
      <div>{icon}</div>
      <div>
        <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 4 }}>{label}</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: valueColor ?? "#374151" }}>{value}</div>
      </div>
    </div>
  );
}
