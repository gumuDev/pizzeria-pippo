"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Skeleton } from "antd";
import { ProductFormPage } from "@/features/products/components/ProductFormPage";
import { ProductsService } from "@/features/products/services/products.service";
import type { Product, Ingredient } from "@/features/products/types/product.types";

export default function ProductEditPage() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [detail, ings] = await Promise.all([
        ProductsService.getProductDetail(id),
        ProductsService.getIngredients(),
      ]);
      setProduct(detail as Product);
      setIngredients(ings);
      setLoading(false);
    };
    load();
  }, [id]);

  if (loading) return <div style={{ padding: 24 }}><Skeleton active paragraph={{ rows: 8 }} /></div>;

  return <ProductFormPage editing={product ?? undefined} ingredients={ingredients} />;
}
