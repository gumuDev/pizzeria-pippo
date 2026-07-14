"use client";

import { useRouter } from "next/navigation";
import { Button, Space, Typography, Switch, Input } from "antd";
import { PlusOutlined, EyeOutlined, SearchOutlined } from "@ant-design/icons";
import { useIsMobile } from "@/lib/useIsMobile";

const { Title, Text } = Typography;

interface Props {
  search: string;
  onSearch: (val: string) => void;
  showInactive: boolean;
  onToggleInactive: (val: boolean) => void;
}

export function ProductsTableHeader({ search, onSearch, showInactive, onToggleInactive }: Props) {
  const router = useRouter();
  const isMobile = useIsMobile();

  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
      <Title level={4} style={{ margin: 0 }}>Productos</Title>
      <Space wrap>
        <Input
          placeholder="Buscar producto..."
          prefix={<SearchOutlined style={{ color: "#9ca3af" }} />}
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          allowClear
          style={{ width: isMobile ? 160 : 220 }}
        />
        <Space size={4}>
          <EyeOutlined style={{ color: "#6b7280" }} />
          {!isMobile && <Text type="secondary">Ver inactivos</Text>}
          <Switch size="small" checked={showInactive} onChange={onToggleInactive} />
        </Space>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => router.push("/products/new")}>
          {isMobile ? "Nuevo" : "Nuevo producto"}
        </Button>
      </Space>
    </div>
  );
}
