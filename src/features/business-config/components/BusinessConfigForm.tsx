"use client";

import { Form, Input, Select, Button, Upload, ColorPicker, message } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useState } from "react";
import { useBusinessConfig } from "../hooks/useBusinessConfig";
import { BusinessType } from "../types/business-config.types";

export function BusinessConfigForm() {
  const t = useTranslations("businessConfig");
  const { config, saving, save, uploadAndSaveLogo } = useBusinessConfig();
  const [form] = Form.useForm();
  const [uploading, setUploading] = useState(false);

  const typeOptions: { value: BusinessType; label: string }[] = [
    { value: "pizzeria", label: t("types.pizzeria") },
    { value: "snack", label: t("types.snack") },
    { value: "store", label: t("types.store") },
    { value: "other", label: t("types.other") },
  ];

  const handleSave = async () => {
    const values = await form.validateFields();
    await save(values);
    message.success(t("saved"));
  };

  const beforeUpload = async (file: File) => {
    const allowed = ["image/png", "image/svg+xml"];
    if (!allowed.includes(file.type)) { message.error("Solo PNG y SVG"); return false; }
    if (file.size > 2 * 1024 * 1024) { message.error("Máximo 2MB"); return false; }
    setUploading(true);
    try {
      await uploadAndSaveLogo(file);
      message.success("Logo actualizado");
    } catch {
      message.error("Error al subir el logo");
    } finally {
      setUploading(false);
    }
    return false;
  };

  return (
    <Form form={form} layout="vertical" initialValues={config} onFinish={handleSave}>
      <Form.Item name="business_name" label={t("businessName")} rules={[{ required: true }]}>
        <Input />
      </Form.Item>
      <Form.Item name="business_type" label={t("businessType")}>
        <Select options={typeOptions} />
      </Form.Item>
      <Form.Item label={t("logoUrl")}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {config.business_logo_url && (
            <Image
              src={config.business_logo_url}
              alt="Logo"
              width={56}
              height={56}
              style={{ objectFit: "contain", border: "1px solid #f0f0f0", borderRadius: 8, padding: 4 }}
            />
          )}
          <Upload showUploadList={false} beforeUpload={beforeUpload} accept=".png,.svg">
            <Button icon={<UploadOutlined />} loading={uploading}>{t("uploadLogo")}</Button>
          </Upload>
        </div>
        <div style={{ color: "#9ca3af", fontSize: 12, marginTop: 4 }}>{t("logoHint")}</div>
      </Form.Item>
      <Form.Item name="business_primary_color" label={t("primaryColor")}>
        <ColorPicker showText onChange={(_, hex) => form.setFieldValue("business_primary_color", hex)} />
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit" loading={saving}>{t("save")}</Button>
      </Form.Item>
    </Form>
  );
}
