"use client";

import dynamic from "next/dynamic";
import { Row, Col } from "antd";
import { SalesSummaryCards } from "./SalesSummaryCards";
import type { useSalesReport } from "../hooks/useSalesReport";

const DailySalesChart = dynamic(() =>
  import("./DailySalesChart").then(m => m.DailySalesChart),
  { ssr: false }
);

const TopProductsChart = dynamic(() =>
  import("./TopProductsChart").then(m => m.TopProductsChart),
  { ssr: false }
);

const TopProductsTable = dynamic(() =>
  import("./TopProductsTable").then(m => m.TopProductsTable)
);

const StockAlerts = dynamic(() =>
  import("./StockAlerts").then(m => m.StockAlerts)
);

interface Props {
  sales: ReturnType<typeof useSalesReport>;
}

export function ReportsGeneralTab({ sales }: Props) {
  return (
    <>
      <SalesSummaryCards summary={sales.summary} loading={sales.loading} />
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={16}><DailySalesChart dailyData={sales.dailyData} /></Col>
        <Col xs={24} lg={8}><TopProductsChart topProducts={sales.topProducts} /></Col>
      </Row>
      <TopProductsTable topProducts={sales.topProducts} loading={sales.loading} />
      <StockAlerts stockAlerts={sales.stockAlerts} />
    </>
  );
}
