"use client";

import { Row, Col, Select, InputNumber, Button, Typography, Divider } from "antd";
import { PlusOutlined, MinusCircleOutlined } from "@ant-design/icons";
import type { Rule, Variant } from "../types/promotion.types";

const { Text } = Typography;

const CATEGORY_OPTIONS = [
  { value: "pizza", label: "Pizza" },
  { value: "bebida", label: "Bebida" },
  { value: "otro", label: "Otro" },
];

interface Props {
  promoType: string;
  rules: Rule[];
  variants: Variant[];
  onAdd: () => void;
  onUpdate: (index: number, field: keyof Rule, value: unknown) => void;
  onRemove: (index: number) => void;
}

export function PromotionRules({ promoType, rules, variants, onAdd, onUpdate, onRemove }: Props) {
  const variantOptions = variants.map((v) => ({ value: v.id, label: `${v.product_name} — ${v.name}` }));
  const sizeOptions = Array.from(new Set(variants.map((v) => v.name))).map((s) => ({ value: s, label: s }));
  const filterOption = (input: string, option?: { label: string }) =>
    (option?.label ?? "").toLowerCase().includes(input.toLowerCase());

  const getSlotType = (rule: Rule): "specific" | "flexible" =>
    rule.slot_type ?? "specific";

  const handleSlotTypeChange = (index: number, type: "specific" | "flexible") => {
    onUpdate(index, "slot_type", type);
    if (type === "specific") {
      onUpdate(index, "category", null);
      onUpdate(index, "variant_size", null);
    } else {
      onUpdate(index, "variant_id", null);
    }
  };

  return (
    <>
      <Divider orientation="left" plain>Reglas</Divider>
      {rules.map((rule, i) => (
        <div key={i} className="bg-gray-50 rounded p-3 mb-3">
          <div className="flex justify-between items-start mb-2">
            <Text strong className="text-sm">Regla {i + 1}</Text>
            <Button type="text" danger size="small" icon={<MinusCircleOutlined />} onClick={() => onRemove(i)} />
          </div>

          {promoType === "BUY_X_GET_Y" && (
            <Row gutter={8}>
              <Col span={10}>
                <Text type="secondary" className="text-xs block mb-1">Variante</Text>
                <Select value={rule.variant_id ?? undefined} options={variantOptions} onChange={(v) => onUpdate(i, "variant_id", v)} style={{ width: "100%" }} showSearch placeholder="Seleccionar variante" filterOption={filterOption} />
              </Col>
              <Col span={7}>
                <Text type="secondary" className="text-xs block mb-1">Compra X</Text>
                <InputNumber value={rule.buy_qty ?? undefined} min={1} style={{ width: "100%" }} placeholder="Ej: 2" onChange={(v) => onUpdate(i, "buy_qty", v)} />
              </Col>
              <Col span={7}>
                <Text type="secondary" className="text-xs block mb-1">Llévate Y gratis</Text>
                <InputNumber value={rule.get_qty ?? undefined} min={1} style={{ width: "100%" }} placeholder="Ej: 1" onChange={(v) => onUpdate(i, "get_qty", v)} />
              </Col>
            </Row>
          )}

          {promoType === "PERCENTAGE" && (
            <Row gutter={8}>
              <Col span={14}>
                <Text type="secondary" className="text-xs block mb-1">Variante (vacío = todos los productos)</Text>
                <Select value={rule.variant_id ?? undefined} options={variantOptions} onChange={(v) => onUpdate(i, "variant_id", v)} style={{ width: "100%" }} showSearch allowClear placeholder="Todos los productos" filterOption={filterOption} />
              </Col>
              <Col span={10}>
                <Text type="secondary" className="text-xs block mb-1">Descuento %</Text>
                <InputNumber value={rule.discount_percent ?? undefined} min={1} max={100} suffix="%" style={{ width: "100%" }} placeholder="Ej: 20" onChange={(v) => onUpdate(i, "discount_percent", v)} />
              </Col>
            </Row>
          )}

          {promoType === "COMBO" && (
            <Row gutter={8}>
              <Col span={8}>
                <Text type="secondary" className="text-xs block mb-1">Tipo de slot</Text>
                <Select
                  value={getSlotType(rule)}
                  onChange={(v) => handleSlotTypeChange(i, v)}
                  style={{ width: "100%" }}
                  options={[
                    { value: "specific", label: "Variante específica" },
                    { value: "flexible", label: "Categoría + Tamaño" },
                  ]}
                />
              </Col>

              {getSlotType(rule) === "specific" ? (
                <>
                  <Col span={i === 0 ? 10 : 16}>
                    <Text type="secondary" className="text-xs block mb-1">Variante del combo</Text>
                    <Select value={rule.variant_id ?? undefined} options={variantOptions} onChange={(v) => onUpdate(i, "variant_id", v)} style={{ width: "100%" }} showSearch placeholder="Seleccionar variante" filterOption={filterOption} />
                  </Col>
                  {i === 0 && (
                    <Col span={6}>
                      <Text type="secondary" className="text-xs block mb-1">Precio combo (Bs)</Text>
                      <InputNumber value={rule.combo_price ?? undefined} min={0} prefix="Bs" style={{ width: "100%" }} placeholder="Ej: 150" onChange={(v) => onUpdate(i, "combo_price", v)} />
                    </Col>
                  )}
                </>
              ) : (
                <>
                  <Col span={i === 0 ? 7 : 8}>
                    <Text type="secondary" className="text-xs block mb-1">Categoría</Text>
                    <Select value={rule.category ?? undefined} options={CATEGORY_OPTIONS} onChange={(v) => onUpdate(i, "category", v)} style={{ width: "100%" }} placeholder="Categoría" allowClear />
                  </Col>
                  <Col span={i === 0 ? 7 : 8}>
                    <Text type="secondary" className="text-xs block mb-1">Tamaño</Text>
                    <Select value={rule.variant_size ?? undefined} options={sizeOptions} onChange={(v) => onUpdate(i, "variant_size", v)} style={{ width: "100%" }} placeholder="Tamaño" allowClear />
                  </Col>
                  {i === 0 && (
                    <Col span={6}>
                      <Text type="secondary" className="text-xs block mb-1">Precio combo (Bs)</Text>
                      <InputNumber value={rule.combo_price ?? undefined} min={0} prefix="Bs" style={{ width: "100%" }} placeholder="Ej: 150" onChange={(v) => onUpdate(i, "combo_price", v)} />
                    </Col>
                  )}
                </>
              )}
            </Row>
          )}
        </div>
      ))}
      <Button type="dashed" block icon={<PlusOutlined />} onClick={onAdd} className="mb-2">
        {promoType === "BUY_X_GET_Y" && "Agregar variante con 2x1"}
        {promoType === "PERCENTAGE" && "Agregar descuento"}
        {promoType === "COMBO" && "Agregar producto al combo"}
      </Button>
    </>
  );
}
