"use client";

import { useState, useRef } from "react";
import type { Variant, RecipeItem, VariantTypeOption } from "../types/product.types";

const EMPTY_VARIANT: Variant = { name: "Unidad", base_price: 0, branch_prices: [], recipes: [] };

export function useProductVariants(variantTypeOptions: VariantTypeOption[]) {
  const [variants, setVariants] = useState<Variant[]>([EMPTY_VARIANT]);
  const [hasRecipe, setHasRecipeState] = useState(true);
  const [hasVariants, setHasVariantsState] = useState(false);
  const savedVariantsRef = useRef<Variant[]>([]);

  const toggleHasRecipe = (val: boolean) => {
    setHasRecipeState(val);
    if (!val) {
      setVariants((prev) => prev.map((v) => ({ ...v, recipes: [] })));
    }
  };

  const toggleHasVariants = (val: boolean) => {
    setHasVariantsState(val);
    if (!val) {
      setVariants((prev) => {
        savedVariantsRef.current = prev;
        const first = prev[0] ?? EMPTY_VARIANT;
        return [{ ...first, name: "Unidad" }];
      });
    } else {
      const saved = savedVariantsRef.current;
      if (saved.length > 0 && !(saved.length === 1 && saved[0].name === "Unidad")) {
        setVariants(saved);
      } else {
        setVariants((prev) =>
          prev.map((v, i) => i === 0 && v.name === "Unidad" && variantTypeOptions.length > 0
            ? { ...v, name: variantTypeOptions[0].value }
            : v
          )
        );
      }
    }
  };

  const resetVariants = () => {
    setHasRecipeState(true);
    setHasVariantsState(false);
    setVariants([EMPTY_VARIANT]);
  };

  const loadVariants = (loaded: Variant[], anyHasRecipe: boolean, isSimple: boolean) => {
    savedVariantsRef.current = [];
    setVariants(loaded);
    setHasRecipeState(anyHasRecipe);
    setHasVariantsState(!isSimple);
  };

  const updateVariant = (index: number, field: keyof Variant, value: unknown) => {
    setVariants((prev) => prev.map((v, i) => i === index ? { ...v, [field]: value } : v));
  };

  const addVariant = () => {
    const used = variants.map((v) => v.name);
    const next = variantTypeOptions.find((o) => !used.includes(o.value));
    if (next) {
      setVariants((prev) => [...prev, { name: next.value, base_price: 0, branch_prices: [], recipes: [], is_active: true }]);
    }
  };

  const reactivateVariant = (index: number) => {
    setVariants((prev) => prev.map((v, i) => i === index ? { ...v, is_active: true } : v));
  };

  const removeVariant = (index: number) => {
    setVariants((prev) => prev.filter((_, i) => i !== index));
  };

  const addRecipeItem = (variantIndex: number, ingredientId = "") => {
    updateVariant(variantIndex, "recipes", [
      ...variants[variantIndex].recipes,
      { ingredient_id: ingredientId, quantity: 0, apply_condition: "always" as const },
    ]);
  };

  const updateRecipeItem = (variantIndex: number, recipeIndex: number, field: keyof RecipeItem, value: string | number) => {
    const updated = variants[variantIndex].recipes.map((r, i) =>
      i === recipeIndex ? { ...r, [field]: value } : r
    );
    updateVariant(variantIndex, "recipes", updated);
  };

  const removeRecipeItem = (variantIndex: number, recipeIndex: number) => {
    updateVariant(variantIndex, "recipes", variants[variantIndex].recipes.filter((_, i) => i !== recipeIndex));
  };

  return {
    variants, hasRecipe, hasVariants,
    setHasRecipe: toggleHasRecipe, setHasVariants: toggleHasVariants,
    // Raw setter with no side effect (clearing recipes) — used when hasRecipe
    // is derived automatically from step1Data.product_type, not from the UI switch.
    setHasRecipeSilently: setHasRecipeState,
    resetVariants, loadVariants,
    updateVariant, addVariant, removeVariant, reactivateVariant,
    addRecipeItem, updateRecipeItem, removeRecipeItem,
  };
}
