"use client";

import { Table, Tag, Typography } from "antd";
import { TYPE_COLORS, TYPE_LABELS } from "../constants/stock.constants";
import type { Movement } from "../types/stock.types";

const { Text } = Typography;

interface Props {
  movements: Movement[];
  loading: boolean;
  page: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export function StockMovementsTable({ movements, loading, page, total, pageSize, onPageChange }: Props) {
  const columns = [
    {
      title: "Fecha",
      dataIndex: "created_at",
      key: "created_at",
      render: (d: string) => new Date(d).toLocaleString("es-BO"),
    },
    {
      title: "Insumo",
      key: "ingredient",
      render: (_: unknown, r: Movement) => r.ingredients?.name ?? r.ingredient_id,
    },
    {
      title: "Tipo",
      dataIndex: "type",
      key: "type",
      render: (t: string) => <Tag color={TYPE_COLORS[t]}>{TYPE_LABELS[t] ?? t}</Tag>,
    },
    {
      title: "Cantidad",
      dataIndex: "quantity",
      key: "quantity",
      render: (q: number) => (
        <Text className={q >= 0 ? "text-green-600" : "text-red-500"}>
          {q >= 0 ? `+${q}` : q}
        </Text>
      ),
    },
    {
      title: "Notas",
      dataIndex: "notes",
      key: "notes",
      render: (n: string | null) => n ?? "—",
    },
  ];

  return (
    <Table
      dataSource={movements}
      columns={columns}
      rowKey="id"
      loading={loading}
      pagination={{
        current: page,
        pageSize,
        total,
        showTotal: (t) => `${t} movimientos`,
        onChange: onPageChange,
        showSizeChanger: false,
      }}
    />
  );
}
