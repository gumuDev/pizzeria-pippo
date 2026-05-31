"use client";

import { Form, Upload, Button, ColorPicker, message } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { BusinessConfig } from "../types/business-config.types";

interface Props {
  values: Pick<BusinessConfig, "business_logo_url" | "business_primary_color">;
  onChange: (values: Pick<BusinessConfig, "business_logo_url" | "business_primary_color">) => void;
  onUploadLogo: (file: File) => Promise<string>;
  uploading: boolean;
}

export function OnboardingStep2({ values, onChange, onUploadLogo, uploading }: Props) {
  const t = useTranslations("onboarding");
  const tc = useTranslations("businessConfig");

  const beforeUpload = async (file: File) => {
    const allowed = ["image/png", "image/svg+xml"];
    if (!allowed.includes(file.type)) {
      message.error("Solo se permiten PNG y SVG");
      return false;
    }
    if (file.size > 2 * 1024 * 1024) {
      message.error("El archivo no puede superar 2MB");
      return false;
    }
    try {
      const url = await onUploadLogo(file);
      onChange({ ...values, business_logo_url: url });
    } catch {
      message.error("Error al subir el logo");
    }
    return false;
  };

  return (
    <Form layout="vertical">
      <Form.Item label={tc("logoUrl")}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {values.business_logo_url && (
            <Image
              src={values.business_logo_url}
              alt="Logo"
              width={64}
              height={64}
              style={{ objectFit: "contain", border: "1px solid #f0f0f0", borderRadius: 8, padding: 4 }}
            />
          )}
          <Upload showUploadList={false} beforeUpload={beforeUpload} accept=".png,.svg">
            <Button icon={<UploadOutlined />} loading={uploading}>{tc("uploadLogo")}</Button>
          </Upload>
        </div>
        <div style={{ color: "#9ca3af", fontSize: 12, marginTop: 4 }}>{tc("logoHint")}</div>
      </Form.Item>
      <Form.Item label={tc("primaryColor")}>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <ColorPicker
            value={values.business_primary_color}
            onChange={(_, hex) => onChange({ ...values, business_primary_color: hex })}
            showText
          />
          <span style={{ color: "#9ca3af", fontSize: 12 }}>{t("colorHint")}</span>
        </div>
      </Form.Item>
    </Form>
  );
}
