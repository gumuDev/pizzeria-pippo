"use client";

import dayjs from "dayjs";
import { Typography } from "antd";
import { DashboardSummaryCards } from "@/features/dashboard/components/DashboardSummaryCards";
import { DashboardCharts } from "@/features/dashboard/components/DashboardCharts";
import { DashboardStockAlerts } from "@/features/dashboard/components/DashboardStockAlerts";
import { useDashboard } from "@/features/dashboard/hooks/useDashboard";

const { Title, Text } = Typography;

export default function DashboardPage() {
  const { summary, topProducts, dailyData, stockAlerts, warehouseAlerts, loading } = useDashboard();

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0 }}>Dashboard</Title>
        <Text type="secondary">Resumen de hoy — {dayjs().format("dddd, D [de] MMMM YYYY")}</Text>
      </div>

      <DashboardSummaryCards
        summary={summary}
        stockAlertsCount={stockAlerts.length + warehouseAlerts.length}
        loading={loading}
      />

      <DashboardCharts
        dailyData={dailyData}
        topProducts={topProducts}
        loading={loading}
      />

      <DashboardStockAlerts
        stockAlerts={stockAlerts}
        warehouseAlerts={warehouseAlerts}
      />
    </div>
  );
}
