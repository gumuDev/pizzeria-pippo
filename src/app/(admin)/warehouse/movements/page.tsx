"use client";

import { useRouter } from "next/navigation";
import { Table, Typography, Tag, Space, Button, Select, DatePicker, Row, Col } from "antd";
import { ArrowLeftOutlined, HistoryOutlined } from "@ant-design/icons";
import { useIsMobile } from "@/lib/useIsMobile";
import { useWarehouseMovements } from "@/features/warehouse/hooks/useWarehouseMovements";
import { MOVEMENT_TYPE_COLORS, MOVEMENT_TYPE_LABELS } from "@/features/warehouse/types/warehouse-movements.types";
import type { UnifiedMovement } from "@/features/warehouse/types/warehouse-movements.types";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

export default function WarehouseMovementsPage() {
  const router = useRouter();
  const isMobile = useIsMobile();
  const {
    movements, ingredients, branches, loading,
    filterType, setFilterType,
    filterIngredient, setFilterIngredient,
    filterBranch, setFilterBranch,
    filterDates, setFilterDates,
    filterOrigin, setFilterOrigin,
  } = useWarehouseMovements();

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

  return (
    <div style={{ padding: isMobile ? 16 : 24 }}>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} type="text" onClick={() => router.push("/warehouse")}>
          Volver
        </Button>
      </Space>

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
        <HistoryOutlined style={{ fontSize: 18 }} />
        <Title level={4} style={{ margin: 0 }}>Historial de movimientos — Bodega</Title>
      </div>

      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={4}>
          <Select allowClear placeholder="Origen" style={{ width: "100%" }} value={filterOrigin} onChange={setFilterOrigin}
            options={[{ value: "ingredient", label: "🧂 Insumo" }, { value: "product", label: "📦 Reventa" }]}
          />
        </Col>
        <Col xs={24} sm={12} md={4}>
          <Select allowClear placeholder="Tipo" style={{ width: "100%" }} value={filterType} onChange={setFilterType}
            options={[{ value: "compra", label: "Compra" }, { value: "transferencia", label: "Transferencia" }, { value: "ajuste", label: "Ajuste" }]}
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Select allowClear showSearch placeholder="Insumo / Producto" style={{ width: "100%" }}
            value={filterIngredient} onChange={setFilterIngredient} disabled={filterOrigin === "product"}
            options={ingredients.map((i) => ({ value: i.id, label: i.name }))}
            filterOption={(input, option) => (option?.label ?? "").toLowerCase().includes(input.toLowerCase())}
          />
        </Col>
        <Col xs={24} sm={12} md={4}>
          <Select allowClear placeholder="Sucursal destino" style={{ width: "100%" }}
            value={filterBranch} onChange={setFilterBranch}
            options={branches.map((b) => ({ value: b.id, label: b.name }))}
          />
        </Col>
        <Col xs={24} sm={24} md={6}>
          <RangePicker style={{ width: "100%" }} value={filterDates}
            onChange={(dates) => setFilterDates(dates as [import("dayjs").Dayjs | null, import("dayjs").Dayjs | null] | null)}
            format="DD/MM/YYYY"
          />
        </Col>
      </Row>

      {isMobile ? (
        loading ? (
          <div style={{ textAlign: "center", padding: 40, color: "#9ca3af" }}>Cargando...</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {movements.map((r) => {
              const display = r.type === "compra" || r.quantity >= 0 ? `+${r.quantity}` : `${r.quantity}`;
              return (
                <div key={r.id} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: "12px 14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <Space size={4}>
                      <Tag color={MOVEMENT_TYPE_COLORS[r.type]} style={{ margin: 0 }}>{MOVEMENT_TYPE_LABELS[r.type] ?? r.type}</Tag>
                      {r.origin === "ingredient"
                        ? <Tag color="default" style={{ margin: 0 }}>🧂 Insumo</Tag>
                        : <Tag color="purple" style={{ margin: 0 }}>📦 Reventa</Tag>}
                    </Space>
                    <Text type="secondary" style={{ fontSize: 12 }}>{new Date(r.created_at).toLocaleString("es-BO")}</Text>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <Text strong>{r.detailName}</Text>
                      {r.unit && <Tag style={{ margin: "0 0 0 6px" }}>{r.unit}</Tag>}
                    </div>
                    <Text strong style={{ color: r.quantity >= 0 ? "#16a34a" : "#ef4444", fontSize: 15 }}>
                      {display} {r.unit}
                    </Text>
                  </div>
                  {(r.branches || r.notes) && (
                    <div style={{ marginTop: 6, display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {r.branches && <Tag style={{ margin: 0 }}>→ {r.branches.name}</Tag>}
                      {r.notes && <Text type="secondary" style={{ fontSize: 12 }}>{r.notes}</Text>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )
      ) : (
        <Table dataSource={movements} columns={columns} rowKey="id" loading={loading} pagination={{ pageSize: 30 }} />
      )}
    </div>
  );
}
