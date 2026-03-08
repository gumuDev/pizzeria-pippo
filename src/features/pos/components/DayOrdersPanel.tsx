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
  return (
    <div className="bg-white border-b shadow-inner px-4 py-3 max-h-64 overflow-y-auto">
      <div className="flex items-center justify-between mb-2">
        <Text strong>Pedidos de hoy ({dayOrders.length})</Text>
        <Text type="secondary" className="text-xs">
          {dayOrders.filter((o) => o.kitchen_status === "pending").length} pendientes ·{" "}
          {dayOrders.filter((o) => o.kitchen_status === "ready").length} listos
        </Text>
      </div>
      {dayOrders.length === 0 ? (
        <Text type="secondary" className="text-sm">Sin ventas registradas hoy.</Text>
      ) : (
        <div className="flex flex-col gap-2">
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
                className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm border ${
                  isPending ? "bg-orange-50 border-orange-200" : "bg-gray-50 border-gray-200"
                }`}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Text strong className="shrink-0 text-gray-500">{orderLabel}</Text>
                  <Text type="secondary" className="shrink-0">{timeStr}</Text>
                  <Text className="truncate flex-1">{summary}</Text>
                  <Text strong className="shrink-0 text-orange-600">Bs {Number(order.total).toFixed(2)}</Text>
                  <span className="shrink-0 text-xs text-gray-400">
                    {order.payment_method === "efectivo" ? "💵" : order.payment_method === "qr" ? "📱" : "—"}
                  </span>
                </div>
                <div className="ml-3 shrink-0">
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
                    <span className="text-green-600 font-semibold text-xs flex items-center gap-1">
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
  );
}
