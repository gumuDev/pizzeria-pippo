"use client";

import Link from "next/link";
import { Row, Col, Card, Space, Typography, Tag, Button, Badge } from "antd";
import { WarningOutlined, ArrowRightOutlined } from "@ant-design/icons";
import type { StockAlert, WarehouseAlert } from "../services/dashboard.service";

const { Text } = Typography;

interface Props {
  stockAlerts: StockAlert[];
  warehouseAlerts: WarehouseAlert[];
}

export function DashboardStockAlerts({ stockAlerts, warehouseAlerts }: Props) {
  return (
    <>
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
    </>
  );
}
