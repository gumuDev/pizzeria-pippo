"use client";

import { Card, Button, Typography, Space } from "antd";
import { ShopOutlined, LogoutOutlined } from "@ant-design/icons";
import type { Branch } from "../types/pos.types";

const { Title, Text } = Typography;

interface Props {
  branches: Branch[];
  userName: string;
  onSelect: (branchId: string) => void;
  onLogout: () => void;
}

export function BranchSelector({ branches, userName, onSelect, onLogout }: Props) {
  return (
    <div style={{
      height: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      background: "#f5f5f5",
      gap: 24,
      padding: 24,
    }}>
      <div style={{ textAlign: "center" }}>
        <Title level={3} style={{ margin: 0 }}>Seleccionar sucursal</Title>
        <Text type="secondary">Hola, {userName}. ¿Desde qué sucursal vas a vender?</Text>
      </div>

      <Space direction="vertical" style={{ width: "100%", maxWidth: 360 }} size={12}>
        {branches.map((branch) => (
          <Card
            key={branch.id}
            hoverable
            onClick={() => onSelect(branch.id)}
            style={{ cursor: "pointer", borderRadius: 12 }}
            styles={{ body: { padding: "16px 20px" } }}
          >
            <Space>
              <ShopOutlined style={{ fontSize: 20, color: "#f97316" }} />
              <Text strong style={{ fontSize: 16 }}>{branch.name}</Text>
            </Space>
          </Card>
        ))}
      </Space>

      <Button icon={<LogoutOutlined />} type="text" onClick={onLogout}>
        Cerrar sesión
      </Button>
    </div>
  );
}
