"use client";

import { Card, Form, Input, Switch, Button, Space, Divider, Typography, Skeleton } from "antd";
import { SaveOutlined } from "@ant-design/icons";
import { TestConnectionButton } from "./TestConnectionButton";
import { useSettings } from "@/features/settings/hooks/useSettings";

const { Title, Text } = Typography;

export function TelegramSettingsForm() {
  const {
    settings,
    loading,
    saving,
    testing,
    testResult,
    testError,
    handleChange,
    handleTest,
    handleSave,
  } = useSettings();

  if (loading) return <Skeleton active paragraph={{ rows: 6 }} />;

  const canTest = !!settings.telegram_bot_token && !!settings.telegram_chat_id;
  const canSave = canTest;

  return (
    <Card style={{ maxWidth: 560 }}>
      <Title level={4} style={{ marginBottom: 4 }}>Notificaciones Telegram</Title>
      <Text type="secondary" style={{ display: "block", marginBottom: 24 }}>
        Recibe alertas automáticas en Telegram cuando el stock de un insumo baje del mínimo.
      </Text>

      <Form layout="vertical" onFinish={handleSave}>
        <Form.Item
          label="Bot Token"
          extra="Obtenlo creando un bot con @BotFather en Telegram."
        >
          <Input.Password
            value={settings.telegram_bot_token}
            onChange={(e) => handleChange("telegram_bot_token", e.target.value)}
            placeholder="123456:ABCdef..."
            autoComplete="off"
          />
        </Form.Item>

        <Form.Item
          label="Chat ID"
          extra="ID numérico del chat o grupo. Para que varios admins reciban alertas, crea un grupo, agregá el bot y usá el ID del grupo."
        >
          <Input
            value={settings.telegram_chat_id}
            onChange={(e) => handleChange("telegram_chat_id", e.target.value)}
            placeholder="-1001234567890"
          />
        </Form.Item>

        <Form.Item label="Notificaciones habilitadas">
          <Switch
            checked={settings.telegram_enabled}
            onChange={(checked) => handleChange("telegram_enabled", checked)}
          />
        </Form.Item>

        <Divider />

        <Space>
          <TestConnectionButton
            testing={testing}
            testResult={testResult}
            testError={testError}
            disabled={!canTest}
            onTest={handleTest}
          />

          <Button
            type="primary"
            icon={<SaveOutlined />}
            loading={saving}
            disabled={!canSave}
            onClick={handleSave}
          >
            Guardar
          </Button>
        </Space>
      </Form>
    </Card>
  );
}
