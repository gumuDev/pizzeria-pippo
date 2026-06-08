"use client";

import { useState, useEffect } from "react";
import { ProductsService } from "../services/products.service";
import type { Ingredient } from "../types/product.types";

interface RecipeItem {
  ingredient_id: string;
  quantity: number;
  apply_condition?: string;
  ingredients: { name: string; unit: string };
}

interface BranchPrice {
  branch_id: string;
  price: number;
  branches?: { name: string };
}

interface Variant {
  id: string;
  name: string;
  base_price: number;
  is_active: boolean;
  branch_prices: BranchPrice[];
  recipes: RecipeItem[];
}

export interface ProductDetail {
  id: string;
  name: string;
  category: string;
  description: string;
  image_url: string;
  is_active: boolean;
  product_variants: Variant[];
}

export function useProductDetail(id: string) {
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);

  const loadProduct = async () => {
    const data = await ProductsService.getProductDetail(id);
    if (data) setProduct(data as ProductDetail);
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([loadProduct(), ProductsService.getIngredients().then(setIngredients)]);
      setLoading(false);
    };
    load();
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  return { product, ingredients, loading, loadProduct };
}
