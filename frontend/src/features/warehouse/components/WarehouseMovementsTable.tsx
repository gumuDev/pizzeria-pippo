"use client";

import { Table, Typography, Tag, Space } from "antd";
import { MOVEMENT_TYPE_COLORS, MOVEMENT_TYPE_LABELS } from "../types/warehouse-movements.types";
import type { UnifiedMovement } from "../types/warehouse-movements.types";

const { Text } = Typography;

interface Props {
  movements: UnifiedMovement[];
  loading: boolean;
}

const columns = [
  {
    title: "Fecha",
    dataIndex: "created_at",
    key: "created_at",
    render: (d: string) => new Date(d).toLocaleString("es-BO"),
  },
  {
    title: "Tipo",
    dataIndex: "type",
    key: "type",
    render: (t: string) => <Tag color={MOVEMENT_TYPE_COLORS[t]}>{MOVEMENT_TYPE_LABELS[t] ?? t}</Tag>,
  },
  {
    title: "Origen",
    dataIndex: "origin",
    key: "origin",
    render: (o: "ingredient" | "product") =>
      o === "ingredient"
        ? <Tag color="default">🧂 Insumo</Tag>
        : <Tag color="purple">📦 Reventa</Tag>,
  },
  {
    title: "Detalle",
    key: "detail",
    render: (_: unknown, r: UnifiedMovement) => (
      <Space>
        <Text>{r.detailName}</Text>
        {r.unit && <Tag>{r.unit}</Tag>}
      </Space>
    ),
  },
  {
    title: "Cantidad",
    dataIndex: "quantity",
    key: "quantity",
    render: (q: number, r: UnifiedMovement) => {
      const display = r.type === "compra" || q >= 0 ? `+${q}` : `${q}`;
      return <Text style={{ color: q >= 0 ? "#16a34a" : "#ef4444" }}>{display} {r.unit}</Text>;
    },
  },
  {
    title: "Destino",
    key: "branch",
    render: (_: unknown, r: UnifiedMovement) =>
      r.branches ? <Tag>{r.branches.name}</Tag> : <Text type="secondary">—</Text>,
  },
  {
    title: "Notas",
    dataIndex: "notes",
    key: "notes",
    render: (n: string | null) => n ?? <Text type="secondary">—</Text>,
  },
];

export function WarehouseMovementsTable({ movements, loading }: Props) {
  return <Table dataSource={movements} columns={columns} rowKey="id" loading={loading} pagination={{ pageSize: 30 }} />;
}
