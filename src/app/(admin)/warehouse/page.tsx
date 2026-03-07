"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Table, Typography, Tag, Space, Button, Tooltip, Spin, Modal, Form, InputNumber,
} from "antd";
import { WarningOutlined, SwapOutlined, ShoppingCartOutlined, HistoryOutlined } from "@ant-design/icons";
import { supabase } from "@/lib/supabase";

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
              <WarningOutlined className="text-red-500" />
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
          <Text strong className={isLow ? "text-red-500" : "text-green-600"}>
            {row.quantity} {row.unit}
          </Text>
        );
      },
    },
    {
      title: "Mínimo",
      key: "min_quantity",
      render: (_: unknown, row: WarehouseRow) => (
        <Button type="link" size="small" className="!p-0" onClick={() => openMinQty(row)}>
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
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <Space>
          <Title level={4} className="!mb-0">Bodega Central</Title>
          {alertCount > 0 && (
            <Tag color="red" icon={<WarningOutlined />}>
              {alertCount} insumo{alertCount > 1 ? "s" : ""} bajo mínimo
            </Tag>
          )}
        </Space>
        <Space>
          <Button
            icon={<HistoryOutlined />}
            onClick={() => router.push("/warehouse/movements")}
          >
            Historial
          </Button>
          <Button
            icon={<ShoppingCartOutlined />}
            onClick={() => router.push("/warehouse/purchase")}
          >
            Nueva compra
          </Button>
          <Button
            type="primary"
            icon={<SwapOutlined />}
            onClick={() => router.push("/warehouse/transfer")}
          >
            Transferir
          </Button>
        </Space>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Spin size="large" /></div>
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
        <Form form={minQtyForm} layout="vertical" onFinish={handleMinQty} className="mt-4">
          <Form.Item
            label={`Cantidad mínima (${editingRow?.unit})`}
            name="min_quantity"
            rules={[{ required: true, message: "Requerido" }]}
          >
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>
          <div className="flex justify-end gap-2">
            <Button onClick={() => setEditingRow(null)}>Cancelar</Button>
            <Button type="primary" htmlType="submit">Guardar</Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
