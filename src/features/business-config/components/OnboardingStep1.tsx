"use client";

import { Form, Input, Select } from "antd";
import { useTranslations } from "next-intl";
import { BusinessConfig, BusinessType } from "../types/business-config.types";

interface Props {
  values: Pick<BusinessConfig, "business_name" | "business_type">;
  onChange: (values: Pick<BusinessConfig, "business_name" | "business_type">) => void;
}

export function OnboardingStep1({ values, onChange }: Props) {
  const t = useTranslations("onboarding");
  const tc = useTranslations("businessConfig");

  const typeOptions: { value: BusinessType; label: string }[] = [
    { value: "pizzeria", label: tc("types.pizzeria") },
    { value: "snack", label: tc("types.snack") },
    { value: "store", label: tc("types.store") },
    { value: "other", label: tc("types.other") },
  ];

  return (
    <Form layout="vertical">
      <Form.Item label={tc("businessName")} required>
        <Input
          size="large"
          placeholder={t("namePlaceholder")}
          value={values.business_name}
          onChange={(e) => onChange({ ...values, business_name: e.target.value })}
        />
      </Form.Item>
      <Form.Item label={tc("businessType")} required>
        <Select
          size="large"
          options={typeOptions}
          value={values.business_type}
          onChange={(val) => onChange({ ...values, business_type: val })}
        />
      </Form.Item>
    </Form>
  );
}
