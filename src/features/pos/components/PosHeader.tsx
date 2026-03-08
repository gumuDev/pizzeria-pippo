"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Button, Tag, Typography } from "antd";
import { LogoutOutlined, UnorderedListOutlined } from "@ant-design/icons";
import { formatTimeBolivia } from "@/lib/timezone";
import type { Identity } from "../types/pos.types";

const { Title, Text } = Typography;

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
    <div className="bg-white border-b px-4 py-2 flex justify-between items-center shadow-sm">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Image
            src="/pippo.jpg"
            alt="Pippo Pizza"
            width={36}
            height={36}
            style={{ borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
          />
          <Title level={5} className="!mb-0 text-orange-600">Pizzería Pippo — POS</Title>
        </div>
        <Tag color="blue">{identity.name}</Tag>
        {identity.branch_id && <Tag color="green">Sucursal</Tag>}
      </div>
      <div className="flex items-center gap-4">
        <Text className="text-gray-500 font-mono text-lg">{currentTime}</Text>
        <Button
          icon={<UnorderedListOutlined />}
          size="small"
          type={showOrders ? "primary" : "default"}
          onClick={onToggleOrders}
        >
          Pedidos del día
          {pendingCount > 0 && (
            <span className="ml-1 bg-orange-500 text-white text-xs rounded-full px-1.5 py-0.5">
              {pendingCount}
            </span>
          )}
        </Button>
        <Button icon={<LogoutOutlined />} size="small" onClick={onLogout}>
          Salir
        </Button>
      </div>
    </div>
  );
}
