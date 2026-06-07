"use client";

import { Form, Input, Select, Button, Space, Upload, Typography } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import type { FormInstance } from "antd";
import { CATEGORY_OPTIONS } from "../constants/product.constants";
import { ProductImage } from "./ProductImage";
import type { Step1Data, ProductType } from "../types/product.types";

const { TextArea } = Input;
const { Text } = Typography;
const { useWatch } = Form;

const PRODUCT_TYPE_OPTIONS: { value: ProductType; icon: string; label: string; description: string }[] = [
  { value: "made", icon: "🍳", label: "Elaboración propia", description: "Se prepara con ingredientes" },
  { value: "resale", icon: "📦", label: "Reventa", description: "Se compra listo y se revende" },
];

interface Props {
  form: FormInstance;
  uploading: boolean;
  imageUrl: string;
  step1Data: Step1Data;
  onImageUpload: (file: File) => Promise<boolean>;
  onNext: () => void;
}

export function ProductStepGeneral({ form, uploading, imageUrl, step1Data, onImageUpload, onNext }: Props) {
  const selectedProductType = useWatch("product_type", form);

  return (
    <Form form={form} layout="vertical">
      <Form.Item label="Nombre" name="name" rules={[{ required: true, message: "Requerido" }]}>
        <Input placeholder="Nombre del producto" />
      </Form.Item>
      <Form.Item label="Categoría" name="category" rules={[{ required: true, message: "Requerido" }]}>
        <Select options={CATEGORY_OPTIONS} placeholder="Seleccionar categoría" />
      </Form.Item>
      <Form.Item label="Descripción para el cliente" name="description">
        <TextArea rows={3} placeholder="Ej: Pepperoni, mozzarella, salsa de tomate" />
      </Form.Item>

      <Form.Item
        label="¿Cómo se elabora este producto?"
        name="product_type"
        rules={[{ required: true, message: "Seleccioná un tipo" }]}
      >
        <div style={{ display: "flex", gap: 12 }}>
          {PRODUCT_TYPE_OPTIONS.map((opt) => {
            const selected = selectedProductType === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => form.setFieldValue("product_type", opt.value)}
                style={{
                  flex: 1, padding: "14px 12px", borderRadius: 10, cursor: "pointer",
                  border: `2px solid ${selected ? "#ea580c" : "#e5e7eb"}`,
                  background: selected ? "#fff7ed" : "#fff",
                  textAlign: "center", transition: "all 0.15s",
                }}
              >
                <div style={{ fontSize: 28, marginBottom: 4 }}>{opt.icon}</div>
                <Text strong style={{ fontSize: 13, color: selected ? "#ea580c" : "#374151", display: "block" }}>
                  {opt.label}
                </Text>
                <Text type="secondary" style={{ fontSize: 11 }}>{opt.description}</Text>
              </button>
            );
          })}
        </div>
      </Form.Item>

      <Form.Item label="Imagen">
        <Space direction="vertical">
          <Upload beforeUpload={onImageUpload} showUploadList={false} accept="image/*">
            <Button icon={<UploadOutlined />} loading={uploading}>
              {uploading ? "Subiendo..." : "Subir imagen"}
            </Button>
          </Upload>
          <ProductImage url={imageUrl} category={step1Data.category} width={120} height={120} />
        </Space>
      </Form.Item>
      <div className="flex justify-end mt-4">
        <Button type="primary" onClick={onNext}>
          Siguiente
        </Button>
      </div>
    </Form>
  );
}
