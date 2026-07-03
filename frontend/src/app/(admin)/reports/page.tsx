"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import { Tabs, Space, Row, Col } from "antd";
import { UnorderedListOutlined, UserOutlined } from "@ant-design/icons";

import { ReportFilters } from "@/features/reports/components/ReportFilters";
import { SalesSummaryCards } from "@/features/reports/components/SalesSummaryCards";

import { useReportFilters } from "@/features/reports/hooks/useReportFilters";
import { useSalesReport } from "@/features/reports/hooks/useSalesReport";
import { useCashierReport } from "@/features/reports/hooks/useCashierReport";
import { useOrdersReport } from "@/features/reports/hooks/useOrdersReport";
import { useOrderCancellation } from "@/features/reports/hooks/useOrderCancellation";
import { CancelOrderModal } from "@/features/pos/components/CancelOrderModal";

const DailySalesChart = dynamic(() =>
  import("@/features/reports/components/DailySalesChart").then(m => m.DailySalesChart),
  { ssr: false }
);

const TopProductsChart = dynamic(() =>
  import("@/features/reports/components/TopProductsChart").then(m => m.TopProductsChart),
  { ssr: false }
);

const TopProductsTable = dynamic(() =>
  import("@/features/reports/components/TopProductsTable").then(m => m.TopProductsTable)
);

const StockAlerts = dynamic(() =>
  import("@/features/reports/components/StockAlerts").then(m => m.StockAlerts)
);

const OrdersTable = dynamic(() =>
  import("@/features/reports/components/OrdersTable").then(m => m.OrdersTable)
);

const CashierReportTable = dynamic(() =>
  import("@/features/reports/components/CashierReportTable").then(m => m.CashierReportTable)
);

export default function ReportsPage() {
  const filters = useReportFilters();
  const sales = useSalesReport();
  const cashier = useCashierReport();
  const ordersReport = useOrdersReport();
  const cancellation = useOrderCancellation(() => ordersReport.fetch(filters.buildParams(), ordersReport.ordersPage));

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
                ordersPageSize={ordersReport.ordersPageSize}
                loading={ordersReport.loading}
                exporting={ordersReport.exporting}
                onPageChange={(p, ps) => {
                  ordersReport.setOrdersPage(p);
                  ordersReport.setOrdersPageSize(ps);
                  ordersReport.fetch(buildParams(), p, ps);
                }}
                onExport={() => ordersReport.exportToExcel(buildParams())}
                onCancel={cancellation.openCancelModal}
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
      <CancelOrderModal
        order={cancellation.cancelModal}
        loading={cancellation.cancelling}
        onConfirm={cancellation.handleCancel}
        onClose={cancellation.closeCancelModal}
      />
    </div>
  );
}
