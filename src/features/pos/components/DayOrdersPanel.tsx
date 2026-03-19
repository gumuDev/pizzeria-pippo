"use client";

import { Button, Empty, Tag, Typography } from "antd";
import { CheckCircleOutlined, StopOutlined } from "@ant-design/icons";
import { formatTimeBolivia } from "@/lib/timezone";
import type { DayOrder } from "../types/pos.types";

const { Text } = Typography;

interface Props {
  dayOrders: DayOrder[];
  markingReady: string | null;
  onMarkReady: (orderId: string) => void;
  onCancel: (order: DayOrder) => void;
}

export function DayOrdersPanel({ dayOrders, markingReady, onMarkReady, onCancel }: Props) {
  return (
    <div style={{ flex: 1, overflowY: "auto", padding: 24, background: "#f5f5f5" }}>
      <Text strong style={{ fontSize: 16, color: "#374151", display: "block", marginBottom: 16 }}>
        Pedidos del día ({dayOrders.length})
      </Text>

      {dayOrders.length === 0 ? (
        <Empty description="Sin ventas registradas hoy." style={{ marginTop: 60 }} />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {dayOrders.map((order) => {
            const orderLabel = `#${String(order.daily_number).padStart(2, "0")}`;
            const timeStr = formatTimeBolivia(order.created_at);
            const summary = order.order_items
              .map((i) => `${i.qty}x ${i.product_variants?.products?.name ?? ""} ${i.product_variants?.name ?? ""}`)
              .join(", ");
            const isPending = order.kitchen_status === "pending";
            const isCancelled = order.cancelled_at !== null;

            return (
              <div
                key={order.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  borderRadius: 10,
                  padding: "10px 16px",
                  fontSize: 13,
                  border: `1px solid ${isCancelled ? "#e5e7eb" : isPending ? "#fed7aa" : "#e5e7eb"}`,
                  background: isCancelled ? "#f3f4f6" : isPending ? "#fff7ed" : "#fff",
                  opacity: isCancelled ? 0.6 : 1,
                  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0 }}>
                  <Text strong style={{ flexShrink: 0, color: "#374151", fontSize: 14 }}>{orderLabel}</Text>
                  <Text type="secondary" style={{ flexShrink: 0, fontSize: 12 }}>{timeStr}</Text>
                  <Text style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, fontSize: 13, color: "#6b7280" }}>{summary}</Text>
                  <Text strong style={{ flexShrink: 0, color: "#ea580c", fontSize: 14 }}>Bs {Number(order.total).toFixed(2)}</Text>
                  <Tag
                    color={order.order_type === "takeaway" ? "blue" : "green"}
                    style={{ flexShrink: 0, margin: 0 }}
                  >
                    {order.order_type === "takeaway" ? "🥡 Para llevar" : "🍽️ Local"}
                  </Tag>
                  <span style={{ flexShrink: 0, fontSize: 14 }}>
                    {order.payment_method === "efectivo" ? "💵" : order.payment_method === "qr" ? "📱" : "—"}
                  </span>
                </div>
                <div style={{ marginLeft: 12, flexShrink: 0, display: "flex", gap: 8, alignItems: "center" }}>
                  {isCancelled ? (
                    <Tag color="red" icon={<StopOutlined />}>Anulada</Tag>
                  ) : isPending ? (
                    <>
                      <Button
                        size="small"
                        type="primary"
                        icon={<CheckCircleOutlined />}
                        loading={markingReady === order.id}
                        onClick={() => onMarkReady(order.id)}
                        style={{ background: "#ea580c", borderColor: "#ea580c" }}
                      >
                        Marcar listo
                      </Button>
                      <Button
                        size="small"
                        danger
                        ghost
                        icon={<StopOutlined />}
                        onClick={() => onCancel(order)}
                      >
                        Anular
                      </Button>
                    </>
                  ) : (
                    <>
                      <span style={{ color: "#16a34a", fontWeight: 600, fontSize: 13, display: "flex", alignItems: "center", gap: 4 }}>
                        <CheckCircleOutlined /> Listo
                      </span>
                      <Button
                        size="small"
                        danger
                        ghost
                        icon={<StopOutlined />}
                        onClick={() => onCancel(order)}
                      >
                        Anular
                      </Button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
