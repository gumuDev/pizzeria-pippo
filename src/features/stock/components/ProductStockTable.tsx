"use client";

import { Table, Tag, Typography, Empty, Button } from "antd";
import { WarningOutlined, EditOutlined } from "@ant-design/icons";
import { useIsMobile } from "@/lib/useIsMobile";
import type { ProductStockRow } from "../types/stock.types";

const { Text } = Typography;

interface Props {
  stock: ProductStockRow[];
  loading: boolean;
  onEditMinQty: (row: ProductStockRow) => void;
}

export function ProductStockTable({ stock, loading, onEditMinQty }: Props) {
  const isMobile = useIsMobile();

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
        return <Tag color={isLow ? "red" : "green"}>{row.quantity} unidades</Tag>;
      },
    },
    {
      title: "Stock mínimo",
      key: "min_quantity",
      render: (_: unknown, row: ProductStockRow) => (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Text type="secondary">{row.min_quantity} unidades</Text>
          <Button
            size="small"
            type="text"
            icon={<EditOutlined />}
            onClick={() => onEditMinQty(row)}
            style={{ color: "#6b7280" }}
          />
        </div>
      ),
    },
    {
      title: "Estado",
      key: "status",
      render: (_: unknown, row: ProductStockRow) => {
        const isLow = row.quantity <= row.min_quantity;
        return isLow ? <Tag color="red">Bajo mínimo</Tag> : <Tag color="green">OK</Tag>;
      },
    },
  ];

  if (isMobile) {
    if (loading) return <div style={{ textAlign: "center", padding: 40, color: "#9ca3af" }}>Cargando...</div>;

    if (stock.length === 0) {
      return (
        <Empty
          description="Sin productos de reventa en stock. Registrá una compra para agregar."
          style={{ padding: "32px 0" }}
        />
      );
    }

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {stock.map((row) => {
          const isLow = row.quantity <= row.min_quantity;
          return (
            <div
              key={row.id}
              style={{
                background: isLow ? "#fef2f2" : "#fff",
                border: `1px solid ${isLow ? "#fca5a5" : "#e5e7eb"}`,
                borderRadius: 10,
                padding: "12px 14px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  {isLow && <WarningOutlined style={{ color: "#ef4444" }} />}
                  <div>
                    <Text strong style={{ fontSize: 15 }}>{row.product_variants?.products?.name ?? "—"}</Text>
                    <Text type="secondary" style={{ display: "block", fontSize: 12 }}>{row.product_variants?.name}</Text>
                  </div>
                </div>
                {isLow ? <Tag color="red" style={{ margin: 0 }}>Bajo mínimo</Tag> : <Tag color="green" style={{ margin: 0 }}>OK</Tag>}
              </div>
              <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                <div>
                  <Text type="secondary" style={{ fontSize: 12 }}>Actual: </Text>
                  <Text strong style={{ color: isLow ? "#ef4444" : "#16a34a" }}>{row.quantity}</Text>
                  <Text type="secondary" style={{ fontSize: 12 }}> un.</Text>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>Mínimo: </Text>
                  <Text style={{ fontSize: 14, fontWeight: 600 }}>{row.min_quantity}</Text>
                  <Text type="secondary" style={{ fontSize: 12 }}> un.</Text>
                  <Button
                    size="small"
                    type="text"
                    icon={<EditOutlined />}
                    onClick={() => onEditMinQty(row)}
                    style={{ color: "#6b7280", padding: "0 4px" }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

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
