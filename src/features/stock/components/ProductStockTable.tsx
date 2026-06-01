"use client";

import { Table, Tag, Typography } from "antd";
import type { ProductStockRow } from "../types/stock.types";

const { Text } = Typography;

interface Props {
  stock: ProductStockRow[];
  loading: boolean;
}

export function ProductStockTable({ stock, loading }: Props) {
  const columns = [
    {
      title: "Producto",
      key: "product",
      render: (_: unknown, row: ProductStockRow) => (
        <div>
          <Text strong>{row.product_variants?.products?.name ?? "—"}</Text>
          <Text type="secondary" style={{ display: "block", fontSize: 12 }}>
            {row.product_variants?.name}
          </Text>
        </div>
      ),
    },
    {
      title: "Stock actual",
      key: "quantity",
      render: (_: unknown, row: ProductStockRow) => {
        const isLow = row.quantity <= row.min_quantity;
        return (
          <Tag color={isLow ? "red" : "green"}>
            {row.quantity} unidades
          </Tag>
        );
      },
    },
    {
      title: "Stock mínimo",
      dataIndex: "min_quantity",
      key: "min_quantity",
      render: (val: number) => <Text type="secondary">{val} unidades</Text>,
    },
    {
      title: "Estado",
      key: "status",
      render: (_: unknown, row: ProductStockRow) => {
        const isLow = row.quantity <= row.min_quantity;
        return isLow
          ? <Tag color="red">Bajo mínimo</Tag>
          : <Tag color="green">OK</Tag>;
      },
    },
  ];

  return (
    <Table
      rowKey="id"
      dataSource={stock}
      columns={columns}
      loading={loading}
      pagination={false}
      locale={{ emptyText: "Sin productos de reventa en stock. Registrá una compra para agregar." }}
    />
  );
}
