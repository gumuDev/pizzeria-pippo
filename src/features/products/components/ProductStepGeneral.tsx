"use client";

import { Form, Input, Select, Button, Space, Upload, Alert, Checkbox } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import type { FormInstance } from "antd";
import { useProductCategoriesPublic } from "@/features/product-categories/hooks/useProductCategoriesPublic";
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
  const { categories, loading: categoriesLoading } = useProductCategoriesPublic();
  const categoryOptions = categories.map((c) => ({ value: c.name, label: c.name }));
  const currentCategoryInactive = !categoriesLoading && !!step1Data.category && !categories.find((c) => c.name === step1Data.category);

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
        <Input placeholder="Nombre del producto" />
      </Form.Item>
      <Form.Item label="Categoría" name="category" rules={[{ required: true, message: "Requerido" }]}>
        <Select options={categoryOptions} placeholder="Seleccionar categoría" />
      </Form.Item>
      {currentCategoryInactive && (
        <Alert
          type="warning"
          showIcon
          message={`La categoría "${step1Data.category}" fue desactivada. Selecciona una nueva categoría para continuar.`}
          style={{ marginBottom: 16 }}
        />
      )}
      <Form.Item label="Descripción para el cliente" name="description">
        <TextArea rows={3} placeholder="Ej: Pepperoni, mozzarella, salsa de tomate" />
      </Form.Item>
      <Form.Item name="track_stock" valuePropName="checked">
        <Checkbox>Descontar stock al vender</Checkbox>
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
