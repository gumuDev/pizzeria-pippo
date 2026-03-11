"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Table, Typography, Tag, Space, Button, Tooltip, Spin, Modal, Form, InputNumber,
} from "antd";
import { WarningOutlined, SwapOutlined, ShoppingCartOutlined, HistoryOutlined } from "@ant-design/icons";
import { supabase } from "@/lib/supabase";
import { useIsMobile } from "@/lib/useIsMobile";

const { Title, Text } = Typography;

interface Ingredient { id: string; name: string; unit: string; }

interface WarehouseRow {
  id: string;
  ingredient_id: string;
  ingredient_name: string;
  unit: string;
  quantity: number;
  min_quantity: number;
}

export default function WarehousePage() {
  const router = useRouter();
  const isMobile = useIsMobile();
  const [rows, setRows] = useState<WarehouseRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingRow, setEditingRow] = useState<WarehouseRow | null>(null);
  const [minQtyForm] = Form.useForm();

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data: session } = await supabase.auth.getSession();
    const token = session.session?.access_token ?? "";

    const res = await fetch("/api/warehouse/stock", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();

    if (Array.isArray(data)) {
      setRows(
        data
          .map((w) => ({
            id: w.id,
            ingredient_id: w.ingredient_id,
            ingredient_name: (w.ingredients as Ingredient).name,
            unit: (w.ingredients as Ingredient).unit,
            quantity: w.quantity,
            min_quantity: w.min_quantity,
          }))
          .sort((a, b) => a.ingredient_name.localeCompare(b.ingredient_name))
      );
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openMinQty = (row: WarehouseRow) => {
    setEditingRow(row);
    minQtyForm.setFieldsValue({ min_quantity: row.min_quantity });
  };

  const handleMinQty = async (values: { min_quantity: number }) => {
    if (!editingRow) return;
    await supabase
      .from("warehouse_stock")
      .update({ min_quantity: values.min_quantity })
      .eq("id", editingRow.id);
    setEditingRow(null);
    fetchData();
  };

  const columns = [
    {
      title: "Insumo",
      key: "ingredient",
      render: (_: unknown, row: WarehouseRow) => (
        <Space>
          {row.quantity < row.min_quantity && (
            <Tooltip title="Stock bajo el mínimo">
              <WarningOutlined style={{ color: "#ef4444" }} />
            </Tooltip>
          )}
          <Text strong>{row.ingredient_name}</Text>
          <Tag>{row.unit}</Tag>
        </Space>
      ),
    },
    {
      title: "Stock bodega",
      key: "quantity",
      render: (_: unknown, row: WarehouseRow) => {
        const isLow = row.quantity < row.min_quantity;
        return (
          <Text strong style={{ color: isLow ? "#ef4444" : "#16a34a" }}>
            {row.quantity} {row.unit}
          </Text>
        );
      },
    },
    {
      title: "Mínimo",
      key: "min_quantity",
      render: (_: unknown, row: WarehouseRow) => (
        <Button type="link" size="small" style={{ padding: 0 }} onClick={() => openMinQty(row)}>
          {row.min_quantity} {row.unit}
        </Button>
      ),
    },
    {
      title: "Estado",
      key: "status",
      render: (_: unknown, row: WarehouseRow) =>
        row.quantity < row.min_quantity
          ? <Tag color="red">Stock bajo</Tag>
          : <Tag color="green">OK</Tag>,
    },
    {
      title: "Acción",
      key: "action",
      render: (_: unknown, row: WarehouseRow) => (
        <Button
          size="small"
          icon={<SwapOutlined />}
          onClick={() => router.push(`/warehouse/transfer?ingredientId=${row.ingredient_id}`)}
        >
          Transferir
        </Button>
      ),
    },
  ];

  const alertCount = rows.filter((r) => r.quantity < r.min_quantity).length;

  return (
    <div style={{ padding: isMobile ? 16 : 24 }}>
      {/* Header */}
      <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", justifyContent: "space-between", alignItems: isMobile ? "stretch" : "center", gap: 12, marginBottom: 20 }}>
        <Space>
          <Title level={4} style={{ margin: 0 }}>Bodega Central</Title>
          {alertCount > 0 && (
            <Tag color="red" icon={<WarningOutlined />}>
              {alertCount} insumo{alertCount > 1 ? "s" : ""} bajo mínimo
            </Tag>
          )}
        </Space>
        <Space wrap>
          <Button icon={<HistoryOutlined />} onClick={() => router.push("/warehouse/movements")} block={isMobile}>
            Historial
          </Button>
          <Button icon={<ShoppingCartOutlined />} onClick={() => router.push("/warehouse/purchase")} block={isMobile}>
            {isMobile ? "Compra" : "Nueva compra"}
          </Button>
          <Button type="primary" icon={<SwapOutlined />} onClick={() => router.push("/warehouse/transfer")} block={isMobile}>
            Transferir
          </Button>
        </Space>
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "48px 0" }}>
          <Spin size="large" />
        </div>
      ) : isMobile ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {rows.map((row) => {
            const isLow = row.quantity < row.min_quantity;
            return (
              <div
                key={row.ingredient_id}
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
                    <Text strong style={{ fontSize: 15 }}>{row.ingredient_name}</Text>
                    <Tag style={{ margin: 0 }}>{row.unit}</Tag>
                  </div>
                  {isLow ? <Tag color="red" style={{ margin: 0 }}>Stock bajo</Tag> : <Tag color="green" style={{ margin: 0 }}>OK</Tag>}
                </div>
                <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 10 }}>
                  <div>
                    <Text type="secondary" style={{ fontSize: 12 }}>Stock: </Text>
                    <Text strong style={{ color: isLow ? "#ef4444" : "#16a34a" }}>{row.quantity}</Text>
                  </div>
                  <div>
                    <Text type="secondary" style={{ fontSize: 12 }}>Mínimo: </Text>
                    <Button type="link" size="small" style={{ padding: 0, fontWeight: 600 }} onClick={() => openMinQty(row)}>
                      {row.min_quantity}
                    </Button>
                  </div>
                </div>
                <Button
                  size="small"
                  icon={<SwapOutlined />}
                  block
                  onClick={() => router.push(`/warehouse/transfer?ingredientId=${row.ingredient_id}`)}
                >
                  Transferir a sucursal
                </Button>
              </div>
            );
          })}
        </div>
      ) : (
        <Table
          dataSource={rows}
          columns={columns}
          rowKey="ingredient_id"
          pagination={false}
          rowClassName={(row) => row.quantity < row.min_quantity ? "bg-red-50" : ""}
          size="middle"
        />
      )}

      <Modal
        title={`Stock mínimo — ${editingRow?.ingredient_name}`}
        open={!!editingRow}
        onCancel={() => setEditingRow(null)}
        footer={null}
        destroyOnHidden
      >
        <Form form={minQtyForm} layout="vertical" onFinish={handleMinQty} style={{ marginTop: 16 }}>
          <Form.Item
            label={`Cantidad mínima (${editingRow?.unit})`}
            name="min_quantity"
            rules={[{ required: true, message: "Requerido" }]}
          >
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <Button onClick={() => setEditingRow(null)}>Cancelar</Button>
            <Button type="primary" htmlType="submit">Guardar</Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
