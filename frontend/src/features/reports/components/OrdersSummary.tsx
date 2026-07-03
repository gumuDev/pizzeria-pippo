"use client";

import { Typography } from "antd";
import type { Order } from "../types/reports.types";

const { Text } = Typography;

interface Props {
  orders: Order[];
}

export function OrdersSummary({ orders }: Props) {
  if (orders.length === 0) return null;

  const efectivo = orders.filter((o) => o.payment_method === "efectivo").reduce((s, o) => s + Number(o.total), 0);
  const qr = orders.filter((o) => o.payment_method === "qr").reduce((s, o) => s + Number(o.total), 0);
  const sinEspecificar = orders.filter((o) => !o.payment_method).reduce((s, o) => s + Number(o.total), 0);
  const grandTotal = efectivo + qr + sinEspecificar;
  const dineIn = orders.filter((o) => o.order_type !== "takeaway");
  const takeaway = orders.filter((o) => o.order_type === "takeaway");
  const dineInTotal = dineIn.reduce((s, o) => s + Number(o.total), 0);
  const takeawayTotal = takeaway.reduce((s, o) => s + Number(o.total), 0);

  return (
    <div style={{ marginTop: 16, padding: 16, background: "#f9fafb", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 14, display: "flex", gap: 24, flexWrap: "wrap" }}>
      <div style={{ flex: 1, minWidth: 160 }}>
        <Text strong style={{ display: "block", marginBottom: 8 }}>Por tipo de pedido</Text>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <Text strong>Total</Text>
            <Text strong style={{ color: "#f97316" }}>Bs {grandTotal.toFixed(2)}</Text>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", paddingLeft: 12 }}>
            <Text type="secondary">🍽️ Comer aquí ({dineIn.length})</Text>
            <Text>Bs {dineInTotal.toFixed(2)}</Text>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", paddingLeft: 12 }}>
            <Text type="secondary">🥡 Para llevar ({takeaway.length})</Text>
            <Text>Bs {takeawayTotal.toFixed(2)}</Text>
          </div>
        </div>
      </div>
      <div style={{ flex: 1, minWidth: 160 }}>
        <Text strong style={{ display: "block", marginBottom: 8 }}>Por método de pago</Text>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={{ display: "flex", justifyContent: "space-between", paddingLeft: 12 }}>
            <Text type="secondary">💵 Efectivo</Text>
            <Text>Bs {efectivo.toFixed(2)}</Text>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", paddingLeft: 12 }}>
            <Text type="secondary">📱 QR</Text>
            <Text>Bs {qr.toFixed(2)}</Text>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", paddingLeft: 12 }}>
            <Text type="secondary">Sin especificar</Text>
            <Text>Bs {sinEspecificar.toFixed(2)}</Text>
          </div>
        </div>
      </div>
    </div>
  );
}
