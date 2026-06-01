"use client";

import { Table, Tag, Typography } from "antd";
import { TYPE_COLORS, TYPE_LABELS } from "../constants/stock.constants";
import type { UnifiedMovement } from "../types/stock.types";

const { Text } = Typography;

interface Props {
  movements: UnifiedMovement[];
  loading: boolean;
  page: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export function StockHistoryTable({ movements, loading, page, total, pageSize, onPageChange }: Props) {
  const columns = [
    {
      title: "Fecha",
      key: "created_at",
      width: 110,
      render: (_: unknown, r: UnifiedMovement) => {
        const d = new Date(r.created_at);
        return (
          <div>
            <Text style={{ display: "block", fontSize: 13 }}>
              {d.toLocaleDateString("es-BO")}
            </Text>
            <Text type="secondary" style={{ display: "block", fontSize: 11 }}>
              {d.toLocaleTimeString("es-BO", { hour: "2-digit", minute: "2-digit" })}
            </Text>
          </div>
        );
      },
    },
    {
      title: "Detalle",
      dataIndex: "detail",
      key: "detail",
      render: (d: string) => <Text>{d}</Text>,
    },
    {
      title: "Cantidad",
      dataIndex: "quantity",
      key: "quantity",
      render: (q: number) => (
        <Text style={{ color: q >= 0 ? "#16a34a" : "#dc2626" }}>
          {q >= 0 ? `+${q}` : q}
        </Text>
      ),
    },
    {
      title: "Movimiento",
      dataIndex: "type",
      key: "type",
      render: (t: string) => <Tag color={TYPE_COLORS[t]}>{TYPE_LABELS[t] ?? t}</Tag>,
    },
    {
      title: "Origen",
      dataIndex: "origin",
      key: "origin",
      render: (o: string) => (
        <Tag color={o === "insumo" ? "blue" : "orange"}>
          {o === "insumo" ? "🧂 Insumo" : "📦 Reventa"}
        </Tag>
      ),
    },
    {
      title: "Notas",
      dataIndex: "notes",
      key: "notes",
      render: (n: string | null) => <Text type="secondary">{n ?? "—"}</Text>,
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
      locale={{ emptyText: "Sin movimientos registrados" }}
    />
  );
}
