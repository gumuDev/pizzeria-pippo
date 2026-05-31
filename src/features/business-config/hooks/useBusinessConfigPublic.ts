"use client";

import { useState, useEffect } from "react";
import { BusinessConfig, DEFAULT_CONFIG } from "../types/business-config.types";
import { getBusinessConfigPublic } from "../services/business-config.service";

let publicCache: BusinessConfig | null = null;

export function useBusinessConfigPublic() {
  const [config, setConfig] = useState<BusinessConfig>(publicCache ?? DEFAULT_CONFIG);
  const [loading, setLoading] = useState(!publicCache);

  useEffect(() => {
    if (publicCache) return;
    setLoading(true);
    getBusinessConfigPublic()
      .then((data) => { publicCache = data; setConfig(data); })
      .finally(() => setLoading(false));
  }, []);

  return { config, loading };
}
