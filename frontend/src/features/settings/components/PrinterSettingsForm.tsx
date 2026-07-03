"use client";

import { Card, Form, Select, Button, Typography, Skeleton } from "antd";
import { SaveOutlined } from "@ant-design/icons";
import { useSettings } from "@/features/settings/hooks/useSettings";

const { Title, Text } = Typography;

export function PrinterSettingsForm() {
  const { settings, loading, saving, handleChange, handleSave } = useSettings();

  if (loading) return <Skeleton active paragraph={{ rows: 3 }} />;

  return (
    <Card style={{ maxWidth: 400 }}>
      <Title level={4} style={{ marginBottom: 4 }}>Impresora de tickets</Title>
      <Text type="secondary" style={{ display: "block", marginBottom: 24 }}>
        Impresora térmica Bluetooth usada por el POS para imprimir tickets de venta.
      </Text>

      <Form layout="vertical" onFinish={handleSave}>
        <Form.Item
          label="Ancho de papel"
          extra="Si cambias de impresora (58mm ↔ 80mm), solo ajusta este valor."
        >
          <Select
            value={settings.printer_paper_width}
            onChange={(val) => handleChange("printer_paper_width", val)}
            style={{ width: 220 }}
            options={[
              { value: 58, label: "58 mm (32 caracteres)" },
              { value: 80, label: "80 mm (48 caracteres)" },
            ]}
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
