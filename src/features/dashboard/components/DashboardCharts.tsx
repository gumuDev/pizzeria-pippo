"use client";

import Link from "next/link";
import { Row, Col, Card, Space, Table, Typography, Tag, Button } from "antd";
import { FireOutlined, ArrowRightOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";
import type { TopProduct, DailyData } from "../services/dashboard.service";

const { Text } = Typography;

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
      <Tag color={cat === "pizza" ? "red" : cat === "bebida" ? "blue" : "green"}>{cat}</Tag>
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

interface Props {
  dailyData: DailyData[];
  topProducts: TopProduct[];
  loading: boolean;
}

export function DashboardCharts({ dailyData, topProducts, loading }: Props) {
  return (
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
                  formatter={(v) => [`Bs ${Number(v).toFixed(2)}`, "Ventas"]}
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
  );
}
