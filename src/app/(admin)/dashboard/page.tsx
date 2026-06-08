"use client";

import dayjs from "dayjs";
import { Button } from "antd";
import { ShoppingCartOutlined } from "@ant-design/icons";
import { DashboardSummaryCards } from "@/features/dashboard/components/DashboardSummaryCards";
import { DashboardCharts } from "@/features/dashboard/components/DashboardCharts";
import { DashboardStockAlerts } from "@/features/dashboard/components/DashboardStockAlerts";
import { useDashboard } from "@/features/dashboard/hooks/useDashboard";

export default function DashboardPage() {
  const { summary, topProducts, dailyData, stockAlerts, warehouseAlerts, loading } = useDashboard();

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h2 className="text-lg font-semibold m-0">Dashboard</h2>
          <p className="text-gray-400 text-sm mt-0.5">Resumen de hoy — {dayjs().format("dddd, D [de] MMMM YYYY")}</p>
        </div>
        <Button
          type="primary"
          icon={<ShoppingCartOutlined />}
          href="/pos"
          target="_blank"
          style={{ background: "#ea580c", borderColor: "#ea580c" }}
        >
          Ir al POS
        </Button>
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
