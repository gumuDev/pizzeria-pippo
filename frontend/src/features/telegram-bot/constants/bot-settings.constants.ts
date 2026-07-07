import type { AIProvider } from "../types";

export const SETTINGS_KEYS = [
  "telegram_ai_enabled",
  "ai_provider",
  "anthropic_api_key",
  "openai_compatible_api_key",
  "openai_compatible_base_url",
  "telegram_ai_model",
  "telegram_plan_basic_limit",
  "telegram_plan_pro_limit",
];

export const QWEN_BASE_URL = "https://dashscope-intl.aliyuncs.com/compatible-mode/v1";

export const MODELS: Record<AIProvider, { value: string; label: string }[]> = {
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
