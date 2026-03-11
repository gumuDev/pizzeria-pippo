"use client";

import { Card, Table, Tag, Typography, Collapse } from "antd";
import dayjs from "dayjs";
import { UTC_OFFSET_HOURS } from "@/lib/timezone";
import { OrderItemsTable } from "./OrderItemsTable";
import { useIsMobile } from "@/lib/useIsMobile";
import type { Order } from "../types/reports.types";

const { Text } = Typography;

interface Props {
  orders: Order[];
  ordersTotal: number;
  ordersPage: number;
  loading: boolean;
  onPageChange: (page: number) => void;
}

export function OrdersTable({ orders, ordersTotal, ordersPage, loading, onPageChange }: Props) {
  const isMobile = useIsMobile();

  const orderColumns = [
    {
      title: "Fecha y hora",
      dataIndex: "created_at",
      key: "created_at",
      render: (d: string) => dayjs(d).add(UTC_OFFSET_HOURS, "hour").format("DD/MM/YYYY HH:mm"),
    },
    { title: "Sucursal", key: "branch", render: (_: unknown, o: Order) => o.branches?.name ?? "—" },
    { title: "Cajero", key: "cashier", render: (_: unknown, o: Order) => o.cashier_name },
    {
      title: "Items",
      key: "items",
      render: (_: unknown, o: Order) => {
        const names = o.order_items
          .map((i) => `${i.qty}x ${i.product_variants?.products?.name} ${i.product_variants?.name}`)
          .join(", ");
        return (
          <Text style={{ maxWidth: 280, display: "inline-block" }} ellipsis={{ tooltip: names }}>
            {names}
          </Text>
        );
      },
    },
    {
      title: "Tipo",
      dataIndex: "order_type",
      key: "order_type",
      render: (t: string) =>
        t === "takeaway" ? <Tag color="purple">🥡 Para llevar</Tag> : <Tag color="orange">🍽️ Comer aquí</Tag>,
    },
    {
      title: "Pago",
      dataIndex: "payment_method",
      key: "payment_method",
      render: (m: string | null) =>
        m === "efectivo" ? <Tag color="green">💵 Efectivo</Tag>
        : m === "qr" ? <Tag color="blue">📱 QR</Tag>
        : <Text type="secondary">—</Text>,
    },
    {
      title: "Total",
      dataIndex: "total",
      key: "total",
      align: "right" as const,
      render: (t: number) => <Text strong style={{ color: "#f97316" }}>Bs {Number(t).toFixed(2)}</Text>,
    },
  ];

  const efectivo = orders.filter((o) => o.payment_method === "efectivo").reduce((s, o) => s + Number(o.total), 0);
  const qr = orders.filter((o) => o.payment_method === "qr").reduce((s, o) => s + Number(o.total), 0);
  const sinEspecificar = orders.filter((o) => !o.payment_method).reduce((s, o) => s + Number(o.total), 0);
  const grandTotal = efectivo + qr + sinEspecificar;
  const dineIn = orders.filter((o) => o.order_type !== "takeaway");
  const takeaway = orders.filter((o) => o.order_type === "takeaway");
  const dineInTotal = dineIn.reduce((s, o) => s + Number(o.total), 0);
  const takeawayTotal = takeaway.reduce((s, o) => s + Number(o.total), 0);

  const summary = orders.length > 0 && (
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

  if (isMobile) {
    return (
      <Card size="small">
        {loading ? (
          <div style={{ textAlign: "center", padding: 40, color: "#9ca3af" }}>Cargando...</div>
        ) : orders.length === 0 ? (
          <div style={{ textAlign: "center", padding: 40, color: "#9ca3af" }}>Sin ventas en este período</div>
        ) : (
          <>
            <Collapse
              size="small"
              items={orders.map((order) => {
                const fecha = dayjs(order.created_at).add(UTC_OFFSET_HOURS, "hour").format("DD/MM HH:mm");
                const nombres = order.order_items
                  .map((i) => `${i.qty}x ${i.product_variants?.products?.name}`)
                  .join(", ");
                return {
                  key: order.id,
                  label: (
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, width: "100%" }}>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                          <Text style={{ fontSize: 12, color: "#6b7280" }}>{fecha}</Text>
                          {order.order_type === "takeaway"
                            ? <Tag color="purple" style={{ margin: 0, fontSize: 10 }}>🥡 Llevar</Tag>
                            : <Tag color="orange" style={{ margin: 0, fontSize: 10 }}>🍽️ Local</Tag>}
                          {order.payment_method === "efectivo"
                            ? <Tag color="green" style={{ margin: 0, fontSize: 10 }}>💵</Tag>
                            : order.payment_method === "qr"
                            ? <Tag color="blue" style={{ margin: 0, fontSize: 10 }}>📱</Tag>
                            : null}
                        </div>
                        <Text style={{ fontSize: 12, color: "#9ca3af", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block", maxWidth: 200 }}>{nombres}</Text>
                      </div>
                      <Text strong style={{ color: "#f97316", fontSize: 15, flexShrink: 0 }}>
                        Bs {Number(order.total).toFixed(2)}
                      </Text>
                    </div>
                  ),
                  children: <OrderItemsTable items={order.order_items} />,
                };
              })}
            />
            {/* Paginación simple */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12, paddingTop: 12, borderTop: "1px solid #f0f0f0" }}>
              <Text type="secondary" style={{ fontSize: 13 }}>{ordersTotal} ventas en total</Text>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  disabled={ordersPage === 1}
                  onClick={() => onPageChange(ordersPage - 1)}
                  style={{ padding: "4px 12px", borderRadius: 6, border: "1px solid #d9d9d9", background: ordersPage === 1 ? "#f5f5f5" : "#fff", cursor: ordersPage === 1 ? "not-allowed" : "pointer", color: ordersPage === 1 ? "#bfbfbf" : "#374151" }}
                >
                  ‹ Ant.
                </button>
                <Text type="secondary" style={{ lineHeight: "30px", fontSize: 13 }}>Pág. {ordersPage}</Text>
                <button
                  disabled={ordersPage * 20 >= ordersTotal}
                  onClick={() => onPageChange(ordersPage + 1)}
                  style={{ padding: "4px 12px", borderRadius: 6, border: "1px solid #d9d9d9", background: ordersPage * 20 >= ordersTotal ? "#f5f5f5" : "#fff", cursor: ordersPage * 20 >= ordersTotal ? "not-allowed" : "pointer", color: ordersPage * 20 >= ordersTotal ? "#bfbfbf" : "#374151" }}
                >
                  Sig. ›
                </button>
              </div>
            </div>
            {summary}
          </>
        )}
      </Card>
    );
  }

  return (
    <Card size="small">
      <Table
        dataSource={orders}
        rowKey="id"
        loading={loading}
        size="small"
        pagination={{
          current: ordersPage,
          pageSize: 20,
          total: ordersTotal,
          showSizeChanger: false,
          showTotal: (t) => `${t} ventas`,
          onChange: onPageChange,
        }}
        expandable={{
          expandedRowRender: (order) => <OrderItemsTable items={order.order_items} />,
        }}
        columns={orderColumns}
      />
      {summary}
    </Card>
  );
}
