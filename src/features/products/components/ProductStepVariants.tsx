"use client";

import { Button, Card, Select, InputNumber, Row, Col, Typography, Switch } from "antd";
import { PlusOutlined, MinusCircleOutlined } from "@ant-design/icons";
import type { Variant, VariantTypeOption } from "../types/product.types";

const { Text } = Typography;

interface Props {
  variants: Variant[];
  variantTypeOptions: VariantTypeOption[];
  hasVariants: boolean;
  onToggleVariants: (val: boolean) => void;
  onUpdateVariant: (index: number, field: keyof Variant, value: unknown) => void;
  onAddVariant: () => void;
  onRemoveVariant: (index: number) => void;
  onPrev: () => void;
  onNext: () => void;
  nextLabel?: string;
  saving?: boolean;
}

export function ProductStepVariants({
  variants, variantTypeOptions,
  hasVariants, onToggleVariants,
  onUpdateVariant,
  onAddVariant, onRemoveVariant,
  onPrev, onNext, nextLabel, saving,
}: Props) {
  const simpleVariant = variants[0];

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, padding: "12px 16px", background: "#f9fafb", borderRadius: 10, border: "1px solid #e5e7eb" }}>
        <Switch checked={hasVariants} onChange={onToggleVariants} />
        <div>
          <Text strong style={{ fontSize: 14 }}>Este producto tiene tamaños o presentaciones</Text>
          <Text type="secondary" style={{ fontSize: 12, display: "block" }}>
            {hasVariants ? "Ej: Personal / Mediana / Familiar" : "Se vende como unidad única con un solo precio"}
          </Text>
        </div>
      </div>

      {!hasVariants && simpleVariant && (
        <Card size="small" style={{ marginBottom: 16 }}>
          <Text type="secondary">Precio base</Text>
          <InputNumber
            prefix="Bs"
            value={simpleVariant.base_price}
            onChange={(val) => onUpdateVariant(0, "base_price", val ?? 0)}
            style={{ width: "100%", marginTop: 4 }}
            min={0}
          />
        </Card>
      )}

      {hasVariants && (
        <>
          {variantTypeOptions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No hay tipos de variante configurados. Creá uno primero en <strong>Tipos de variante</strong>.
            </div>
          ) : (
            <>
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
                      <Text type="secondary">Precio base</Text>
                      <InputNumber
                        prefix="Bs"
                        value={variant.base_price}
                        onChange={(val) => onUpdateVariant(vi, "base_price", val ?? 0)}
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
            </>
          )}
        </>
      )}

      <div className="flex justify-between mt-4">
        <Button onClick={onPrev}>Anterior</Button>
        <Button type="primary" onClick={onNext} disabled={variants.length === 0} loading={saving}>
          {nextLabel ?? "Siguiente"}
        </Button>
      </div>
    </div>
  );
}
