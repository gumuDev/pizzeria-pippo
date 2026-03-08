"use client";

import { Table, Tag, Typography, Space } from "antd";
import type { OrderItem } from "../types/reports.types";

const { Text } = Typography;

export const orderItemColumns = [
  {
    title: "Producto",
    key: "product",
    render: (_: unknown, item: OrderItem) => (
      <Space direction="vertical" size={0}>
        <Text strong>{item.product_variants?.products?.name}</Text>
        <Text type="secondary" style={{ fontSize: 11 }}>{item.product_variants?.name}</Text>
      </Space>
    ),
  },
  {
    title: "Categoría",
    key: "category",
    render: (_: unknown, item: OrderItem) => {
      const cat = item.product_variants?.products?.category ?? "";
      return <Tag color={cat === "pizza" ? "red" : cat === "bebida" ? "blue" : "green"}>{cat}</Tag>;
    },
  },
  {
    title: "Cant.",
    dataIndex: "qty",
    key: "qty",
    width: 60,
    render: (qty: number) => <Text strong>{qty}</Text>,
  },
  {
    title: "Precio unit.",
    dataIndex: "unit_price",
    key: "unit_price",
    render: (p: number) => `Bs ${Number(p).toFixed(2)}`,
  },
  {
    title: "Descuento",
    dataIndex: "discount_applied",
    key: "discount_applied",
    render: (d: number) =>
      Number(d) > 0
        ? <Text style={{ color: "#ef4444" }}>-Bs {Number(d).toFixed(2)}</Text>
        : <Text type="secondary">—</Text>,
  },
  {
    title: "Promoción",
    dataIndex: "promo_label",
    key: "promo_label",
    render: (label: string | null, item: OrderItem) =>
      label && Number(item.discount_applied) > 0
        ? <Tag color="orange">{label}</Tag>
        : <Text type="secondary">—</Text>,
  },
  {
    title: "Subtotal",
    key: "subtotal",
    render: (_: unknown, item: OrderItem) => {
      const sub = (Number(item.unit_price) * item.qty) - Number(item.discount_applied);
      return <Text strong style={{ color: "#f97316" }}>Bs {sub.toFixed(2)}</Text>;
    },
  },
];

interface Props {
  items: OrderItem[];
}

export function OrderItemsTable({ items }: Props) {
  return (
    <Table
      dataSource={items}
      rowKey={(item) => `${item.product_variants?.name}-${item.qty}`}
      size="small"
      pagination={false}
      columns={orderItemColumns}
    />
  );
}
