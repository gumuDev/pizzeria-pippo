"use client";

import { Table, Tag, Space, Button, Tooltip, Typography, Spin, Modal, Form, InputNumber, Input } from "antd";
import { useRouter } from "next/navigation";
import { useWarehouseProductTable } from "../hooks/useWarehouseProductTable";

const { Text } = Typography;

const IconWarning = () => (
  <svg className="inline w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);
const IconEdit = () => (
  <svg className="inline w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);
const IconSwap = () => (
  <svg className="inline w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>
  </svg>
);

function variantLabel(row: { product_variants: { name: string; products: { name: string } | null } | null }): string {
  const pv = row.product_variants;
  if (!pv) return "—";
  const productName = pv.products?.name ?? "";
  return pv.name === "Unidad" ? productName : `${productName} — ${pv.name}`;
}

export function WarehouseProductTable({ isMobile }: { isMobile: boolean }) {
  const router = useRouter();
  const { rows, loading, adjustingRow, adjustLoading, adjustForm, alertCount, openAdjust, closeAdjust, handleAdjust } = useWarehouseProductTable();

  const columns = [
    {
      title: "Producto",
      key: "product",
      render: (_: unknown, row: ReturnType<typeof useWarehouseProductTable>["rows"][0]) => (
        <Space>
          {row.quantity < row.min_quantity && (
            <Tooltip title="Stock bajo el mínimo"><IconWarning /></Tooltip>
          )}
          <Text strong>{variantLabel(row)}</Text>
        </Space>
      ),
    },
    {
      title: "Stock bodega",
      key: "quantity",
      render: (_: unknown, row: ReturnType<typeof useWarehouseProductTable>["rows"][0]) => (
        <Text strong style={{ color: row.quantity < row.min_quantity ? "#ef4444" : "#16a34a" }}>
          {row.quantity} unid.
        </Text>
      ),
    },
    {
      title: "Mínimo",
      key: "min_quantity",
      render: (_: unknown, row: ReturnType<typeof useWarehouseProductTable>["rows"][0]) => (
        <Text>{row.min_quantity} unid.</Text>
      ),
    },
    {
      title: "Estado",
      key: "status",
      render: (_: unknown, row: ReturnType<typeof useWarehouseProductTable>["rows"][0]) =>
        row.quantity < row.min_quantity
          ? <Tag color="red">Stock bajo</Tag>
          : <Tag color="green">OK</Tag>,
    },
    {
      title: "Acciones",
      key: "action",
      render: (_: unknown, row: ReturnType<typeof useWarehouseProductTable>["rows"][0]) => (
        <Space>
          <Button size="small" icon={<IconEdit />} onClick={() => openAdjust(row)}>Ajustar</Button>
          <Button size="small" icon={<IconSwap />} onClick={() => router.push(`/warehouse/transfer?variantId=${row.variant_id}`)}>
            Transferir
          </Button>
        </Space>
      ),
    },
  ];

  if (loading && !rows.length) {
    return <div style={{ display: "flex", justifyContent: "center", padding: "48px 0" }}><Spin size="large" /></div>;
  }

  return (
    <>
      {alertCount > 0 && (
        <div style={{ marginBottom: 12 }}>
          <Tag color="orange" icon={<IconWarning />}>
            {alertCount} producto{alertCount > 1 ? "s" : ""} bajo mínimo
          </Tag>
        </div>
      )}

      {isMobile ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {rows.map((row) => {
            const isLow = row.quantity < row.min_quantity;
            return (
              <div key={row.id} style={{ background: isLow ? "#fef2f2" : "#fff", border: `1px solid ${isLow ? "#fca5a5" : "#e5e7eb"}`, borderRadius: 10, padding: "12px 14px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {isLow && <IconWarning />}
                    <Text strong style={{ fontSize: 15 }}>{variantLabel(row)}</Text>
                  </div>
                  {isLow ? <Tag color="red" style={{ margin: 0 }}>Stock bajo</Tag> : <Tag color="green" style={{ margin: 0 }}>OK</Tag>}
                </div>
                <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 10 }}>
                  <div>
                    <Text type="secondary" style={{ fontSize: 12 }}>Stock: </Text>
                    <Text strong style={{ color: isLow ? "#ef4444" : "#16a34a" }}>{row.quantity} unid.</Text>
                  </div>
                  <div>
                    <Text type="secondary" style={{ fontSize: 12 }}>Mínimo: </Text>
                    <Text strong>{row.min_quantity} unid.</Text>
                  </div>
                </div>
                <Space>
                  <Button size="small" icon={<IconEdit />} onClick={() => openAdjust(row)}>Ajustar</Button>
                  <Button size="small" icon={<IconSwap />} onClick={() => router.push(`/warehouse/transfer?variantId=${row.variant_id}`)}>
                    Transferir
                  </Button>
                </Space>
              </div>
            );
          })}
          {rows.length === 0 && !loading && (
            <Text type="secondary" style={{ textAlign: "center", display: "block", padding: 32 }}>
              Sin productos de reventa en bodega. Registrá una compra primero.
            </Text>
          )}
        </div>
      ) : (
        <Table
          dataSource={rows}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 20, showTotal: (t) => `${t} productos` }}
          rowClassName={(row) => row.quantity < row.min_quantity ? "bg-red-50" : ""}
          size="middle"
          locale={{ emptyText: "Sin productos de reventa en bodega. Registrá una compra primero." }}
        />
      )}

      <Modal
        open={!!adjustingRow}
        title={`Ajustar stock — ${adjustingRow ? variantLabel(adjustingRow) : ""}`}
        onCancel={closeAdjust}
        footer={null}
        destroyOnClose
      >
        <Form form={adjustForm} layout="vertical" onFinish={handleAdjust}>
          <Form.Item label="Cantidad real en bodega (unid.)" name="real_quantity" rules={[{ required: true, message: "Ingresá la cantidad real" }]}>
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item label="Motivo del ajuste" name="notes">
            <Input.TextArea rows={2} placeholder="Ej: Conteo físico, merma, etc." />
          </Form.Item>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <Button onClick={closeAdjust}>Cancelar</Button>
            <Button type="primary" htmlType="submit" loading={adjustLoading}>Confirmar ajuste</Button>
          </div>
        </Form>
      </Modal>
    </>
  );
}
