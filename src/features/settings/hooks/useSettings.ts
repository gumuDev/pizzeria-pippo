"use client";

import { useState, useEffect, useCallback } from "react";
import { message } from "antd";
import { AppSettings } from "@/features/settings/types";
import { getSettings, saveSettings, testConnection } from "@/features/settings/services/settings.service";

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>({
    telegram_bot_token: "",
    telegram_chat_id: "",
    telegram_enabled: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<"idle" | "success" | "error">("idle");
  const [testError, setTestError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getSettings();
      setSettings(data);
    } catch {
      message.error("Error al cargar la configuración");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleChange = useCallback((field: keyof AppSettings, value: string | boolean) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
    setTestResult("idle");
  }, []);

  const handleTest = useCallback(async () => {
    setTesting(true);
    setTestResult("idle");
    setTestError("");
    try {
      const result = await testConnection(settings.telegram_bot_token, settings.telegram_chat_id);
      if (result.ok) {
        setTestResult("success");
      } else {
        setTestResult("error");
        setTestError(result.error ?? "Error desconocido");
      }
    } catch {
      setTestResult("error");
      setTestError("No se pudo conectar");
    } finally {
      setTesting(false);
    }
  }, [settings.telegram_bot_token, settings.telegram_chat_id]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await saveSettings(settings);
      message.success("Configuración guardada");
      await load();
    } catch {
      message.error("Error al guardar la configuración");
    } finally {
      setSaving(false);
    }
  }, [settings, load]);

  return {
    settings,
    loading,
    saving,
    testing,
    testResult,
    testError,
    handleChange,
    handleTest,
    handleSave,
  };
}
