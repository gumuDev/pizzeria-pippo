"use client";

import { useEffect } from "react";
import { Tabs, Space } from "antd";
import { UnorderedListOutlined, UserOutlined } from "@ant-design/icons";
import { Row, Col } from "antd";
import { ReportFilters } from "@/features/reports/components/ReportFilters";
import { SalesSummaryCards } from "@/features/reports/components/SalesSummaryCards";
import { DailySalesChart } from "@/features/reports/components/DailySalesChart";
import { TopProductsChart } from "@/features/reports/components/TopProductsChart";
import { TopProductsTable } from "@/features/reports/components/TopProductsTable";
import { StockAlerts } from "@/features/reports/components/StockAlerts";
import { OrdersTable } from "@/features/reports/components/OrdersTable";
import { CashierReportTable } from "@/features/reports/components/CashierReportTable";
import { useReportFilters } from "@/features/reports/hooks/useReportFilters";
import { useSalesReport } from "@/features/reports/hooks/useSalesReport";
import { useCashierReport } from "@/features/reports/hooks/useCashierReport";
import { useOrdersReport } from "@/features/reports/hooks/useOrdersReport";

export default function ReportsPage() {
  const filters = useReportFilters();
  const sales = useSalesReport();
  const cashier = useCashierReport();
  const ordersReport = useOrdersReport();

  const { buildParams, selectedBranch, activeTab } = filters;

  useEffect(() => {
    const params = buildParams();
    if (activeTab === "general") sales.fetch(params, selectedBranch);
    if (activeTab === "cajeros") cashier.fetch(params);
    if (activeTab === "ventas") { ordersReport.setOrdersPage(1); ordersReport.fetch(params, 1); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, selectedBranch, filters.dateRange]);

  return (
    <div style={{ padding: 24 }}>
      <ReportFilters
        branches={filters.branches}
        selectedBranch={filters.selectedBranch}
        dateRange={filters.dateRange}
        onBranchChange={filters.setSelectedBranch}
        onDateRangeChange={filters.setDateRange}
      />

      <Tabs
        activeKey={activeTab}
        onChange={filters.setActiveTab}
        items={[
          {
            key: "general",
            label: "General",
            children: (
              <>
                <SalesSummaryCards summary={sales.summary} loading={sales.loading} />
                <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                  <Col xs={24} lg={16}><DailySalesChart dailyData={sales.dailyData} /></Col>
                  <Col xs={24} lg={8}><TopProductsChart topProducts={sales.topProducts} /></Col>
                </Row>
                <TopProductsTable topProducts={sales.topProducts} loading={sales.loading} />
                <StockAlerts stockAlerts={sales.stockAlerts} />
              </>
            ),
          },
          {
            key: "ventas",
            label: <Space><UnorderedListOutlined />Historial de ventas</Space>,
            children: (
              <OrdersTable
                orders={ordersReport.orders}
                ordersTotal={ordersReport.ordersTotal}
                ordersPage={ordersReport.ordersPage}
                loading={ordersReport.loading}
                exporting={ordersReport.exporting}
                onPageChange={(p) => { ordersReport.setOrdersPage(p); ordersReport.fetch(buildParams(), p); }}
                onExport={() => ordersReport.exportToExcel(buildParams())}
              />
            ),
          },
          {
            key: "cajeros",
            label: <Space><UserOutlined />Por cajero</Space>,
            children: <CashierReportTable cashierReports={cashier.cashierReports} loading={cashier.loading} />,
          },
        ]}
      />
    </div>
  );
}
