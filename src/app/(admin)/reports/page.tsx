"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Select, DatePicker, Table, Tag, Typography,
  Row, Col, Card, Statistic, Button, Space, Tabs, Collapse, Avatar,
} from "antd";
import {
  ShoppingOutlined, DollarOutlined, BarChartOutlined,
  WarningOutlined, ArrowRightOutlined, UserOutlined, UnorderedListOutlined,
} from "@ant-design/icons";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import { supabase } from "@/lib/supabase";
import { UTC_OFFSET_HOURS } from "@/lib/timezone";
import dayjs, { Dayjs } from "dayjs";
import Link from "next/link";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const CATEGORY_COLORS: Record<string, string> = {
  pizza: "#f97316",
  bebida: "#3b82f6",
  otro: "#22c55e",
};

interface Branch { id: string; name: string; }
interface SalesSummary { total: number; count: number; avg: number; }
interface TopProduct {
  variant_id: string;
  product_name: string;
  variant_name: string;
  category: string;
  qty: number;
  revenue: number;
}
interface DailyData { date: string; total: number; }
interface StockAlert {
  id: string;
  quantity: number;
  min_quantity: number;
  ingredients: { name: string; unit: string };
  branches: { name: string };
}
interface CashierReport {
  cashier_id: string;
  cashier_name: string;
  orders: number;
  total: number;
  items: TopProduct[];
}

interface OrderItem {
  qty: number;
  unit_price: number;
  discount_applied: number;
  product_variants: {
    name: string;
    products: { name: string; category: string } | null;
  } | null;
}

interface Order {
  id: string;
  total: number;
  created_at: string;
  branch_id: string;
  cashier_name: string;
  payment_method: "efectivo" | "qr" | null;
  branches: { name: string } | null;
  order_items: OrderItem[];
}

const PRESET_RANGES: { label: string; range: [Dayjs, Dayjs] }[] = [
  { label: "Hoy", range: [dayjs(), dayjs()] },
  { label: "Esta semana", range: [dayjs().startOf("week"), dayjs()] },
  { label: "Este mes", range: [dayjs().startOf("month"), dayjs()] },
];

export default function ReportsPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>("all");
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([dayjs().startOf("month"), dayjs()]);
  const [summary, setSummary] = useState<SalesSummary | null>(null);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [dailyData, setDailyData] = useState<DailyData[]>([]);
  const [stockAlerts, setStockAlerts] = useState<StockAlert[]>([]);
  const [cashierReports, setCashierReports] = useState<CashierReport[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersTotal, setOrdersTotal] = useState(0);
  const [ordersPage, setOrdersPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [cashierLoading, setCashierLoading] = useState(false);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("general");

  const getToken = async () => {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? "";
  };

  const buildParams = useCallback(() => {
    const params = new URLSearchParams();
    if (selectedBranch !== "all") params.set("branchId", selectedBranch);
    params.set("from", dateRange[0].format("YYYY-MM-DD"));
    params.set("to", dateRange[1].format("YYYY-MM-DD"));
    return params.toString();
  }, [selectedBranch, dateRange]);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    const token = await getToken();
    const params = buildParams();
    const headers = { Authorization: `Bearer ${token}` };
    const alertParams = selectedBranch !== "all" ? `?branchId=${selectedBranch}` : "";

    const [salesRes, topRes, dailyRes, alertsRes] = await Promise.all([
      fetch(`/api/reports/sales?${params}`, { headers }),
      fetch(`/api/reports/top-products?${params}`, { headers }),
      fetch(`/api/reports/daily?${params}`, { headers }),
      fetch(`/api/stock/alerts${alertParams}`, { headers }),
    ]);

    const [salesData, topData, dailyRaw, alertsData] = await Promise.all([
      salesRes.json(), topRes.json(), dailyRes.json(), alertsRes.json(),
    ]);

    if (salesData && !salesData.error) setSummary(salesData);
    if (Array.isArray(topData)) setTopProducts(topData);
    if (Array.isArray(dailyRaw)) setDailyData(dailyRaw);
    if (Array.isArray(alertsData)) setStockAlerts(alertsData);
    setLoading(false);
  }, [buildParams, selectedBranch]);

  const fetchCashierReports = useCallback(async () => {
    setCashierLoading(true);
    const token = await getToken();
    const params = buildParams();
    const res = await fetch(`/api/reports/cashiers?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (Array.isArray(data)) setCashierReports(data);
    setCashierLoading(false);
  }, [buildParams]);

  const fetchOrders = useCallback(async (page = 1) => {
    setOrdersLoading(true);
    const token = await getToken();
    const params = buildParams();
    const res = await fetch(`/api/reports/orders?${params}&page=${page}&pageSize=20`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (data && !data.error) {
      setOrders(data.data ?? []);
      setOrdersTotal(data.total ?? 0);
    }
    setOrdersLoading(false);
  }, [buildParams]);

  useEffect(() => {
    const loadBranches = async () => {
      const { data } = await supabase.from("branches").select("*").order("name");
      if (data) setBranches(data);
    };
    loadBranches();
  }, []);

  useEffect(() => {
    if (activeTab === "general") fetchReports();
    if (activeTab === "cajeros") fetchCashierReports();
    if (activeTab === "ventas") { setOrdersPage(1); fetchOrders(1); }
  }, [activeTab, fetchReports, fetchCashierReports, fetchOrders]);

  // Pie chart data
  const categoryData = topProducts.reduce((acc, p) => {
    const existing = acc.find((a) => a.name === p.category);
    if (existing) { existing.value += p.revenue; }
    else { acc.push({ name: p.category, value: p.revenue }); }
    return acc;
  }, [] as { name: string; value: number }[]);

  const topProductColumns = [
    {
      title: "Producto",
      key: "product",
      render: (_: unknown, r: TopProduct) => (
        <Space direction="vertical" size={0}>
          <Text strong>{r.product_name}</Text>
          <Text type="secondary" style={{ fontSize: 11 }}>{r.variant_name}</Text>
        </Space>
      ),
    },
    {
      title: "Categoría",
      dataIndex: "category",
      key: "category",
      render: (cat: string) => (
        <Tag color={cat === "pizza" ? "red" : cat === "bebida" ? "blue" : "green"}>{cat}</Tag>
      ),
    },
    {
      title: "Unidades",
      dataIndex: "qty",
      key: "qty",
      sorter: (a: TopProduct, b: TopProduct) => b.qty - a.qty,
      render: (qty: number) => <Text strong>{qty}</Text>,
    },
    {
      title: "Ingresos",
      dataIndex: "revenue",
      key: "revenue",
      sorter: (a: TopProduct, b: TopProduct) => b.revenue - a.revenue,
      render: (rev: number) => <Text strong style={{ color: "#f97316" }}>Bs {rev.toFixed(2)}</Text>,
    },
  ];

  const alertColumns = [
    {
      title: "Insumo",
      key: "ingredient",
      render: (_: unknown, r: StockAlert) => (
        <Space>
          <WarningOutlined style={{ color: "#ef4444" }} />
          <Text>{r.ingredients?.name}</Text>
        </Space>
      ),
    },
    { title: "Unidad", key: "unit", render: (_: unknown, r: StockAlert) => <Tag>{r.ingredients?.unit}</Tag> },
    { title: "Sucursal", key: "branch", render: (_: unknown, r: StockAlert) => r.branches?.name },
    {
      title: "Stock actual",
      dataIndex: "quantity",
      key: "quantity",
      render: (q: number) => <Text style={{ color: "#ef4444", fontWeight: 700 }}>{q}</Text>,
    },
    {
      title: "Mínimo",
      dataIndex: "min_quantity",
      key: "min_quantity",
      render: (m: number) => <Text type="secondary">{m}</Text>,
    },
  ];

  const cashierItemColumns = [
    {
      title: "Producto",
      key: "product",
      render: (_: unknown, r: TopProduct) => (
        <Space direction="vertical" size={0}>
          <Text strong>{r.product_name}</Text>
          <Text type="secondary" style={{ fontSize: 11 }}>{r.variant_name}</Text>
        </Space>
      ),
    },
    {
      title: "Categoría",
      dataIndex: "category",
      key: "category",
      render: (cat: string) => (
        <Tag color={cat === "pizza" ? "red" : cat === "bebida" ? "blue" : "green"}>{cat}</Tag>
      ),
    },
    {
      title: "Unidades",
      dataIndex: "qty",
      key: "qty",
      sorter: (a: TopProduct, b: TopProduct) => b.qty - a.qty,
      render: (qty: number) => <Text strong>{qty}</Text>,
    },
    {
      title: "Ingresos",
      dataIndex: "revenue",
      key: "revenue",
      sorter: (a: TopProduct, b: TopProduct) => b.revenue - a.revenue,
      render: (rev: number) => <Text strong style={{ color: "#f97316" }}>Bs {rev.toFixed(2)}</Text>,
    },
  ];

  // Shared filters header
  const filtersBar = (
    <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
      <Title level={4} className="!mb-0">Reportes</Title>
      <Space wrap>
        {PRESET_RANGES.map((p) => (
          <Button key={p.label} size="small" onClick={() => setDateRange(p.range)}>
            {p.label}
          </Button>
        ))}
        <RangePicker
          value={dateRange}
          onChange={(v) => { if (v?.[0] && v?.[1]) setDateRange([v[0], v[1]]); }}
          format="DD/MM/YYYY"
          size="small"
        />
        <Select
          value={selectedBranch}
          onChange={setSelectedBranch}
          style={{ width: 180 }}
          size="small"
          options={[
            { value: "all", label: "Todas las sucursales" },
            ...branches.map((b) => ({ value: b.id, label: b.name })),
          ]}
        />
      </Space>
    </div>
  );

  return (
    <div className="p-6">
      {filtersBar}

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: "general",
            label: "General",
            children: (
              <>
                {/* Summary cards */}
                <Row gutter={16} className="mb-6">
                  <Col xs={24} sm={8}>
                    <Card>
                      <Statistic
                        title="Total ventas"
                        value={summary?.total ?? 0}
                        prefix={<DollarOutlined />}
                        suffix="Bs"
                        precision={2}
                        loading={loading}
                        valueStyle={{ color: "#f97316" }}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={8}>
                    <Card>
                      <Statistic
                        title="Órdenes"
                        value={summary?.count ?? 0}
                        prefix={<ShoppingOutlined />}
                        loading={loading}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={8}>
                    <Card>
                      <Statistic
                        title="Ticket promedio"
                        value={summary?.avg ?? 0}
                        prefix={<BarChartOutlined />}
                        suffix="Bs"
                        precision={2}
                        loading={loading}
                      />
                    </Card>
                  </Col>
                </Row>

                {/* Charts */}
                <Row gutter={16} className="mb-6">
                  <Col xs={24} lg={16}>
                    <Card title="Ventas por día" size="small">
                      {dailyData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={220}>
                          <LineChart data={dailyData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                              dataKey="date"
                              tickFormatter={(d) => dayjs(d).format("DD/MM")}
                              tick={{ fontSize: 11 }}
                            />
                            <YAxis tick={{ fontSize: 11 }} />
                            <Tooltip
                              formatter={(v: number) => [`Bs ${v.toFixed(2)}`, "Ventas"]}
                              labelFormatter={(d) => dayjs(d).format("DD/MM/YYYY")}
                            />
                            <Line
                              type="monotone"
                              dataKey="total"
                              stroke="#f97316"
                              strokeWidth={2}
                              dot={{ r: 3 }}
                              activeDot={{ r: 5 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex items-center justify-center h-48 text-gray-400">
                          Sin datos para el período
                        </div>
                      )}
                    </Card>
                  </Col>
                  <Col xs={24} lg={8}>
                    <Card title="Por categoría" size="small">
                      {categoryData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={220}>
                          <PieChart>
                            <Pie
                              data={categoryData}
                              cx="50%"
                              cy="50%"
                              innerRadius={50}
                              outerRadius={80}
                              dataKey="value"
                              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                              labelLine={false}
                            >
                              {categoryData.map((entry) => (
                                <Cell key={entry.name} fill={CATEGORY_COLORS[entry.name] ?? "#94a3b8"} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(v: number) => `Bs ${v.toFixed(2)}`} />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex items-center justify-center h-48 text-gray-400">
                          Sin datos
                        </div>
                      )}
                    </Card>
                  </Col>
                </Row>

                {/* Top products */}
                <Card title="Productos más vendidos" size="small" className="mb-6">
                  <Table
                    dataSource={topProducts}
                    columns={topProductColumns}
                    rowKey="variant_id"
                    loading={loading}
                    pagination={{ pageSize: 10 }}
                    size="small"
                  />
                </Card>

                {/* Stock alerts */}
                {stockAlerts.length > 0 && (
                  <Card
                    title={
                      <Space>
                        <WarningOutlined style={{ color: "#ef4444" }} />
                        <Text>Insumos bajo mínimo ({stockAlerts.length})</Text>
                      </Space>
                    }
                    size="small"
                    extra={
                      <Link href="/stock">
                        <Button size="small" icon={<ArrowRightOutlined />}>Ir a stock</Button>
                      </Link>
                    }
                  >
                    <Table
                      dataSource={stockAlerts}
                      columns={alertColumns}
                      rowKey="id"
                      pagination={false}
                      size="small"
                    />
                  </Card>
                )}
              </>
            ),
          },
          {
            key: "ventas",
            label: (
              <Space>
                <UnorderedListOutlined />
                Historial de ventas
              </Space>
            ),
            children: (
              <Card size="small">
                <Table
                  dataSource={orders}
                  rowKey="id"
                  loading={ordersLoading}
                  size="small"
                  pagination={{
                    current: ordersPage,
                    pageSize: 20,
                    total: ordersTotal,
                    showSizeChanger: false,
                    showTotal: (t) => `${t} ventas`,
                    onChange: (p) => { setOrdersPage(p); fetchOrders(p); },
                  }}
                  expandable={{
                    expandedRowRender: (order) => (
                      <Table
                        dataSource={order.order_items}
                        rowKey={(item) => `${item.product_variants?.name}-${item.qty}`}
                        size="small"
                        pagination={false}
                        columns={[
                          {
                            title: "Producto",
                            key: "product",
                            render: (_: unknown, item: OrderItem) => (
                              <Space direction="vertical" size={0}>
                                <Text strong>{item.product_variants?.products?.name}</Text>
                                <Text type="secondary" style={{ fontSize: 11 }}>{item.product_variants?.name}</Text>
                              </Space>
                            ),
                          },
                          {
                            title: "Categoría",
                            key: "category",
                            render: (_: unknown, item: OrderItem) => {
                              const cat = item.product_variants?.products?.category ?? "";
                              return <Tag color={cat === "pizza" ? "red" : cat === "bebida" ? "blue" : "green"}>{cat}</Tag>;
                            },
                          },
                          {
                            title: "Cant.",
                            dataIndex: "qty",
                            key: "qty",
                            width: 60,
                            render: (qty: number) => <Text strong>{qty}</Text>,
                          },
                          {
                            title: "Precio unit.",
                            dataIndex: "unit_price",
                            key: "unit_price",
                            render: (p: number) => `Bs ${Number(p).toFixed(2)}`,
                          },
                          {
                            title: "Descuento",
                            dataIndex: "discount_applied",
                            key: "discount_applied",
                            render: (d: number) =>
                              Number(d) > 0
                                ? <Text style={{ color: "#ef4444" }}>-Bs {Number(d).toFixed(2)}</Text>
                                : <Text type="secondary">—</Text>,
                          },
                          {
                            title: "Subtotal",
                            key: "subtotal",
                            render: (_: unknown, item: OrderItem) => {
                              const sub = (Number(item.unit_price) * item.qty) - Number(item.discount_applied);
                              return <Text strong style={{ color: "#f97316" }}>Bs {sub.toFixed(2)}</Text>;
                            },
                          },
                        ]}
                      />
                    ),
                  }}
                  columns={[
                    {
                      title: "Fecha y hora",
                      dataIndex: "created_at",
                      key: "created_at",
                      render: (d: string) =>
                        dayjs(d).add(UTC_OFFSET_HOURS, "hour").format("DD/MM/YYYY HH:mm"),
                    },
                    {
                      title: "Sucursal",
                      key: "branch",
                      render: (_: unknown, o: Order) => o.branches?.name ?? "—",
                    },
                    {
                      title: "Cajero",
                      key: "cashier",
                      render: (_: unknown, o: Order) => o.cashier_name,
                    },
                    {
                      title: "Items",
                      key: "items",
                      render: (_: unknown, o: Order) => {
                        const names = o.order_items
                          .map((i) => `${i.qty}x ${i.product_variants?.products?.name} ${i.product_variants?.name}`)
                          .join(", ");
                        return (
                          <Text style={{ maxWidth: 280, display: "inline-block" }} ellipsis={{ tooltip: names }}>
                            {names}
                          </Text>
                        );
                      },
                    },
                    {
                      title: "Pago",
                      dataIndex: "payment_method",
                      key: "payment_method",
                      render: (m: string | null) =>
                        m === "efectivo" ? <Tag color="green">💵 Efectivo</Tag>
                        : m === "qr" ? <Tag color="blue">📱 QR</Tag>
                        : <Text type="secondary">—</Text>,
                    },
                    {
                      title: "Total",
                      dataIndex: "total",
                      key: "total",
                      align: "right" as const,
                      render: (t: number) => (
                        <Text strong style={{ color: "#f97316" }}>Bs {Number(t).toFixed(2)}</Text>
                      ),
                    },
                  ]}
                />
                {/* Resumen por método de pago */}
                {orders.length > 0 && (() => {
                  const efectivo = orders.filter((o) => o.payment_method === "efectivo").reduce((s, o) => s + Number(o.total), 0);
                  const qr = orders.filter((o) => o.payment_method === "qr").reduce((s, o) => s + Number(o.total), 0);
                  const sinEspecificar = orders.filter((o) => !o.payment_method).reduce((s, o) => s + Number(o.total), 0);
                  const grandTotal = efectivo + qr + sinEspecificar;
                  return (
                    <div className="mt-4 p-4 bg-gray-50 rounded border text-sm">
                      <Text strong className="block mb-2">Resumen por método de pago (página actual)</Text>
                      <div className="flex flex-col gap-1">
                        <div className="flex justify-between">
                          <Text strong>Total cobrado</Text>
                          <Text strong style={{ color: "#f97316" }}>Bs {grandTotal.toFixed(2)}</Text>
                        </div>
                        <div className="flex justify-between pl-4">
                          <Text type="secondary">💵 Efectivo</Text>
                          <Text>Bs {efectivo.toFixed(2)}</Text>
                        </div>
                        <div className="flex justify-between pl-4">
                          <Text type="secondary">📱 QR</Text>
                          <Text>Bs {qr.toFixed(2)}</Text>
                        </div>
                        <div className="flex justify-between pl-4">
                          <Text type="secondary">Sin especificar</Text>
                          <Text>Bs {sinEspecificar.toFixed(2)}</Text>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </Card>
            ),
          },
          {
            key: "cajeros",
            label: (
              <Space>
                <UserOutlined />
                Por cajero
              </Space>
            ),
            children: (
              <>
                {cashierReports.length === 0 && !cashierLoading ? (
                  <Card>
                    <div className="flex items-center justify-center h-40 text-gray-400">
                      Sin ventas para el período seleccionado
                    </div>
                  </Card>
                ) : (
                  <>
                    {/* Resumen por cajero */}
                    <Row gutter={[16, 16]} className="mb-6">
                      {cashierReports.map((c) => (
                        <Col xs={24} sm={12} lg={8} key={c.cashier_id}>
                          <Card loading={cashierLoading}>
                            <Space direction="vertical" style={{ width: "100%" }}>
                              <Space>
                                <Avatar icon={<UserOutlined />} style={{ backgroundColor: "#f97316" }} />
                                <Text strong style={{ fontSize: 15 }}>{c.cashier_name}</Text>
                              </Space>
                              <Row gutter={8}>
                                <Col span={12}>
                                  <Statistic
                                    title="Ventas"
                                    value={c.total}
                                    suffix="Bs"
                                    precision={2}
                                    valueStyle={{ color: "#f97316", fontSize: 18 }}
                                  />
                                </Col>
                                <Col span={12}>
                                  <Statistic
                                    title="Órdenes"
                                    value={c.orders}
                                    valueStyle={{ fontSize: 18 }}
                                  />
                                </Col>
                              </Row>
                            </Space>
                          </Card>
                        </Col>
                      ))}
                    </Row>

                    {/* Detalle por cajero (expandible) */}
                    <Collapse
                      accordion
                      items={cashierReports.map((c) => ({
                        key: c.cashier_id,
                        label: (
                          <Space>
                            <Avatar size="small" icon={<UserOutlined />} style={{ backgroundColor: "#f97316" }} />
                            <Text strong>{c.cashier_name}</Text>
                            <Text type="secondary">— {c.orders} órdenes</Text>
                            <Text style={{ color: "#f97316", fontWeight: 600 }}>
                              Bs {c.total.toFixed(2)}
                            </Text>
                          </Space>
                        ),
                        children: (
                          <Table
                            dataSource={c.items.sort((a, b) => b.qty - a.qty)}
                            columns={cashierItemColumns}
                            rowKey="variant_id"
                            pagination={false}
                            size="small"
                          />
                        ),
                      }))}
                    />
                  </>
                )}
              </>
            ),
          },
        ]}
      />
    </div>
  );
}
