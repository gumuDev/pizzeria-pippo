"use client";

import { Button, Card, Select, InputNumber, Tooltip } from "antd";
import { PlusOutlined, MinusCircleOutlined, InfoCircleOutlined } from "@ant-design/icons";
import { useIsMobile } from "@/lib/useIsMobile";
import type { Ingredient, Variant, RecipeItem } from "../types/product.types";

const CONDITION_OPTIONS = [
  { value: "always", label: "Siempre" },
  { value: "takeaway", label: "Solo para llevar" },
  { value: "dine_in", label: "Solo para comer aquí" },
];

interface Props {
  variants: Variant[];
  ingredients: Ingredient[];
  saving: boolean;
  editing: boolean;
  onAddRecipeItem: (variantIndex: number) => void;
  onUpdateRecipeItem: (variantIndex: number, recipeIndex: number, field: keyof RecipeItem, value: string | number) => void;
  onRemoveRecipeItem: (variantIndex: number, recipeIndex: number) => void;
  onPrev: () => void;
  onSave: () => void;
}

export function ProductStepRecipes({
  variants, ingredients, saving, editing,
  onAddRecipeItem, onUpdateRecipeItem, onRemoveRecipeItem,
  onPrev, onSave,
}: Props) {
  const isMobile = useIsMobile();

  return (
    <div>
      {variants.map((variant, vi) => (
        <Card key={vi} style={{ marginBottom: 16 }} size="small" title={`Receta — ${variant.name}`}>
          {variant.recipes.map((recipe, ri) => (
            <div key={ri} style={{ marginBottom: 10 }}>
              {isMobile ? (
                /* Mobile: stacked layout */
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <Select
                    value={recipe.ingredient_id || undefined}
                    placeholder="Insumo"
                    options={ingredients.map((i) => ({ value: i.id, label: `${i.name} (${i.unit})` }))}
                    onChange={(val) => onUpdateRecipeItem(vi, ri, "ingredient_id", val)}
                    style={{ width: "100%" }}
                    showSearch
                    filterOption={(input, option) =>
                      (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                    }
                  />
                  <div style={{ display: "flex", gap: 6 }}>
                    <InputNumber
                      value={recipe.quantity}
                      placeholder="Cantidad"
                      onChange={(val) => onUpdateRecipeItem(vi, ri, "quantity", val ?? 0)}
                      style={{ flex: 1 }}
                      min={0}
                    />
                    <Button
                      type="text"
                      danger
                      icon={<MinusCircleOutlined />}
                      onClick={() => onRemoveRecipeItem(vi, ri)}
                    />
                  </div>
                  <Select
                    value={recipe.apply_condition ?? "always"}
                    options={CONDITION_OPTIONS}
                    onChange={(val) => onUpdateRecipeItem(vi, ri, "apply_condition", val)}
                    style={{ width: "100%" }}
                    suffixIcon={<InfoCircleOutlined style={{ color: "#8c8c8c" }} />}
                  />
                </div>
              ) : (
                /* Desktop: inline row */
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <Select
                    value={recipe.ingredient_id || undefined}
                    placeholder="Insumo"
                    options={ingredients.map((i) => ({ value: i.id, label: `${i.name} (${i.unit})` }))}
                    onChange={(val) => onUpdateRecipeItem(vi, ri, "ingredient_id", val)}
                    style={{ flex: "0 0 38%" }}
                    showSearch
                    filterOption={(input, option) =>
                      (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                    }
                  />
                  <InputNumber
                    value={recipe.quantity}
                    placeholder="Cantidad"
                    onChange={(val) => onUpdateRecipeItem(vi, ri, "quantity", val ?? 0)}
                    style={{ flex: "0 0 18%" }}
                    min={0}
                  />
                  <Tooltip title="Define cuándo se descuenta este insumo del inventario">
                    <Select
                      value={recipe.apply_condition ?? "always"}
                      options={CONDITION_OPTIONS}
                      onChange={(val) => onUpdateRecipeItem(vi, ri, "apply_condition", val)}
                      style={{ flex: 1 }}
                      suffixIcon={<InfoCircleOutlined style={{ color: "#8c8c8c" }} />}
                    />
                  </Tooltip>
                  <Button type="text" danger icon={<MinusCircleOutlined />} onClick={() => onRemoveRecipeItem(vi, ri)} />
                </div>
              )}
            </div>
          ))}
          <Button type="dashed" size="small" icon={<PlusOutlined />} onClick={() => onAddRecipeItem(vi)}>
            Agregar insumo
          </Button>
        </Card>
      ))}

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16 }}>
        <Button onClick={onPrev}>Anterior</Button>
        <Button type="primary" onClick={onSave} loading={saving} disabled={saving}>
          {editing ? "Guardar cambios" : "Crear producto"}
        </Button>
      </div>
    </div>
  );
}
