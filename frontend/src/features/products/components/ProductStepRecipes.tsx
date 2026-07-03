"use client";

import { Button, Select, InputNumber, Switch, Typography, Alert } from "antd";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import type { Ingredient, Variant, RecipeItem } from "../types/product.types";

const { Text } = Typography;

const CONDITION_OPTIONS = [
  { value: "always", label: "Siempre" },
  { value: "takeaway", label: "Para llevar" },
  { value: "dine_in", label: "En local" },
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
      {/* Toggle */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, padding: "12px 16px", background: "#f9fafb", borderRadius: 10, border: "1px solid #e5e7eb" }}>
        <Switch checked={hasRecipe} onChange={onToggleRecipe} />
        <div>
          <Text strong style={{ fontSize: 14 }}>Este producto usa ingredientes para elaborarse</Text>
          <Text type="secondary" style={{ fontSize: 12, display: "block" }}>
            {hasRecipe ? "Se descontarán ingredientes del stock al vender" : "Se descontarán unidades del stock al vender (reventa)"}
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
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 12, marginBottom: 12 }}>
          {variants.map((variant, vi) => (
            <VariantRecipeCard
              key={vi}
              variant={variant}
              variantIndex={vi}
              ingredients={ingredients}
              onAddRecipeItem={onAddRecipeItem}
              onUpdateRecipeItem={onUpdateRecipeItem}
              onRemoveRecipeItem={onRemoveRecipeItem}
            />
          ))}
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 24 }}>
        <Button onClick={onPrev}>Anterior</Button>
        <Button type="primary" onClick={onSave} loading={saving} disabled={saving}>
          {editing ? "Guardar cambios" : "Crear producto"}
        </Button>
      </div>
    </div>
  );
}

interface CardProps {
  variant: Variant;
  variantIndex: number;
  ingredients: Ingredient[];
  onAddRecipeItem: (variantIndex: number) => void;
  onUpdateRecipeItem: (variantIndex: number, recipeIndex: number, field: keyof RecipeItem, value: string | number) => void;
  onRemoveRecipeItem: (variantIndex: number, recipeIndex: number) => void;
}

function VariantRecipeCard({ variant, variantIndex, ingredients, onAddRecipeItem, onUpdateRecipeItem, onRemoveRecipeItem }: CardProps) {
  const usedIngredientIds = variant.recipes.map((r) => r.ingredient_id);

  const handleAddIngredient = (ingredientId: string | null) => {
    if (!ingredientId) return;
    onAddRecipeItem(variantIndex);
    setTimeout(() => {
      onUpdateRecipeItem(variantIndex, variant.recipes.length, "ingredient_id", ingredientId);
    }, 0);
  };

  return (
    <div style={{ padding: "14px 16px", background: "#f9fafb", borderRadius: 10, border: "1px solid #e5e7eb" }}>
      {/* Card header */}
      <div style={{ marginBottom: 10, paddingBottom: 8, borderBottom: "1px solid #e5e7eb" }}>
        <Text type="secondary" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5 }}>Receta</Text>
        <Text strong style={{ fontSize: 14, display: "block", color: "#c2410c" }}>{variant.name}</Text>
      </div>

      {/* Recipe rows */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 10 }}>
        {variant.recipes.length === 0 && (
          <Text type="secondary" style={{ fontSize: 12, fontStyle: "italic" }}>Sin ingredientes aún</Text>
        )}
        {variant.recipes.map((recipe, ri) => {
          const ingredient = ingredients.find((i) => i.id === recipe.ingredient_id);
          return (
            <div key={ri} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Text style={{ flex: 1, fontSize: 12, minWidth: 0, wordBreak: "break-word" }}>
                {ingredient ? `${ingredient.name} (${ingredient.unit})` : "—"}
              </Text>
              <InputNumber
                value={recipe.quantity}
                onChange={(val) => onUpdateRecipeItem(variantIndex, ri, "quantity", val ?? 0)}
                style={{ width: 70, flexShrink: 0 }}
                min={0}
                size="small"
              />
              <Select
                value={recipe.apply_condition ?? "always"}
                options={CONDITION_OPTIONS}
                onChange={(val) => onUpdateRecipeItem(variantIndex, ri, "apply_condition", val)}
                style={{ width: 110, flexShrink: 0 }}
                size="small"
              />
              <Button
                type="text"
                danger
                size="small"
                icon={<DeleteOutlined />}
                onClick={() => onRemoveRecipeItem(variantIndex, ri)}
              />
            </div>
          );
        })}
      </div>

      {/* Add ingredient */}
      <Select
        placeholder={<><PlusOutlined style={{ marginRight: 4 }} />Agregar insumo...</>}
        showSearch
        style={{ width: "100%" }}
        size="small"
        filterOption={(input, option) =>
          (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
        }
        options={ingredients
          .filter((i) => !usedIngredientIds.includes(i.id))
          .map((i) => ({ value: i.id, label: `${i.name} (${i.unit})` }))}
        value={null}
        onChange={handleAddIngredient}
      />
    </div>
  );
}
