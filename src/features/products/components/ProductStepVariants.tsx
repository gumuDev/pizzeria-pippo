"use client";

import { Button, Card, Select, InputNumber, Row, Col, Typography } from "antd";
import { PlusOutlined, MinusCircleOutlined } from "@ant-design/icons";
import type { Branch, Variant, VariantTypeOption } from "../types/product.types";

const { Text } = Typography;

interface Props {
  variants: Variant[];
  branches: Branch[];
  variantTypeOptions: VariantTypeOption[];
  selectedBranchId: string;
  onUpdateVariant: (index: number, field: keyof Variant, value: unknown) => void;
  onUpdateBranchPrice: (variantIndex: number, branchId: string, price: number) => void;
  onAddVariant: () => void;
  onRemoveVariant: (index: number) => void;
  onPrev: () => void;
  onNext: () => void;
}

export function ProductStepVariants({
  variants, branches, variantTypeOptions, selectedBranchId,
  onUpdateVariant, onUpdateBranchPrice,
  onAddVariant, onRemoveVariant,
  onPrev, onNext,
}: Props) {
  if (variantTypeOptions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No hay tipos de variante configurados. Creá uno primero en <strong>Tipos de variante</strong>.
      </div>
    );
  }

  return (
    <div>
      {selectedBranchId && (
        <div className="mb-4 px-3 py-2 bg-blue-50 rounded text-sm text-blue-700">
          Sucursal: <strong>{branches.find((b) => b.id === selectedBranchId)?.name}</strong>
        </div>
      )}
      {variants.map((variant, vi) => (
        <Card
          key={vi}
          className="mb-4"
          size="small"
          title={
            <Select
              value={variant.name}
              options={variantTypeOptions.filter(
                (o) => o.value === variant.name || !variants.some((v, i) => i !== vi && v.name === o.value)
              )}
              onChange={(val) => onUpdateVariant(vi, "name", val)}
              style={{ width: 160 }}
            />
          }
          extra={variants.length > 1 && (
            <Button type="text" danger icon={<MinusCircleOutlined />} onClick={() => onRemoveVariant(vi)} />
          )}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Text type="secondary">Precio</Text>
              <InputNumber
                prefix="Bs"
                value={variant.branch_prices.find((bp) => bp.branch_id === selectedBranchId)?.price ?? variant.base_price}
                onChange={(val) => {
                  const price = val ?? 0;
                  onUpdateVariant(vi, "base_price", price);
                  const existing = variants[vi].branch_prices.find((bp) => bp.branch_id === selectedBranchId);
                  if (existing) {
                    onUpdateBranchPrice(vi, selectedBranchId, price);
                  } else if (selectedBranchId) {
                    onUpdateVariant(vi, "branch_prices", [
                      ...variants[vi].branch_prices,
                      { branch_id: selectedBranchId, price },
                    ]);
                  }
                }}
                style={{ width: "100%", marginTop: 4 }}
                min={0}
              />
            </Col>
          </Row>
        </Card>
      ))}

      {variants.length < variantTypeOptions.length && (
        <Button type="dashed" block icon={<PlusOutlined />} onClick={onAddVariant} className="mb-4">
          Agregar variante
        </Button>
      )}

      <div className="flex justify-between mt-4">
        <Button onClick={onPrev}>Anterior</Button>
        <Button type="primary" onClick={onNext} disabled={variants.length === 0}>
          Siguiente
        </Button>
      </div>
    </div>
  );
}
