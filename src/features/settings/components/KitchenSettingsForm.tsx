"use client";

import { Card, Form, InputNumber, Button, Typography, Skeleton } from "antd";
import { SaveOutlined } from "@ant-design/icons";
import { useSettings } from "@/features/settings/hooks/useSettings";

const { Title, Text } = Typography;

export function KitchenSettingsForm() {
  const { settings, loading, saving, handleChange, handleSave } = useSettings();

  if (loading) return <Skeleton active paragraph={{ rows: 3 }} />;

  return (
    <Card style={{ maxWidth: 400 }}>
      <Title level={4} style={{ marginBottom: 4 }}>Cocina</Title>
      <Text type="secondary" style={{ display: "block", marginBottom: 24 }}>
        Configura el umbral de tiempo tras el cual un pedido se marca como demorado.
      </Text>

      <Form layout="vertical" onFinish={handleSave}>
        <Form.Item
          label="Minutos para marcar como demorado"
          extra="Los pedidos que superen este tiempo se resaltan en rojo en la pantalla de cocina."
        >
          <InputNumber
            min={1}
            max={120}
            value={settings.kitchen_late_threshold_minutes}
            onChange={(val) => handleChange("kitchen_late_threshold_minutes", val ?? 10)}
            addonAfter="min"
            style={{ width: 140 }}
          />
        </Form.Item>

        <Button
          type="primary"
          icon={<SaveOutlined />}
          loading={saving}
          onClick={handleSave}
        >
          Guardar
        </Button>
      </Form>
    </Card>
  );
}
