"use client";

import { Button, Select, InputNumber, Tooltip, Switch, Typography, Alert } from "antd";
import { PlusOutlined, MinusCircleOutlined, InfoCircleOutlined } from "@ant-design/icons";
import type { Ingredient, Variant, RecipeItem } from "../types/product.types";

const { Text } = Typography;

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
  hasRecipe: boolean;
  onToggleRecipe: (val: boolean) => void;
  onAddRecipeItem: (variantIndex: number) => void;
  onUpdateRecipeItem: (variantIndex: number, recipeIndex: number, field: keyof RecipeItem, value: string | number) => void;
  onRemoveRecipeItem: (variantIndex: number, recipeIndex: number) => void;
  onPrev: () => void;
  onSave: () => void;
}

export function ProductStepRecipes({
  variants, ingredients, saving, editing,
  hasRecipe, onToggleRecipe,
  onAddRecipeItem, onUpdateRecipeItem, onRemoveRecipeItem,
  onPrev, onSave,
}: Props) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, padding: "12px 16px", background: "#f9fafb", borderRadius: 10, border: "1px solid #e5e7eb" }}>
        <Switch checked={hasRecipe} onChange={onToggleRecipe} />
        <div>
          <Text strong style={{ fontSize: 14 }}>Este producto usa ingredientes para elaborarse</Text>
          <Text type="secondary" style={{ fontSize: 12, display: "block" }}>
            {hasRecipe
              ? "Se descontarán ingredientes del stock al vender"
              : "Se descontarán unidades del stock al vender (reventa)"}
          </Text>
        </div>
      </div>

      {!hasRecipe && (
        <Alert
          type="info"
          showIcon
          message="Producto de reventa"
          description="Este producto se vende por unidades. Cargá el stock desde Stock → Reventa al registrar una compra."
          style={{ marginBottom: 16 }}
        />
      )}

      {hasRecipe && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: 16 }}>
          {variants.map((variant, vi) => (
            <div key={vi} style={{ background: "#f9fafb", borderRadius: 10, border: "1px solid #e5e7eb", overflow: "hidden" }}>
              {/* Variant header */}
              <div style={{ padding: "10px 14px", background: "#fff7ed", borderBottom: "1px solid #fed7aa" }}>
                <Text strong style={{ color: "#c2410c", fontSize: 13 }}>Receta — {variant.name}</Text>
              </div>

              {/* Ingredients list */}
              <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
                {variant.recipes.map((recipe, ri) => (
                  <div key={ri} style={{ display: "flex", gap: 6, alignItems: "center" }}>
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
                      placeholder="Cant."
                      onChange={(val) => onUpdateRecipeItem(vi, ri, "quantity", val ?? 0)}
                      style={{ flex: "0 0 80px" }}
                      min={0}
                    />
                    <Tooltip title="Cuándo se descuenta este insumo del inventario">
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
                ))}
                <Button type="dashed" size="small" icon={<PlusOutlined />} onClick={() => onAddRecipeItem(vi)}>
                  Agregar insumo
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20 }}>
        <Button onClick={onPrev}>Anterior</Button>
        <Button type="primary" onClick={onSave} loading={saving} disabled={saving}>
          {editing ? "Guardar cambios" : "Crear producto"}
        </Button>
      </div>
    </div>
  );
}
