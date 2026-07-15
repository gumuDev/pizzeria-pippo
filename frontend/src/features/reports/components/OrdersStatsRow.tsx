"use client";

import { Typography, Skeleton } from "antd";
import type { SalesSummary } from "../types/reports.types";

const { Text } = Typography;

interface Props {
  summary: SalesSummary | null;
  loading: boolean;
}

function StatTile({ label, value, count, accent }: { label: string; value: number; count?: number; accent?: boolean }) {
  return (
    <div
      style={{
        flex: "1 1 140px",
        minWidth: 140,
        background: accent ? "#fff7ed" : "#fff",
        border: `1px solid ${accent ? "#fed7aa" : "#e5e7eb"}`,
        borderRadius: 8,
        padding: "12px 16px",
      }}
    >
      <Text type="secondary" style={{ fontSize: 12, display: "block" }}>
        {label}{count !== undefined ? ` (${count})` : ""}
      </Text>
      <Text strong style={{ fontSize: 18, color: accent ? "#ea580c" : "#374151" }}>
        Bs {value.toFixed(2)}
      </Text>
    </div>
  );
}

export function OrdersStatsRow({ summary, loading }: Props) {
  if (loading && !summary) {
    return <Skeleton active paragraph={{ rows: 1 }} style={{ marginBottom: 16 }} />;
  }
  if (!summary) return null;

  const { by_order_type, by_payment_method } = summary;

  return (
    <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
      <StatTile label="Total del período" value={summary.total} count={summary.count} accent />
      <StatTile label="🍽️ Comer aquí" value={by_order_type.dine_in.total} count={by_order_type.dine_in.count} />
      <StatTile label="🥡 Para llevar" value={by_order_type.takeaway.total} count={by_order_type.takeaway.count} />
      <StatTile label="💵 Efectivo" value={by_payment_method.efectivo.total} count={by_payment_method.efectivo.count} />
      <StatTile label="📱 QR" value={by_payment_method.qr.total} count={by_payment_method.qr.count} />
      <StatTile label="🌐 Online" value={by_payment_method.online.total} count={by_payment_method.online.count} />
      {by_payment_method.sin_especificar.count > 0 && (
        <StatTile
          label="Sin especificar"
          value={by_payment_method.sin_especificar.total}
          count={by_payment_method.sin_especificar.count}
        />
      )}
    </div>
  );
}
