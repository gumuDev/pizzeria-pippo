"use client";

import { Row, Col, Card, Statistic, Space, Typography, Avatar, Collapse, Table, Tag } from "antd";
import { UserOutlined } from "@ant-design/icons";
import type { CashierReport, TopProduct } from "../types/reports.types";

const { Text } = Typography;

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

interface Props {
  cashierReports: CashierReport[];
  loading: boolean;
}

export function CashierReportTable({ cashierReports, loading }: Props) {
  if (cashierReports.length === 0 && !loading) {
    return (
      <Card>
        <div className="flex items-center justify-center h-40 text-gray-400">
          Sin ventas para el período seleccionado
        </div>
      </Card>
    );
  }

  return (
    <>
      <Row gutter={[16, 16]} className="mb-6">
        {cashierReports.map((c) => (
          <Col xs={24} sm={12} lg={8} key={c.cashier_id}>
            <Card loading={loading}>
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
                    <Statistic title="Órdenes" value={c.orders} valueStyle={{ fontSize: 18 }} />
                  </Col>
                </Row>
              </Space>
            </Card>
          </Col>
        ))}
      </Row>

      <Collapse
        accordion
        items={cashierReports.map((c) => ({
          key: c.cashier_id,
          label: (
            <Space>
              <Avatar size="small" icon={<UserOutlined />} style={{ backgroundColor: "#f97316" }} />
              <Text strong>{c.cashier_name}</Text>
              <Text type="secondary">— {c.orders} órdenes</Text>
              <Text style={{ color: "#f97316", fontWeight: 600 }}>Bs {c.total.toFixed(2)}</Text>
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
  );
}
