"use client";

import { useRouter } from "next/navigation";
import { Tag, Space, Button } from "antd";
import { IconWarning, IconHistory, IconCart, IconSwap } from "./WarehouseIcons";

interface Props {
  isMobile: boolean;
  alertCount: number;
}

export function WarehousePageHeader({ isMobile, alertCount }: Props) {
  const router = useRouter();

  return (
    <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", justifyContent: "space-between", alignItems: isMobile ? "stretch" : "center", gap: 12, marginBottom: 16 }}>
      <Space>
        <h2 className="text-lg font-semibold m-0">Bodega Central</h2>
        {alertCount > 0 && (
          <Tag color="red" icon={<IconWarning />}>
            {alertCount} insumo{alertCount > 1 ? "s" : ""} bajo mínimo
          </Tag>
        )}
      </Space>
      <Space wrap>
        <Button icon={<IconHistory />} onClick={() => router.push("/warehouse/movements")} block={isMobile}>Historial</Button>
        <Button icon={<IconCart />} onClick={() => router.push("/warehouse/purchase")} block={isMobile}>{isMobile ? "Compra" : "Nueva compra"}</Button>
        <Button type="primary" icon={<IconSwap />} onClick={() => router.push("/warehouse/transfer")} block={isMobile}>Transferir</Button>
      </Space>
    </div>
  );
}
