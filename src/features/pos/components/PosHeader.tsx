"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Button, Tag, Typography } from "antd";
import { LogoutOutlined, UnorderedListOutlined } from "@ant-design/icons";
import { formatTimeBolivia } from "@/lib/timezone";
import type { Identity } from "../types/pos.types";

const { Text } = Typography;

interface Props {
  identity: Identity;
  showOrders: boolean;
  pendingCount: number;
  onToggleOrders: () => void;
  onLogout: () => void;
}

export function PosHeader({ identity, showOrders, pendingCount, onToggleOrders, onLogout }: Props) {
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    const tick = () => setCurrentTime(formatTimeBolivia(new Date()));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ background: "#fff", borderBottom: "1px solid #f0f0f0", padding: "10px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Image src="/pippo.jpg" alt="Pippo Pizza" width={34} height={34} style={{ borderRadius: "50%", objectFit: "cover" }} />
          <Text strong style={{ fontSize: 16, color: "#ea580c" }}>Pizzería Pippo — POS</Text>
        </div>
        <Tag color="blue" style={{ margin: 0 }}>{identity.name}</Tag>
        {identity.branch_id && <Tag color="green" style={{ margin: 0 }}>Sucursal</Tag>}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Text style={{ fontFamily: "monospace", fontSize: 16, fontWeight: 600, color: "#374151" }}>{currentTime}</Text>
        <Button
          icon={<UnorderedListOutlined />}
          type={showOrders ? "primary" : "default"}
          onClick={onToggleOrders}
        >
          Pedidos del día
          {pendingCount > 0 && (
            <span style={{ marginLeft: 6, background: "#ef4444", color: "#fff", fontSize: 11, borderRadius: 10, padding: "1px 6px" }}>
              {pendingCount}
            </span>
          )}
        </Button>
        <Button icon={<LogoutOutlined />} onClick={onLogout}>Salir</Button>
      </div>
    </div>
  );
}
