"use client";

import dynamic from "next/dynamic";
import type { useOrdersReport } from "../hooks/useOrdersReport";
import type { Order } from "../types/reports.types";

const OrdersTable = dynamic(() =>
  import("./OrdersTable").then(m => m.OrdersTable)
);

interface Props {
  ordersReport: ReturnType<typeof useOrdersReport>;
  buildParams: () => string;
  onCancel: (order: Order) => void;
}

export function ReportsOrdersTab({ ordersReport, buildParams, onCancel }: Props) {
  return (
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
      onCancel={onCancel}
    />
  );
}
