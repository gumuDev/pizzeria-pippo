"use client";

import { Form, Input, Select, Button, Space, Upload } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import type { FormInstance } from "antd";
import { CATEGORY_OPTIONS } from "../constants/product.constants";
import { ProductImage } from "./ProductImage";
import type { Branch, Step1Data } from "../types/product.types";

const { TextArea } = Input;

interface Props {
  form: FormInstance;
  branches: Branch[];
  uploading: boolean;
  imageUrl: string;
  step1Data: Step1Data;
  onBranchChange: (val: string) => void;
  onImageUpload: (file: File) => Promise<boolean>;
  onNext: () => void;
}

export function ProductStepGeneral({
  form, branches, uploading, imageUrl, step1Data,
  onBranchChange, onImageUpload, onNext,
}: Props) {
  return (
    <Form form={form} layout="vertical">
      <Form.Item label="Sucursal" name="branch_id" rules={[{ required: true, message: "Requerido" }]}>
        <Select
          options={branches.map((b) => ({ value: b.id, label: b.name }))}
          placeholder="Seleccionar sucursal"
          onChange={onBranchChange}
        />
      </Form.Item>
      <Form.Item label="Nombre" name="name" rules={[{ required: true, message: "Requerido" }]}>
        <Input placeholder="Ej: Pizza Pepperoni" />
      </Form.Item>
      <Form.Item label="Categoría" name="category" rules={[{ required: true, message: "Requerido" }]}>
        <Select options={CATEGORY_OPTIONS} placeholder="Seleccionar categoría" />
      </Form.Item>
      <Form.Item label="Descripción para el cliente" name="description">
        <TextArea rows={3} placeholder="Ej: Pepperoni, mozzarella, salsa de tomate" />
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
