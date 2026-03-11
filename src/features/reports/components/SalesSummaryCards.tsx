"use client";

import { Row, Col, Card, Statistic, Typography } from "antd";
import { DollarOutlined, ShoppingOutlined, BarChartOutlined } from "@ant-design/icons";
import type { SalesSummary } from "../types/reports.types";

const { Text } = Typography;

interface Props {
  summary: SalesSummary | null;
  loading: boolean;
}

export function SalesSummaryCards({ summary, loading }: Props) {
  const dineIn = summary?.by_order_type?.dine_in;
  const takeaway = summary?.by_order_type?.takeaway;

  return (
    <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
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
          {!loading && summary && (
            <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 2 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <Text type="secondary" style={{ fontSize: 12 }}>🍽️ Comer aquí ({dineIn?.count ?? 0})</Text>
                <Text type="secondary" style={{ fontSize: 12 }}>Bs {(dineIn?.total ?? 0).toFixed(2)}</Text>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <Text type="secondary" style={{ fontSize: 12 }}>🥡 Para llevar ({takeaway?.count ?? 0})</Text>
                <Text type="secondary" style={{ fontSize: 12 }}>Bs {(takeaway?.total ?? 0).toFixed(2)}</Text>
              </div>
            </div>
          )}
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
  );
}
