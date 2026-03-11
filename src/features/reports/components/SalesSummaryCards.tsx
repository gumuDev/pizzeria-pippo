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
          {!loading && summary && (
            <div className="mt-2 flex flex-col gap-0.5 text-xs text-gray-500">
              <div className="flex justify-between">
                <Text type="secondary">🍽️ Comer aquí ({dineIn?.count ?? 0})</Text>
                <Text type="secondary">Bs {(dineIn?.total ?? 0).toFixed(2)}</Text>
              </div>
              <div className="flex justify-between">
                <Text type="secondary">🥡 Para llevar ({takeaway?.count ?? 0})</Text>
                <Text type="secondary">Bs {(takeaway?.total ?? 0).toFixed(2)}</Text>
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
