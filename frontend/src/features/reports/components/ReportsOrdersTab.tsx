"use client";

import dynamic from "next/dynamic";
import type { useOrdersReport } from "../hooks/useOrdersReport";
import type { Order, SalesSummary } from "../types/reports.types";

const OrdersTable = dynamic(() =>
  import("./OrdersTable").then(m => m.OrdersTable)
);

interface Props {
  ordersReport: ReturnType<typeof useOrdersReport>;
  summary: SalesSummary | null;
  buildParams: () => string;
  onCancel: (order: Order) => void;
}

export function ReportsOrdersTab({ ordersReport, summary, buildParams, onCancel }: Props) {
  return (
    <OrdersTable
      orders={ordersReport.orders}
      ordersTotal={ordersReport.ordersTotal}
      ordersPage={ordersReport.ordersPage}
      ordersPageSize={ordersReport.ordersPageSize}
      loading={ordersReport.loading}
      exporting={ordersReport.exporting}
      summary={summary}
      onPageChange={(p, ps) => {
        ordersReport.setOrdersPage(p);
        ordersReport.setOrdersPageSize(ps);
        ordersReport.fetch(buildParams(), p, ps);
      }}
      onExport={() => ordersReport.exportToExcel(buildParams())}
      onCancel={onCancel}
    />
  );
}
