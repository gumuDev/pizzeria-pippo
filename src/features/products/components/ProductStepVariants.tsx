"use client";

import { Button, Select, InputNumber, Typography, Switch, Tag } from "antd";
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
  onReactivateVariant: (index: number) => void;
  onPrev: () => void;
  onNext: () => void;
  nextLabel?: string;
  saving?: boolean;
}

export function ProductStepVariants({
  variants, variantTypeOptions,
  hasVariants, onToggleVariants,
  onUpdateVariant,
  onAddVariant, onRemoveVariant, onReactivateVariant,
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
        <div style={{ padding: "16px 20px", background: "#f9fafb", borderRadius: 10, border: "1px solid #e5e7eb", display: "flex", alignItems: "center", gap: 16 }}>
          <Text type="secondary" style={{ whiteSpace: "nowrap" }}>Precio base</Text>
          <InputNumber
            prefix="Bs"
            value={simpleVariant.base_price}
            onChange={(val) => onUpdateVariant(0, "base_price", val ?? 0)}
            style={{ width: 160 }}
            min={0}
          />
        </div>
      )}

      {hasVariants && (
        <>
          {variantTypeOptions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No hay tipos de variante configurados. Creá uno primero en <strong>Tipos de variante</strong>.
            </div>
          ) : (
            <>
              {/* Variants as horizontal cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12, marginBottom: 12 }}>
                {variants.map((variant, vi) => {
                  const inactive = variant.is_active === false;
                  const activeCount = variants.filter((v) => v.is_active !== false).length;
                  return (
                    <div
                      key={vi}
                      style={{ padding: "14px 16px", background: inactive ? "#fafafa" : "#f9fafb", borderRadius: 10, border: `1px solid ${inactive ? "#e5e7eb" : "#e5e7eb"}`, position: "relative", opacity: inactive ? 0.6 : 1 }}
                    >
                      {inactive ? (
                        <button
                          onClick={() => onReactivateVariant(vi)}
                          style={{ position: "absolute", top: 8, right: 8, background: "none", border: "1px solid #d1d5db", borderRadius: 6, cursor: "pointer", fontSize: 11, color: "#6b7280", padding: "2px 8px" }}
                        >
                          Reactivar
                        </button>
                      ) : (
                        activeCount > 1 && (
                          <button
                            onClick={() => onRemoveVariant(vi)}
                            style={{ position: "absolute", top: 8, right: 8, background: "none", border: "none", cursor: "pointer", color: "#ef4444", padding: 2 }}
                          >
                            <MinusCircleOutlined style={{ fontSize: 14 }} />
                          </button>
                        )
                      )}
                      <Text type="secondary" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5 }}>Tamaño</Text>
                      <Select
                        value={variant.name}
                        options={variantTypeOptions.filter(
                          (o) => o.value === variant.name || !variants.some((v, i) => i !== vi && v.name === o.value)
                        )}
                        onChange={(val) => onUpdateVariant(vi, "name", val)}
                        style={{ width: "100%", marginTop: 4, marginBottom: 10 }}
                        disabled={inactive}
                      />
                      <Text type="secondary" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5 }}>Precio base</Text>
                      <InputNumber
                        prefix="Bs"
                        value={variant.base_price}
                        onChange={(val) => onUpdateVariant(vi, "base_price", val ?? 0)}
                        style={{ width: "100%", marginTop: 4 }}
                        min={0}
                        disabled={inactive}
                      />
                    </div>
                  );
                })}

                {variants.filter((v) => v.is_active !== false).length < variantTypeOptions.length && (
                  <button
                    onClick={onAddVariant}
                    style={{ padding: "14px 16px", borderRadius: 10, border: "2px dashed #d1d5db", background: "#fff", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, color: "#6b7280", minHeight: 120 }}
                  >
                    <PlusOutlined style={{ fontSize: 20 }} />
                    <Text type="secondary" style={{ fontSize: 12 }}>Agregar variante</Text>
                  </button>
                )}
              </div>
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
