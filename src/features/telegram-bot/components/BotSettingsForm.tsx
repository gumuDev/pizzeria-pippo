"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, Form, Input, Switch, Select, InputNumber, Button, Space, Divider, Typography, Skeleton, message } from "antd";
import { SaveOutlined } from "@ant-design/icons";
import { supabase } from "@/lib/supabase";

const { Title, Text } = Typography;

type AIProvider = "anthropic" | "openai_compatible";

interface BotSettings {
  telegram_ai_enabled: boolean;
  ai_provider: AIProvider;
  anthropic_api_key: string;
  openai_compatible_api_key: string;
  openai_compatible_base_url: string;
  telegram_ai_model: string;
  telegram_plan_basic_limit: number;
  telegram_plan_pro_limit: number;
}

const SETTINGS_KEYS = [
  "telegram_ai_enabled",
  "ai_provider",
  "anthropic_api_key",
  "openai_compatible_api_key",
  "openai_compatible_base_url",
  "telegram_ai_model",
  "telegram_plan_basic_limit",
  "telegram_plan_pro_limit",
];

const QWEN_BASE_URL = "https://dashscope-intl.aliyuncs.com/compatible-mode/v1";

const MODELS: Record<AIProvider, { value: string; label: string }[]> = {
  anthropic: [
    { value: "claude-haiku-4-5-20251001", label: "Haiku (rápido, económico)" },
    { value: "claude-sonnet-4-6", label: "Sonnet (mayor precisión)" },
  ],
  openai_compatible: [
    { value: "qwen-plus", label: "Qwen Plus (recomendado)" },
    { value: "qwen-turbo", label: "Qwen Turbo (más rápido)" },
    { value: "qwen-max", label: "Qwen Max (mayor precisión)" },
    { value: "gpt-4o-mini", label: "GPT-4o Mini" },
    { value: "gpt-4o", label: "GPT-4o" },
  ],
};

export function BotSettingsForm() {
  const [settings, setSettings] = useState<BotSettings>({
    telegram_ai_enabled: false,
    ai_provider: "openai_compatible",
    anthropic_api_key: "",
    openai_compatible_api_key: "",
    openai_compatible_base_url: QWEN_BASE_URL,
    telegram_ai_model: "qwen-plus",
    telegram_plan_basic_limit: 10,
    telegram_plan_pro_limit: 50,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data: rows } = await supabase
        .from("app_settings")
        .select("key, value")
        .in("key", SETTINGS_KEYS);

      const config: Record<string, string> = Object.fromEntries(
        (rows ?? []).map((r: { key: string; value: string }) => [r.key, r.value])
      );

      setSettings({
        telegram_ai_enabled: config["telegram_ai_enabled"] === "true",
        ai_provider: (config["ai_provider"] as AIProvider) || "openai_compatible",
        anthropic_api_key: config["anthropic_api_key"] ? "***configured***" : "",
        openai_compatible_api_key: config["openai_compatible_api_key"] ? "***configured***" : "",
        openai_compatible_base_url: config["openai_compatible_base_url"] || QWEN_BASE_URL,
        telegram_ai_model: config["telegram_ai_model"] || "qwen-plus",
        telegram_plan_basic_limit: parseInt(config["telegram_plan_basic_limit"] || "10", 10),
        telegram_plan_pro_limit: parseInt(config["telegram_plan_pro_limit"] || "50", 10),
      });
    } catch {
      message.error("Error al cargar la configuración del bot");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleChange = <K extends keyof BotSettings>(field: K, value: BotSettings[K]) => {
    setSettings((prev) => {
      const next = { ...prev, [field]: value };
      // Auto-switch default model when provider changes
      if (field === "ai_provider") {
        const provider = value as AIProvider;
        next.telegram_ai_model = MODELS[provider][0].value;
        if (provider === "openai_compatible" && !next.openai_compatible_base_url) {
          next.openai_compatible_base_url = QWEN_BASE_URL;
        }
      }
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const now = new Date().toISOString();
      const updates: { key: string; value: string; updated_at: string }[] = [
        { key: "telegram_ai_enabled", value: String(settings.telegram_ai_enabled), updated_at: now },
        { key: "ai_provider", value: settings.ai_provider, updated_at: now },
        { key: "telegram_ai_model", value: settings.telegram_ai_model, updated_at: now },
        { key: "openai_compatible_base_url", value: settings.openai_compatible_base_url, updated_at: now },
        { key: "telegram_plan_basic_limit", value: String(settings.telegram_plan_basic_limit), updated_at: now },
        { key: "telegram_plan_pro_limit", value: String(settings.telegram_plan_pro_limit), updated_at: now },
      ];

      if (settings.anthropic_api_key && settings.anthropic_api_key !== "***configured***") {
        updates.push({ key: "anthropic_api_key", value: settings.anthropic_api_key, updated_at: now });
      }
      if (settings.openai_compatible_api_key && settings.openai_compatible_api_key !== "***configured***") {
        updates.push({ key: "openai_compatible_api_key", value: settings.openai_compatible_api_key, updated_at: now });
      }

      const { error } = await supabase.from("app_settings").upsert(updates, { onConflict: "key" });
      if (error) throw error;

      message.success("Configuración del bot guardada");
      await load();
    } catch {
      message.error("Error al guardar");
    } finally {
      setSaving(false);
    }
  };

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
