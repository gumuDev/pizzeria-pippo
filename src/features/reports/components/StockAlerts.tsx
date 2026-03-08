"use client";

import Link from "next/link";
import { Card, Table, Tag, Typography, Space, Button } from "antd";
import { WarningOutlined, ArrowRightOutlined } from "@ant-design/icons";
import type { StockAlert } from "../types/reports.types";

const { Text } = Typography;

const alertColumns = [
  {
    title: "Insumo",
    key: "ingredient",
    render: (_: unknown, r: StockAlert) => (
      <Space>
        <WarningOutlined style={{ color: "#ef4444" }} />
        <Text>{r.ingredients?.name}</Text>
      </Space>
    ),
  },
  { title: "Unidad", key: "unit", render: (_: unknown, r: StockAlert) => <Tag>{r.ingredients?.unit}</Tag> },
  { title: "Sucursal", key: "branch", render: (_: unknown, r: StockAlert) => r.branches?.name },
  {
    title: "Stock actual",
    dataIndex: "quantity",
    key: "quantity",
    render: (q: number) => <Text style={{ color: "#ef4444", fontWeight: 700 }}>{q}</Text>,
  },
  {
    title: "Mínimo",
    dataIndex: "min_quantity",
    key: "min_quantity",
    render: (m: number) => <Text type="secondary">{m}</Text>,
  },
];

interface Props {
  stockAlerts: StockAlert[];
}

export function StockAlerts({ stockAlerts }: Props) {
  if (stockAlerts.length === 0) return null;

  return (
    <Card
      title={
        <Space>
          <WarningOutlined style={{ color: "#ef4444" }} />
          <Text>Insumos bajo mínimo ({stockAlerts.length})</Text>
        </Space>
      }
      size="small"
      extra={
        <Link href="/stock">
          <Button size="small" icon={<ArrowRightOutlined />}>Ir a stock</Button>
        </Link>
      }
    >
      <Table dataSource={stockAlerts} columns={alertColumns} rowKey="id" pagination={false} size="small" />
    </Card>
  );
}
