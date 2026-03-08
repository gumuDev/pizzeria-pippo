"use client";

import { Card, Table, Tag, Typography, Space } from "antd";
import type { TopProduct } from "../types/reports.types";

const { Text } = Typography;

interface Props {
  topProducts: TopProduct[];
  loading: boolean;
}

const columns = [
  {
    title: "Producto",
    key: "product",
    render: (_: unknown, r: TopProduct) => (
      <Space direction="vertical" size={0}>
        <Text strong>{r.product_name}</Text>
        <Text type="secondary" style={{ fontSize: 11 }}>{r.variant_name}</Text>
      </Space>
    ),
  },
  {
    title: "Categoría",
    dataIndex: "category",
    key: "category",
    render: (cat: string) => (
      <Tag color={cat === "pizza" ? "red" : cat === "bebida" ? "blue" : "green"}>{cat}</Tag>
    ),
  },
  {
    title: "Unidades",
    dataIndex: "qty",
    key: "qty",
    sorter: (a: TopProduct, b: TopProduct) => b.qty - a.qty,
    render: (qty: number) => <Text strong>{qty}</Text>,
  },
  {
    title: "Ingresos",
    dataIndex: "revenue",
    key: "revenue",
    sorter: (a: TopProduct, b: TopProduct) => b.revenue - a.revenue,
    render: (rev: number) => <Text strong style={{ color: "#f97316" }}>Bs {rev.toFixed(2)}</Text>,
  },
];

export function TopProductsTable({ topProducts, loading }: Props) {
  return (
    <Card title="Productos más vendidos" size="small" className="mb-6">
      <Table
        dataSource={topProducts}
        columns={columns}
        rowKey="variant_id"
        loading={loading}
        pagination={{ pageSize: 10 }}
        size="small"
      />
    </Card>
  );
}
