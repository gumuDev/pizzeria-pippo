"use client";

import { useState, useEffect } from "react";
import {
  Row, Col, Card, Statistic, Typography, Space, Tag, Button, Table, Badge,
} from "antd";
import {
  DollarOutlined, ShoppingOutlined, BarChartOutlined,
  WarningOutlined, ArrowRightOutlined, FireOutlined,
} from "@ant-design/icons";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";
import { supabase } from "@/lib/supabase";
import dayjs from "dayjs";
import Link from "next/link";

const { Title, Text } = Typography;

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

interface WarehouseAlert {
  id: string;
  ingredient_id: string;
  quantity: number;
  min_quantity: number;
  ingredients: { name: string; unit: string };
}

export default function DashboardPage() {
  const [summary, setSummary] = useState<SalesSummary | null>(null);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [dailyData, setDailyData] = useState<DailyData[]>([]);
  const [stockAlerts, setStockAlerts] = useState<StockAlert[]>([]);
  const [warehouseAlerts, setWarehouseAlerts] = useState<WarehouseAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token ?? "";
      const headers = { Authorization: `Bearer ${token}` };

      const today = dayjs().format("YYYY-MM-DD");
      const weekStart = dayjs().subtract(6, "day").format("YYYY-MM-DD");

      const [salesRes, topRes, dailyRes, alertsRes, warehouseStockRes] = await Promise.all([
        fetch(`/api/reports/sales?from=${today}&to=${today}`, { headers }),
        fetch(`/api/reports/top-products?from=${today}&to=${today}`, { headers }),
        fetch(`/api/reports/daily?from=${weekStart}&to=${today}`, { headers }),
        fetch(`/api/stock/alerts`, { headers }),
        fetch(`/api/warehouse/stock`, { headers }),
      ]);

      const [salesData, topData, dailyRaw, alertsData, warehouseData] = await Promise.all([
        salesRes.json(), topRes.json(), dailyRes.json(), alertsRes.json(), warehouseStockRes.json(),
      ]);

      if (salesData && !salesData.error) setSummary(salesData);
      if (Array.isArray(topData)) setTopProducts(topData.slice(0, 5));
      if (Array.isArray(dailyRaw)) setDailyData(dailyRaw);
      if (Array.isArray(alertsData)) setStockAlerts(alertsData);
      if (Array.isArray(warehouseData)) {
        setWarehouseAlerts(warehouseData.filter((w: WarehouseAlert) => w.quantity < w.min_quantity));
      }
      setLoading(false);
    };
    load();
  }, []);

  const topColumns = [
    {
      title: "Producto",
      key: "product",
      render: (_: unknown, r: TopProduct) => (
        <Space direction="vertical" size={0}>
          <Text strong style={{ fontSize: 13 }}>{r.product_name}</Text>
          <Text type="secondary" style={{ fontSize: 11 }}>{r.variant_name}</Text>
        </Space>
      ),
    },
    {
      title: "Cat.",
      dataIndex: "category",
      key: "category",
      render: (cat: string) => (
        <Tag color={cat === "pizza" ? "red" : cat === "bebida" ? "blue" : "green"}>
          {cat}
        </Tag>
      ),
    },
    {
      title: "Uds.",
      dataIndex: "qty",
      key: "qty",
      render: (qty: number) => <Text strong>{qty}</Text>,
    },
    {
      title: "Ingresos",
      dataIndex: "revenue",
      key: "revenue",
      render: (rev: number) => (
        <Text strong style={{ color: "#f97316" }}>Bs {rev.toFixed(2)}</Text>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0 }}>Dashboard</Title>
        <Text type="secondary">Resumen de hoy — {dayjs().format("dddd, D [de] MMMM YYYY")}</Text>
      </div>

      {/* KPIs del día */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Ventas hoy"
              value={summary?.total ?? 0}
              prefix={<DollarOutlined style={{ color: "#f97316" }} />}
              suffix="Bs"
              precision={2}
              loading={loading}
              valueStyle={{ color: "#f97316" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Órdenes hoy"
              value={summary?.count ?? 0}
              prefix={<ShoppingOutlined style={{ color: "#3b82f6" }} />}
              loading={loading}
              valueStyle={{ color: "#3b82f6" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Ticket promedio"
              value={summary?.avg ?? 0}
              prefix={<BarChartOutlined style={{ color: "#22c55e" }} />}
              suffix="Bs"
              precision={2}
              loading={loading}
              valueStyle={{ color: "#22c55e" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Alertas de stock"
              value={stockAlerts.length + warehouseAlerts.length}
              prefix={
                (stockAlerts.length + warehouseAlerts.length) > 0
                  ? <WarningOutlined style={{ color: "#ef4444" }} />
                  : <WarningOutlined style={{ color: "#22c55e" }} />
              }
              loading={loading}
              valueStyle={{ color: (stockAlerts.length + warehouseAlerts.length) > 0 ? "#ef4444" : "#22c55e" }}
              suffix={
                (stockAlerts.length + warehouseAlerts.length) > 0 ? (
                  <Link href="/stock">
                    <Button type="link" size="small" icon={<ArrowRightOutlined />} style={{ padding: 0 }} />
                  </Link>
                ) : null
              }
            />
          </Card>
        </Col>
      </Row>

      {/* Gráfico + Top productos */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={14}>
          <Card
            title="Ventas últimos 7 días"
            size="small"
            extra={
              <Link href="/reports">
                <Button size="small" icon={<ArrowRightOutlined />}>Ver reportes</Button>
              </Link>
            }
          >
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
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 220, color: "#94a3b8" }}>
                Sin ventas en los últimos 7 días
              </div>
            )}
          </Card>
        </Col>

        <Col xs={24} lg={10}>
          <Card
            title={
              <Space>
                <FireOutlined style={{ color: "#f97316" }} />
                Top 5 hoy
              </Space>
            }
            size="small"
            style={{ height: "100%" }}
          >
            {topProducts.length > 0 ? (
              <Table
                dataSource={topProducts}
                columns={topColumns}
                rowKey="variant_id"
                loading={loading}
                pagination={false}
                size="small"
              />
            ) : (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 180, color: "#94a3b8" }}>
                Sin ventas hoy
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* Alertas de stock — sucursales */}
      {stockAlerts.length > 0 && (
        <Card
          title={
            <Space>
              <WarningOutlined style={{ color: "#ef4444" }} />
              <Text>Insumos bajo mínimo en sucursales</Text>
              <Badge count={stockAlerts.length} color="#ef4444" />
            </Space>
          }
          size="small"
          style={{ marginBottom: 16 }}
          extra={
            <Link href="/stock">
              <Button size="small" icon={<ArrowRightOutlined />}>Ir a stock</Button>
            </Link>
          }
        >
          <Row gutter={[8, 8]}>
            {stockAlerts.map((alert) => (
              <Col xs={24} sm={12} lg={8} key={alert.id}>
                <Card size="small" style={{ borderColor: "#fca5a5", background: "#fff5f5" }}>
                  <Space direction="vertical" size={2} style={{ width: "100%" }}>
                    <Space>
                      <WarningOutlined style={{ color: "#ef4444" }} />
                      <Text strong style={{ fontSize: 13 }}>{alert.ingredients?.name}</Text>
                      <Tag>{alert.ingredients?.unit}</Tag>
                    </Space>
                    <Text type="secondary" style={{ fontSize: 12 }}>{alert.branches?.name}</Text>
                    <Space>
                      <Text style={{ color: "#ef4444", fontWeight: 700 }}>{alert.quantity}</Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>/ mín. {alert.min_quantity}</Text>
                    </Space>
                  </Space>
                </Card>
              </Col>
            ))}
          </Row>
        </Card>
      )}

      {/* Alertas de stock — bodega */}
      {warehouseAlerts.length > 0 && (
        <Card
          title={
            <Space>
              <WarningOutlined style={{ color: "#f97316" }} />
              <Text>Insumos bajo mínimo en bodega</Text>
              <Badge count={warehouseAlerts.length} color="#f97316" />
            </Space>
          }
          size="small"
          extra={
            <Link href="/warehouse">
              <Button size="small" icon={<ArrowRightOutlined />}>Ir a bodega</Button>
            </Link>
          }
        >
          <Row gutter={[8, 8]}>
            {warehouseAlerts.map((alert) => (
              <Col xs={24} sm={12} lg={8} key={alert.id}>
                <Card size="small" style={{ borderColor: "#fed7aa", background: "#fff7ed" }}>
                  <Space direction="vertical" size={2} style={{ width: "100%" }}>
                    <Space>
                      <WarningOutlined style={{ color: "#f97316" }} />
                      <Text strong style={{ fontSize: 13 }}>{alert.ingredients?.name}</Text>
                      <Tag>{alert.ingredients?.unit}</Tag>
                    </Space>
                    <Text type="secondary" style={{ fontSize: 12 }}>Bodega central</Text>
                    <Space>
                      <Text style={{ color: "#f97316", fontWeight: 700 }}>{alert.quantity}</Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>/ mín. {alert.min_quantity}</Text>
                    </Space>
                  </Space>
                </Card>
              </Col>
            ))}
          </Row>
        </Card>
      )}
    </div>
  );
}
