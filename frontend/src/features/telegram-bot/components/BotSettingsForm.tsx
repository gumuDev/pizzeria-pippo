"use client";

import { Card, Form, Input, Switch, Select, InputNumber, Button, Space, Divider, Typography, Skeleton } from "antd";
import { SaveOutlined } from "@ant-design/icons";
import { useBotSettingsForm } from "../hooks/useBotSettingsForm";
import { MODELS } from "../constants/bot-settings.constants";

const { Title, Text } = Typography;

export function BotSettingsForm() {
  const { settings, loading, saving, handleChange, handleSave } = useBotSettingsForm();

  if (loading) return <Skeleton active paragraph={{ rows: 8 }} />;

  const isAnthropicProvider = settings.ai_provider === "anthropic";

  return (
    <Card style={{ maxWidth: 560 }}>
      <Title level={4} style={{ marginBottom: 4 }}>Bot de IA</Title>
      <Text type="secondary" style={{ display: "block", marginBottom: 24 }}>
        Permite consultar ventas, stock y reportes en lenguaje natural desde Telegram.
      </Text>

      <Form layout="vertical">
        <Form.Item label="Habilitar bot de IA">
          <Switch
            checked={settings.telegram_ai_enabled}
            onChange={(v) => handleChange("telegram_ai_enabled", v)}
          />
        </Form.Item>

        <Form.Item label="Proveedor de IA">
          <Select
            value={settings.ai_provider}
            onChange={(v) => handleChange("ai_provider", v)}
          >
            <Select.Option value="openai_compatible">Compatible con OpenAI (Qwen, Groq, etc.)</Select.Option>
            <Select.Option value="anthropic">Anthropic (Claude)</Select.Option>
          </Select>
        </Form.Item>

        {isAnthropicProvider ? (
          <Form.Item label="Anthropic API Key" extra="Solo se actualiza si ingresás un nuevo valor.">
            <Input.Password
              value={settings.anthropic_api_key}
              onChange={(e) => handleChange("anthropic_api_key", e.target.value)}
              placeholder="sk-ant-..."
              autoComplete="off"
            />
          </Form.Item>
        ) : (
          <>
            <Form.Item label="API Key" extra="Solo se actualiza si ingresás un nuevo valor.">
              <Input.Password
                value={settings.openai_compatible_api_key}
                onChange={(e) => handleChange("openai_compatible_api_key", e.target.value)}
                placeholder="sk-..."
                autoComplete="off"
              />
            </Form.Item>
            <Form.Item
              label="Base URL"
              extra="Para Qwen: dashscope-intl.aliyuncs.com/compatible-mode/v1"
            >
              <Input
                value={settings.openai_compatible_base_url}
                onChange={(e) => handleChange("openai_compatible_base_url", e.target.value)}
                placeholder="https://..."
              />
            </Form.Item>
          </>
        )}

        <Form.Item label="Modelo">
          <Select
            value={settings.telegram_ai_model}
            onChange={(v) => handleChange("telegram_ai_model", v)}
          >
            {MODELS[settings.ai_provider].map((m) => (
              <Select.Option key={m.value} value={m.value}>{m.label}</Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Divider orientation="left" orientationMargin={0}>Límites diarios por plan</Divider>

        <Space>
          <Form.Item label="Plan Básico (msg/día)" style={{ marginBottom: 0 }}>
            <InputNumber
              min={1}
              value={settings.telegram_plan_basic_limit}
              onChange={(v) => handleChange("telegram_plan_basic_limit", v ?? 10)}
            />
          </Form.Item>
          <Form.Item label="Plan Pro (msg/día)" style={{ marginBottom: 0 }}>
            <InputNumber
              min={1}
              value={settings.telegram_plan_pro_limit}
              onChange={(v) => handleChange("telegram_plan_pro_limit", v ?? 50)}
            />
          </Form.Item>
        </Space>

        <Divider />

        <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={handleSave}>
          Guardar
        </Button>
      </Form>
    </Card>
  );
}
