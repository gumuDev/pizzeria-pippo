"use client";

import { useRouter } from "next/navigation";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { useGetIdentity } from "@refinedev/core";
import { OnboardingWizard } from "@/features/business-config/components/OnboardingWizard";
import { BusinessConfig } from "@/features/business-config/types/business-config.types";
import { saveBusinessConfig, uploadLogo } from "@/features/business-config/services/business-config.service";
import { useState } from "react";

interface Identity {
  id: string;
  name: string;
  role: string;
  token: string;
}

export default function OnboardingPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const { data: identity } = useGetIdentity<Identity>();

  const handleComplete = async (config: BusinessConfig) => {
    if (!identity?.token) return;
    setSaving(true);
    try {
      await saveBusinessConfig(identity.token, config);
      router.push("/dashboard");
    } finally {
      setSaving(false);
    }
  };

  const handleUploadLogo = async (file: File): Promise<string> => {
    if (!identity?.token) throw new Error("Not authenticated");
    return uploadLogo(identity.token, file);
  };

  return (
    <AntdRegistry>
      <OnboardingWizard onComplete={handleComplete} onUploadLogo={handleUploadLogo} saving={saving} />
    </AntdRegistry>
  );
}
