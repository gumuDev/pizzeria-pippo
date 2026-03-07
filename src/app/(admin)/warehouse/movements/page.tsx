"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Table, Typography, Tag, Space, Button, Select, DatePicker, Row, Col,
} from "antd";
import { ArrowLeftOutlined, HistoryOutlined } from "@ant-design/icons";
import { supabase } from "@/lib/supabase";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

interface Ingredient { id: string; name: string; unit: string; }
interface Branch { id: string; name: string; }
interface Movement {
  id: string;
  ingredient_id: string;
  quantity: number;
  type: "compra" | "transferencia" | "ajuste";
  branch_id: string | null;
  notes: string | null;
  created_at: string;
  ingredients: Ingredient;
  branches: Branch | null;
}

const TYPE_COLORS: Record<string, string> = {
  compra: "green",
  transferencia: "blue",
  ajuste: "orange",
};

const TYPE_LABELS: Record<string, string> = {
  compra: "Compra",
  transferencia: "Transferencia",
  ajuste: "Ajuste",
};

export default function WarehouseMovementsPage() {
  const router = useRouter();
  const [movements, setMovements] = useState<Movement[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(false);

  const [filterType, setFilterType] = useState<string | undefined>();
  const [filterIngredient, setFilterIngredient] = useState<string | undefined>();
  const [filterBranch, setFilterBranch] = useState<string | undefined>();
  const [filterDates, setFilterDates] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);

  const getToken = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? "";
  }, []);

  const fetchMovements = useCallback(async () => {
    setLoading(true);
    const token = await getToken();

    const params = new URLSearchParams();
    if (filterType) params.set("type", filterType);
    if (filterIngredient) params.set("ingredientId", filterIngredient);
    if (filterBranch) params.set("branchId", filterBranch);
    if (filterDates?.[0]) params.set("from", filterDates[0].startOf("day").toISOString());
    if (filterDates?.[1]) params.set("to", filterDates[1].endOf("day").toISOString());

    const res = await fetch(`/api/warehouse/movements?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (Array.isArray(data)) setMovements(data);
    setLoading(false);
  }, [getToken, filterType, filterIngredient, filterBranch, filterDates]);

  useEffect(() => {
    supabase.from("ingredients").select("id, name, unit").eq("is_active", true).order("name")
      .then(({ data }) => { if (data) setIngredients(data); });
    supabase.from("branches").select("id, name").eq("is_active", true).order("name")
      .then(({ data }) => { if (data) setBranches(data); });
  }, []);

  useEffect(() => { fetchMovements(); }, [fetchMovements]);

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
      render: (t: string) => <Tag color={TYPE_COLORS[t]}>{TYPE_LABELS[t] ?? t}</Tag>,
    },
    {
      title: "Insumo",
      key: "ingredient",
      render: (_: unknown, r: Movement) => (
        <Space>
          <Text>{r.ingredients?.name}</Text>
          <Tag>{r.ingredients?.unit}</Tag>
        </Space>
      ),
    },
    {
      title: "Cantidad",
      dataIndex: "quantity",
      key: "quantity",
      render: (q: number, r: Movement) => {
        const display = r.type === "compra" ? `+${q}` : q >= 0 ? `+${q}` : `${q}`;
        const color = q >= 0 ? "text-green-600" : "text-red-500";
        return <Text className={color}>{display} {r.ingredients?.unit}</Text>;
      },
    },
    {
      title: "Destino",
      key: "branch",
      render: (_: unknown, r: Movement) =>
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
    <div className="p-6">
      <Space className="mb-4">
        <Button icon={<ArrowLeftOutlined />} type="text" onClick={() => router.push("/warehouse")}>
          Volver
        </Button>
      </Space>

      <div className="flex items-center gap-3 mb-6">
        <HistoryOutlined className="text-lg" />
        <Title level={4} className="!mb-0">Historial de movimientos — Bodega</Title>
      </div>

      {/* Filters */}
      <Row gutter={[12, 12]} className="mb-4">
        <Col xs={24} sm={12} md={6}>
          <Select
            allowClear
            placeholder="Tipo"
            style={{ width: "100%" }}
            value={filterType}
            onChange={setFilterType}
            options={[
              { value: "compra", label: "Compra" },
              { value: "transferencia", label: "Transferencia" },
              { value: "ajuste", label: "Ajuste" },
            ]}
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Select
            allowClear
            showSearch
            placeholder="Insumo"
            style={{ width: "100%" }}
            value={filterIngredient}
            onChange={setFilterIngredient}
            options={ingredients.map((i) => ({ value: i.id, label: i.name }))}
            filterOption={(input, option) =>
              (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
            }
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Select
            allowClear
            placeholder="Sucursal destino"
            style={{ width: "100%" }}
            value={filterBranch}
            onChange={setFilterBranch}
            options={branches.map((b) => ({ value: b.id, label: b.name }))}
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <RangePicker
            style={{ width: "100%" }}
            value={filterDates}
            onChange={(dates) => setFilterDates(dates as [dayjs.Dayjs | null, dayjs.Dayjs | null] | null)}
            format="DD/MM/YYYY"
          />
        </Col>
      </Row>

      <Table
        dataSource={movements}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 30 }}
      />
    </div>
  );
}
