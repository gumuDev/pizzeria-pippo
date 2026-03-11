"use client";

import { Card, Table, Tag, Typography } from "antd";
import dayjs from "dayjs";
import { UTC_OFFSET_HOURS } from "@/lib/timezone";
import { OrderItemsTable } from "./OrderItemsTable";
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
  const orderColumns = [
    {
      title: "Fecha y hora",
      dataIndex: "created_at",
      key: "created_at",
      render: (d: string) => dayjs(d).add(UTC_OFFSET_HOURS, "hour").format("DD/MM/YYYY HH:mm"),
    },
    {
      title: "Sucursal",
      key: "branch",
      render: (_: unknown, o: Order) => o.branches?.name ?? "—",
    },
    {
      title: "Cajero",
      key: "cashier",
      render: (_: unknown, o: Order) => o.cashier_name,
    },
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
      render: (t: number) => (
        <Text strong style={{ color: "#f97316" }}>Bs {Number(t).toFixed(2)}</Text>
      ),
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
      {orders.length > 0 && (
        <div className="mt-4 p-4 bg-gray-50 rounded border text-sm flex gap-6">
          <div className="flex-1">
            <Text strong className="block mb-2">Por tipo de pedido</Text>
            <div className="flex flex-col gap-1">
              <div className="flex justify-between">
                <Text strong>Total</Text>
                <Text strong style={{ color: "#f97316" }}>Bs {grandTotal.toFixed(2)}</Text>
              </div>
              <div className="flex justify-between pl-4">
                <Text type="secondary">🍽️ Comer aquí ({dineIn.length})</Text>
                <Text>Bs {dineInTotal.toFixed(2)}</Text>
              </div>
              <div className="flex justify-between pl-4">
                <Text type="secondary">🥡 Para llevar ({takeaway.length})</Text>
                <Text>Bs {takeawayTotal.toFixed(2)}</Text>
              </div>
            </div>
          </div>
          <div className="flex-1">
            <Text strong className="block mb-2">Por método de pago</Text>
            <div className="flex flex-col gap-1">
              <div className="flex justify-between pl-4">
                <Text type="secondary">💵 Efectivo</Text>
                <Text>Bs {efectivo.toFixed(2)}</Text>
              </div>
              <div className="flex justify-between pl-4">
                <Text type="secondary">📱 QR</Text>
                <Text>Bs {qr.toFixed(2)}</Text>
              </div>
              <div className="flex justify-between pl-4">
                <Text type="secondary">Sin especificar</Text>
                <Text>Bs {sinEspecificar.toFixed(2)}</Text>
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
