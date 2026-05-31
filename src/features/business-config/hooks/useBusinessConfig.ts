"use client";

import { useState, useEffect, useCallback } from "react";
import { useGetIdentity } from "@refinedev/core";
import { BusinessConfig, DEFAULT_CONFIG } from "../types/business-config.types";
import { getBusinessConfig, saveBusinessConfig, uploadLogo } from "../services/business-config.service";

interface Identity {
  id: string;
  name: string;
  role: string;
  token: string;
}

let cachedConfig: BusinessConfig | null = null;

export function useBusinessConfig() {
  const [config, setConfig] = useState<BusinessConfig>(cachedConfig ?? DEFAULT_CONFIG);
  const [loading, setLoading] = useState(!cachedConfig);
  const [saving, setSaving] = useState(false);
  const { data: identity } = useGetIdentity<Identity>();

  const load = useCallback(async () => {
    if (!identity?.token) return;
    setLoading(true);
    try {
      const data = await getBusinessConfig(identity.token);
      cachedConfig = data;
      setConfig(data);
    } finally {
      setLoading(false);
    }
  }, [identity?.token]);

  useEffect(() => {
    if (!cachedConfig) load();
  }, [load]);

  const save = async (updates: Partial<BusinessConfig>) => {
    if (!identity?.token) return;
    setSaving(true);
    try {
      await saveBusinessConfig(identity.token, updates);
      const next = { ...config, ...updates };
      cachedConfig = next;
      setConfig(next);
    } finally {
      setSaving(false);
    }
  };

  const uploadAndSaveLogo = async (file: File): Promise<string> => {
    if (!identity?.token) throw new Error("Not authenticated");
    const url = await uploadLogo(identity.token, file);
    await save({ business_logo_url: url });
    return url;
  };

  const isConfigured = !!config.business_name;

  return { config, loading, saving, save, uploadAndSaveLogo, reload: load, isConfigured };
}
