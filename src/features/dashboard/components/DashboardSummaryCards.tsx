"use client";

import Link from "next/link";
import { Row, Col, Card, Statistic, Button } from "antd";
import {
  DollarOutlined, ShoppingOutlined, BarChartOutlined,
  WarningOutlined, ArrowRightOutlined,
} from "@ant-design/icons";
import type { SalesSummary } from "../services/dashboard.service";

interface Props {
  summary: SalesSummary | null;
  stockAlertsCount: number;
  loading: boolean;
}

export function DashboardSummaryCards({ summary, stockAlertsCount, loading }: Props) {
  return (
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
            value={stockAlertsCount}
            prefix={
              stockAlertsCount > 0
                ? <WarningOutlined style={{ color: "#ef4444" }} />
                : <WarningOutlined style={{ color: "#22c55e" }} />
            }
            loading={loading}
            valueStyle={{ color: stockAlertsCount > 0 ? "#ef4444" : "#22c55e" }}
            suffix={
              stockAlertsCount > 0 ? (
                <Link href="/stock">
                  <Button type="link" size="small" icon={<ArrowRightOutlined />} style={{ padding: 0 }} />
                </Link>
              ) : null
            }
          />
        </Card>
      </Col>
    </Row>
  );
}
