"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import {
  Table, Typography, Tag, Space, Button, Tooltip, Spin, Modal, Form, InputNumber,
  Select, Input,
} from "antd";
import { WarningOutlined, SwapOutlined, ShoppingCartOutlined, HistoryOutlined, SearchOutlined } from "@ant-design/icons";
import { supabase } from "@/lib/supabase";
import { useIsMobile } from "@/lib/useIsMobile";

const { Title, Text } = Typography;
const PAGE_SIZE = 10;
const REVALIDATE_INTERVAL = 60;

interface Ingredient { id: string; name: string; unit: string; }

interface WarehouseRow {
  id: string;
  ingredient_id: string;
  ingredient_name: string;
  unit: string;
  quantity: number;
  min_quantity: number;
}

async function fetcher(url: string) {
  const { data: session } = await supabase.auth.getSession();
  const token = session.session?.access_token ?? "";
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  const json = await res.json();
  if (!json.data) return { rows: [], total: 0 };
  return {
    rows: json.data.map((w: WarehouseRow & { ingredients: Ingredient }) => ({
      id: w.id,
      ingredient_id: w.ingredient_id,
      ingredient_name: (w.ingredients as Ingredient).name,
      unit: (w.ingredients as Ingredient).unit,
      quantity: w.quantity,
      min_quantity: w.min_quantity,
    })),
    total: json.total ?? 0,
  };
}

export default function WarehousePage() {
  const router = useRouter();
  const isMobile = useIsMobile();
  const [editingRow, setEditingRow] = useState<WarehouseRow | null>(null);
  const [page, setPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState<"low" | "ok" | undefined>();
  const [search, setSearch] = useState("");
  const [mobileRows, setMobileRows] = useState<WarehouseRow[]>([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const [minQtyForm] = Form.useForm();

  const params = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) });
  if (filterStatus) params.set("status", filterStatus);
  const swrKey = `/api/warehouse/stock?${params.toString()}`;

  const { data, isLoading, mutate } = useSWR(swrKey, fetcher, {
    revalidateOnFocus: true,
    dedupingInterval: REVALIDATE_INTERVAL * 1000,
    keepPreviousData: true,
  });

  const rows = data?.rows ?? [];
  const total = data?.total ?? 0;
  const hasMore = mobileRows.length < total;

  // Acumula rows en móvil al cargar nuevas páginas
  useEffect(() => {
    if (!isMobile || !data?.rows) return;
    if (page === 1) {
      setMobileRows(data.rows);
    } else {
      setMobileRows((prev) => {
        const existingIds = new Set(prev.map((r) => r.ingredient_id));
        const newRows = data.rows.filter((r: WarehouseRow) => !existingIds.has(r.ingredient_id));
        return [...prev, ...newRows];
      });
    }
    setLoadingMore(false);
  }, [data, page, isMobile]);

  // Resetea al cambiar filtros
  const handleStatusFilter = (val: "low" | "ok" | undefined) => {
    setFilterStatus(val);
    setPage(1);
    setMobileRows([]);
  };

  const handleSearch = (val: string) => {
    setSearch(val);
  };

  // IntersectionObserver para infinite scroll
  const handleSentinel = useCallback((node: HTMLDivElement | null) => {
    sentinelRef.current = node;
  }, []);

  useEffect(() => {
    if (!isMobile || !sentinelRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading && !loadingMore) {
          setLoadingMore(true);
          setPage((p) => p + 1);
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [isMobile, hasMore, isLoading, loadingMore]);

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
    setPage(1);
    setMobileRows([]);
    mutate();
  };

  const filteredRows = search
    ? rows.filter((r: WarehouseRow) => r.ingredient_name.toLowerCase().includes(search.toLowerCase()))
    : rows;

  const displayMobileRows = search
    ? mobileRows.filter((r: WarehouseRow) => r.ingredient_name.toLowerCase().includes(search.toLowerCase()))
    : mobileRows;

  const alertCount = isMobile
    ? mobileRows.filter((r: WarehouseRow) => r.quantity < r.min_quantity).length
    : rows.filter((r: WarehouseRow) => r.quantity < r.min_quantity).length;

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

  return (
    <div style={{ padding: isMobile ? 16 : 24 }}>
      {/* Header */}
      <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", justifyContent: "space-between", alignItems: isMobile ? "stretch" : "center", gap: 12, marginBottom: 16 }}>
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

      {/* Filters */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
        <Input
          placeholder="Buscar insumo..."
          prefix={<SearchOutlined />}
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          allowClear
          style={{ width: isMobile ? "100%" : 220 }}
        />
        <Select
          placeholder="Estado"
          allowClear
          value={filterStatus}
          onChange={handleStatusFilter}
          style={{ width: isMobile ? "100%" : 140 }}
          options={[
            { value: "low", label: "Stock bajo" },
            { value: "ok", label: "OK" },
          ]}
        />
      </div>

      {/* Content */}
      {isLoading && !data ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "48px 0" }}>
          <Spin size="large" />
        </div>
      ) : isMobile ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {displayMobileRows.map((row) => {
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

          {/* Sentinel para infinite scroll */}
          <div ref={handleSentinel} style={{ height: 1 }} />

          {loadingMore && (
            <div style={{ display: "flex", justifyContent: "center", padding: "16px 0" }}>
              <Spin size="small" />
            </div>
          )}

          {!hasMore && mobileRows.length > 0 && (
            <Text type="secondary" style={{ textAlign: "center", display: "block", padding: "8px 0", fontSize: 12 }}>
              {mobileRows.length} insumos en total
            </Text>
          )}
        </div>
      ) : (
        <Table
          dataSource={filteredRows}
          columns={columns}
          rowKey="ingredient_id"
          loading={isLoading}
          pagination={{
            current: page,
            pageSize: PAGE_SIZE,
            total,
            showTotal: (t) => `${t} insumos`,
            onChange: (p) => setPage(p),
            showSizeChanger: false,
          }}
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
