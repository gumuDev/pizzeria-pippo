-- Migration 020: Telegram AI Bot — authorized chats, usage tracking, new app_settings keys
-- Apply manually in Supabase SQL Editor

-- Table: telegram_authorized_chats
CREATE TABLE IF NOT EXISTS telegram_authorized_chats (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id     TEXT NOT NULL UNIQUE,
  type        TEXT NOT NULL CHECK (type IN ('personal', 'group')),
  label       TEXT NOT NULL DEFAULT '',
  plan        TEXT NOT NULL DEFAULT 'basic' CHECK (plan IN ('basic', 'pro', 'unlimited')),
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table: telegram_usage
CREATE TABLE IF NOT EXISTS telegram_usage (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id       TEXT NOT NULL,
  date          DATE NOT NULL,
  message_count INTEGER NOT NULL DEFAULT 0,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (chat_id, date)
);

-- New keys in app_settings
INSERT INTO app_settings (key, value) VALUES
  ('telegram_ai_enabled',            'false'),
  ('telegram_ai_model',              'qwen-plus'),
  ('telegram_plan_basic_limit',      '10'),
  ('telegram_plan_pro_limit',        '50'),
  ('telegram_plan_unlimited_limit',  '99999'),
  ('ai_provider',                    'openai_compatible'),
  ('anthropic_api_key',              ''),
  ('openai_compatible_api_key',      ''),
  ('openai_compatible_base_url',     'https://dashscope-intl.aliyuncs.com/compatible-mode/v1'),
  ('telegram_webhook_secret',        '')
ON CONFLICT (key) DO NOTHING;

-- RLS: telegram_authorized_chats
ALTER TABLE telegram_authorized_chats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_select_telegram_authorized_chats"
  ON telegram_authorized_chats FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ));

CREATE POLICY "admin_insert_telegram_authorized_chats"
  ON telegram_authorized_chats FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ));

CREATE POLICY "admin_update_telegram_authorized_chats"
  ON telegram_authorized_chats FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ));

CREATE POLICY "admin_delete_telegram_authorized_chats"
  ON telegram_authorized_chats FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ));

-- RLS: telegram_usage
ALTER TABLE telegram_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_select_telegram_usage"
  ON telegram_usage FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ));

CREATE POLICY "admin_insert_telegram_usage"
  ON telegram_usage FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ));

CREATE POLICY "admin_update_telegram_usage"
  ON telegram_usage FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ));
