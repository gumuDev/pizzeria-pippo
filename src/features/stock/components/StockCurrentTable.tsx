"use client";

import { Table, Tag, Space, Typography, Tooltip } from "antd";
import { WarningOutlined } from "@ant-design/icons";
import type { StockRow } from "../types/stock.types";

const { Text } = Typography;

interface Props {
  stock: StockRow[];
  loading: boolean;
  onEditMinQty: (record: StockRow) => void;
}

export function StockCurrentTable({ stock, loading, onEditMinQty }: Props) {
  const columns = [
    {
      title: "Insumo",
      key: "ingredient",
      render: (_: unknown, r: StockRow) => (
        <Space>
          {r.quantity < r.min_quantity && (
            <Tooltip title="Stock bajo el mínimo"><WarningOutlined className="text-red-500" /></Tooltip>
          )}
          <Text>{r.ingredients?.name}</Text>
        </Space>
      ),
    },
    {
      title: "Unidad",
      key: "unit",
      render: (_: unknown, r: StockRow) => <Tag>{r.ingredients?.unit}</Tag>,
    },
    {
      title: "Stock actual",
      dataIndex: "quantity",
      key: "quantity",
      render: (qty: number, r: StockRow) => (
        <Text strong className={qty < r.min_quantity ? "text-red-500" : "text-green-600"}>{qty}</Text>
      ),
    },
    {
      title: "Mínimo",
      dataIndex: "min_quantity",
      key: "min_quantity",
      render: (min: number, r: StockRow) => (
        <button type="button" className="text-blue-500 hover:underline text-sm" onClick={() => onEditMinQty(r)}>
          {min}
        </button>
      ),
    },
    {
      title: "Estado",
      key: "status",
      render: (_: unknown, r: StockRow) =>
        r.quantity < r.min_quantity
          ? <Tag color="red">Stock bajo</Tag>
          : <Tag color="green">OK</Tag>,
    },
  ];

  return (
    <Table
      dataSource={stock}
      columns={columns}
      rowKey="id"
      loading={loading}
      pagination={{ pageSize: 20 }}
      rowClassName={(r: StockRow) => r.quantity < r.min_quantity ? "bg-red-50" : ""}
    />
  );
}
