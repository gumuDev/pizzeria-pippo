"use client";

import { Button, Typography } from "antd";
import { CheckCircleOutlined } from "@ant-design/icons";
import { formatTimeBolivia } from "@/lib/timezone";
import type { DayOrder } from "../types/pos.types";

const { Text } = Typography;

interface Props {
  dayOrders: DayOrder[];
  markingReady: string | null;
  onMarkReady: (orderId: string) => void;
}

export function DayOrdersPanel({ dayOrders, markingReady, onMarkReady }: Props) {
  const totalSales = dayOrders.reduce((sum, o) => sum + Number(o.total), 0);
  const pendingCount = dayOrders.filter((o) => o.kitchen_status === "pending").length;
  const readyCount = dayOrders.filter((o) => o.kitchen_status === "ready").length;
  const dineInCount = dayOrders.filter((o) => o.order_type === "dine_in").length;
  const takeawayCount = dayOrders.filter((o) => o.order_type === "takeaway").length;
  const efectivoTotal = dayOrders.filter((o) => o.payment_method === "efectivo").reduce((s, o) => s + Number(o.total), 0);
  const qrTotal = dayOrders.filter((o) => o.payment_method === "qr").reduce((s, o) => s + Number(o.total), 0);

  return (
    <div style={{ background: "#fff", borderBottom: "1px solid #e5e7eb", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>

      {/* Summary strip */}
      <div style={{ display: "flex", gap: 0, borderBottom: "1px solid #f0f0f0" }}>
        <StatCell label="Total del día" value={`Bs ${totalSales.toFixed(2)}`} valueColor="#ea580c" accent />
        <StatCell label="Ventas" value={String(dayOrders.length)} />
        <StatCell label="Pendientes" value={String(pendingCount)} valueColor={pendingCount > 0 ? "#f97316" : "#6b7280"} />
        <StatCell label="Listos" value={String(readyCount)} valueColor="#16a34a" />
        <StatCell label="🍽️ Local" value={String(dineInCount)} />
        <StatCell label="🥡 Llevar" value={String(takeawayCount)} />
        <StatCell label="💵 Efectivo" value={`Bs ${efectivoTotal.toFixed(2)}`} />
        <StatCell label="📱 QR" value={`Bs ${qrTotal.toFixed(2)}`} last />
      </div>

      {/* Orders list */}
      <div style={{ padding: "10px 16px", maxHeight: 220, overflowY: "auto" }}>
        {dayOrders.length === 0 ? (
          <Text type="secondary" style={{ fontSize: 13 }}>Sin ventas registradas hoy.</Text>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {dayOrders.map((order) => {
              const orderLabel = `#${String(order.daily_number).padStart(2, "0")}`;
              const timeStr = formatTimeBolivia(order.created_at);
              const summary = order.order_items
                .map((i) => `${i.qty}x ${i.product_variants?.products?.name ?? ""} ${i.product_variants?.name ?? ""}`)
                .join(", ");
              const isPending = order.kitchen_status === "pending";

              return (
                <div
                  key={order.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    borderRadius: 8,
                    padding: "7px 12px",
                    fontSize: 13,
                    border: `1px solid ${isPending ? "#fed7aa" : "#e5e7eb"}`,
                    background: isPending ? "#fff7ed" : "#f9fafb",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
                    <Text strong style={{ flexShrink: 0, color: "#6b7280", fontSize: 12 }}>{orderLabel}</Text>
                    <Text type="secondary" style={{ flexShrink: 0, fontSize: 12 }}>{timeStr}</Text>
                    <Text style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, fontSize: 13 }}>{summary}</Text>
                    <Text strong style={{ flexShrink: 0, color: "#ea580c", fontSize: 13 }}>Bs {Number(order.total).toFixed(2)}</Text>
                    <span style={{ flexShrink: 0, fontSize: 12 }}>{order.order_type === "takeaway" ? "🥡" : "🍽️"}</span>
                    <span style={{ flexShrink: 0, fontSize: 12 }}>
                      {order.payment_method === "efectivo" ? "💵" : order.payment_method === "qr" ? "📱" : "—"}
                    </span>
                  </div>
                  <div style={{ marginLeft: 10, flexShrink: 0 }}>
                    {isPending ? (
                      <Button
                        size="small"
                        type="primary"
                        icon={<CheckCircleOutlined />}
                        loading={markingReady === order.id}
                        onClick={() => onMarkReady(order.id)}
                      >
                        Marcar listo
                      </Button>
                    ) : (
                      <span style={{ color: "#16a34a", fontWeight: 600, fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}>
                        <CheckCircleOutlined /> Listo
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCell({ label, value, valueColor, accent, last }: {
  label: string;
  value: string;
  valueColor?: string;
  accent?: boolean;
  last?: boolean;
}) {
  return (
    <div style={{
      flex: accent ? "1.5" : "1",
      padding: "10px 14px",
      borderRight: last ? "none" : "1px solid #f0f0f0",
      background: accent ? "#fff7ed" : "#fff",
      textAlign: "center",
    }}>
      <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 2, whiteSpace: "nowrap" }}>{label}</div>
      <div style={{ fontSize: accent ? 16 : 14, fontWeight: 700, color: valueColor ?? "#374151" }}>{value}</div>
    </div>
  );
}
