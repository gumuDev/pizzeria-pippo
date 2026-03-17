"use client";

import { useState, useEffect } from "react";
import { Modal, Button, Tag, Typography, Space, Select } from "antd";
import { PlusOutlined, MinusOutlined, DeleteOutlined } from "@ant-design/icons";
import type { Product, Variant } from "../types/pos.types";
import type { FlavorItem } from "@/lib/promotions";

const { Text } = Typography;

interface FlavorEntry {
  variantId: string;
  productName: string;
  parts: number;
}

interface Props {
  product: Product | null;
  branchId: string;
  allProducts: Product[];
  getVariantPrice: (variant: Variant, branchId: string) => number;
  getPromoLabel: (variantId: string) => string | null;
  onSelect: (product: Product, variant: Variant, flavors?: FlavorItem[]) => void;
  onClose: () => void;
}

export function VariantSelectorModal({
  product,
  branchId,
  allProducts,
  getVariantPrice,
  getPromoLabel,
  onSelect,
  onClose,
}: Props) {
  const [selectedSize, setSelectedSize] = useState<Variant | null>(null);
  const [flavors, setFlavors] = useState<FlavorEntry[]>([]);

  // Reset when a new product opens
  useEffect(() => {
    setSelectedSize(null);
    setFlavors([]);
  }, [product?.id]);

  // When size is selected, pre-load the current product as the first flavor
  const handleSelectSize = (variant: Variant) => {
    setSelectedSize(variant);
    // Find variant of current product matching this size
    const baseVariantId = product?.product_variants.find((v) => v.name === variant.name)?.id ?? variant.id;
    setFlavors([{ variantId: baseVariantId, productName: product?.name ?? "", parts: 1 }]);
  };

  if (!product) return null;

  const isPizza = product.category === "pizza";
  const variants = product.product_variants ?? [];

  // All active pizza products
  const pizzaProducts = allProducts.filter((p) => p.category === "pizza" && p.is_active !== false);

  // Flavor options for the current size (excluding already selected)
  const selectedVariantIds = new Set(flavors.map((f) => f.variantId));
  const flavorOptions = selectedSize
    ? pizzaProducts.flatMap((p) =>
        p.product_variants
          .filter((v) => v.name === selectedSize.name && !selectedVariantIds.has(v.id))
          .map((v) => ({ value: v.id, label: p.name }))
      )
    : [];

  const totalParts = flavors.reduce((sum, f) => sum + f.parts, 0);

  const addFlavor = (variantId: string) => {
    const p = pizzaProducts.find((p) => p.product_variants.some((v) => v.id === variantId));
    if (!p) return;
    setFlavors((prev) => [...prev, { variantId, productName: p.name, parts: 1 }]);
  };

  const updateParts = (idx: number, delta: number) => {
    setFlavors((prev) =>
      prev.map((f, i) => i === idx ? { ...f, parts: Math.max(1, f.parts + delta) } : f)
    );
  };

  const removeFlavor = (idx: number) => {
    setFlavors((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleConfirm = () => {
    if (!selectedSize) return;
    // Single flavor with no mixing — pass without flavors array
    if (flavors.length === 1) {
      onSelect(product, selectedSize);
      return;
    }
    const flavorItems: FlavorItem[] = flavors.map((f) => ({
      variant_id: f.variantId,
      product_name: f.productName,
      proportion: f.parts / totalParts,
    }));
    onSelect(product, selectedSize, flavorItems);
  };

  // Non-pizza: direct size selection
  if (!isPizza) {
    return (
      <Modal title={product.name} open={!!product} onCancel={onClose} footer={null} width={360}>
        <div className="flex flex-col gap-3 mt-4">
          {variants.map((variant) => {
            const price = getVariantPrice(variant, branchId);
            const promoLabel = getPromoLabel(variant.id);
            return (
              <Button
                key={variant.id}
                size="large"
                block
                className="flex justify-between items-center h-auto py-3"
                onClick={() => onSelect(product, variant)}
              >
                <Space>
                  <Text strong>{variant.name}</Text>
                  {promoLabel && <Tag color="red">{promoLabel}</Tag>}
                </Space>
                <Text strong className="text-orange-600">Bs {price}</Text>
              </Button>
            );
          })}
        </div>
      </Modal>
    );
  }

  // Pizza flow
  return (
    <Modal
      title={product.name}
      open={!!product}
      onCancel={onClose}
      footer={null}
      width={420}
    >
      <div className="flex flex-col gap-4 mt-4">

        {/* Step 1: size */}
        <div>
          <Text type="secondary" className="block mb-2 text-xs uppercase tracking-wide">Tamaño</Text>
          <div className="flex gap-2">
            {variants.map((variant) => {
              const price = getVariantPrice(variant, branchId);
              const promoLabel = getPromoLabel(variant.id);
              const isSelected = selectedSize?.id === variant.id;
              return (
                <button
                  key={variant.id}
                  onClick={() => handleSelectSize(variant)}
                  className={`flex-1 rounded-xl border-2 py-3 px-2 flex flex-col items-center gap-0.5 transition-all cursor-pointer ${
                    isSelected
                      ? "border-orange-500 bg-orange-50"
                      : "border-gray-200 bg-white hover:border-orange-300"
                  }`}
                >
                  <span className={`font-bold text-sm ${isSelected ? "text-orange-600" : "text-gray-700"}`}>
                    {variant.name}
                  </span>
                  <span className={`text-xs font-semibold ${isSelected ? "text-orange-500" : "text-gray-400"}`}>
                    Bs {price}
                  </span>
                  {promoLabel && <Tag color="red" className="!text-xs !mt-1 !mb-0">{promoLabel}</Tag>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 2: flavors (only after size is selected) */}
        {selectedSize && (
          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <Text type="secondary" className="text-xs uppercase tracking-wide">Sabores</Text>
              <Text type="secondary" className="text-xs">
                Total: {totalParts} {totalParts === 1 ? "parte" : "partes"}
              </Text>
            </div>

            {flavors.map((flavor, idx) => {
              const fraction = `${flavor.parts}/${totalParts}`;
              const barWidth = Math.round((flavor.parts / totalParts) * 100);
              return (
                <div key={flavor.variantId} className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                  <div className="flex items-center justify-between mb-2">
                    <Text strong className="text-sm">{flavor.productName}</Text>
                    <div className="flex items-center gap-2">
                      <Text type="secondary" className="text-xs w-8 text-right">{fraction}</Text>
                      {flavors.length > 1 && (
                        <button
                          onClick={() => removeFlavor(idx)}
                          className="text-gray-400 hover:text-red-500 transition-colors p-0.5"
                        >
                          <DeleteOutlined style={{ fontSize: 13 }} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="h-1.5 bg-gray-200 rounded-full mb-3">
                    <div
                      className="h-full bg-orange-400 rounded-full transition-all"
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>

                  {/* Parts control */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => updateParts(idx, -1)}
                      disabled={flavor.parts <= 1}
                      className="w-7 h-7 rounded-lg border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <MinusOutlined style={{ fontSize: 11 }} />
                    </button>
                    <span className="text-base font-bold text-gray-800 w-4 text-center">{flavor.parts}</span>
                    <button
                      onClick={() => updateParts(idx, 1)}
                      className="w-7 h-7 rounded-lg border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                      <PlusOutlined style={{ fontSize: 11 }} />
                    </button>
                    <Text type="secondary" className="text-xs ml-1">
                      {flavor.parts === 1 ? "parte" : "partes"}
                    </Text>
                  </div>
                </div>
              );
            })}

            {/* Add flavor */}
            {flavorOptions.length > 0 && (
              <Select
                placeholder="+ Agregar otro sabor"
                value={undefined}
                onChange={(val: string) => addFlavor(val)}
                options={flavorOptions}
                className="w-full"
                suffixIcon={<PlusOutlined />}
              />
            )}

            {/* Confirm */}
            <Button
              type="primary"
              size="large"
              block
              onClick={handleConfirm}
              style={{ backgroundColor: "#ea580c", borderColor: "#ea580c" }}
            >
              {flavors.length === 1
                ? `Agregar al carrito — Bs ${getVariantPrice(selectedSize, branchId)}`
                : `Agregar pizza mixta — Bs ${getVariantPrice(selectedSize, branchId)}`}
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}
