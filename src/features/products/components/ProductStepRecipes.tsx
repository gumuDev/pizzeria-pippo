"use client";

import { Button, Card, Select, InputNumber, Row, Col } from "antd";
import { PlusOutlined, MinusCircleOutlined } from "@ant-design/icons";
import type { Ingredient, Variant, RecipeItem } from "../types/product.types";

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
  return (
    <div>
      {variants.map((variant, vi) => (
        <Card key={vi} className="mb-4" size="small" title={`Receta — ${variant.name}`}>
          {variant.recipes.map((recipe, ri) => (
            <Row key={ri} gutter={8} className="mb-2" align="middle">
              <Col span={12}>
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
              </Col>
              <Col span={8}>
                <InputNumber
                  value={recipe.quantity}
                  placeholder="Cantidad"
                  onChange={(val) => onUpdateRecipeItem(vi, ri, "quantity", val ?? 0)}
                  style={{ width: "100%" }}
                  min={0}
                />
              </Col>
              <Col span={4}>
                <Button type="text" danger icon={<MinusCircleOutlined />} onClick={() => onRemoveRecipeItem(vi, ri)} />
              </Col>
            </Row>
          ))}
          <Button type="dashed" size="small" icon={<PlusOutlined />} onClick={() => onAddRecipeItem(vi)}>
            Agregar insumo
          </Button>
        </Card>
      ))}

      <div className="flex justify-between mt-4">
        <Button onClick={onPrev}>Anterior</Button>
        <Button type="primary" onClick={onSave} loading={saving} disabled={saving}>
          {editing ? "Guardar cambios" : "Crear producto"}
        </Button>
      </div>
    </div>
  );
}
