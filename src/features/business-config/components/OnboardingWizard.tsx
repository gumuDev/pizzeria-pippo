"use client";

import { useState } from "react";
import { Steps, Button, Card, message } from "antd";
import { useTranslations } from "next-intl";
import { BusinessConfig, DEFAULT_CONFIG } from "../types/business-config.types";
import { OnboardingStep1 } from "./OnboardingStep1";
import { OnboardingStep2 } from "./OnboardingStep2";
import { OnboardingStep3 } from "./OnboardingStep3";

interface Props {
  onComplete: (config: BusinessConfig) => Promise<void>;
  onUploadLogo: (file: File) => Promise<string>;
  saving: boolean;
}

export function OnboardingWizard({ onComplete, onUploadLogo, saving }: Props) {
  const t = useTranslations("onboarding");
  const [step, setStep] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [config, setConfig] = useState<BusinessConfig>({ ...DEFAULT_CONFIG });

  const steps = [
    { title: t("step1Title"), description: t("step1Description") },
    { title: t("step2Title"), description: t("step2Description") },
    { title: t("step3Title"), description: t("step3Description") },
  ];

  const canNext = step === 0 ? !!config.business_name.trim() : true;

  const handleNext = () => setStep((s) => s + 1);
  const handleBack = () => setStep((s) => s - 1);

  const handleFinish = async () => {
    if (!config.business_name.trim()) {
      message.error("El nombre del negocio es requerido");
      return;
    }
    await onComplete(config);
  };

  const handleUploadLogo = async (file: File): Promise<string> => {
    setUploading(true);
    try {
      return await onUploadLogo(file);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f3f4f6" }}>
      <Card style={{ width: "100%", maxWidth: 560, borderRadius: 16, boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>{t("title")}</h1>
          <p style={{ color: "#6b7280" }}>{t("subtitle")}</p>
        </div>

        <Steps current={step} items={steps} style={{ marginBottom: 32 }} size="small" />

        <div style={{ minHeight: 200 }}>
          {step === 0 && (
            <OnboardingStep1
              values={{ business_name: config.business_name, business_type: config.business_type }}
              onChange={(v) => setConfig((c) => ({ ...c, ...v }))}
            />
          )}
          {step === 1 && (
            <OnboardingStep2
              values={{ business_logo_url: config.business_logo_url, business_primary_color: config.business_primary_color }}
              onChange={(v) => setConfig((c) => ({ ...c, ...v }))}
              onUploadLogo={handleUploadLogo}
              uploading={uploading}
            />
          )}
          {step === 2 && <OnboardingStep3 config={config} />}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 32 }}>
          <Button onClick={handleBack} disabled={step === 0}>{t("back")}</Button>
          {step < 2 ? (
            <Button type="primary" onClick={handleNext} disabled={!canNext}>{t("next")}</Button>
          ) : (
            <Button type="primary" onClick={handleFinish} loading={saving}>{t("finish")}</Button>
          )}
        </div>
      </Card>
    </div>
  );
}
