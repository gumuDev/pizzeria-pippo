"use client";

import { Row, Col, Card, Statistic } from "antd";
import { DollarOutlined, ShoppingOutlined, BarChartOutlined } from "@ant-design/icons";
import type { SalesSummary } from "../types/reports.types";

interface Props {
  summary: SalesSummary | null;
  loading: boolean;
}

export function SalesSummaryCards({ summary, loading }: Props) {
  return (
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
  );
}
