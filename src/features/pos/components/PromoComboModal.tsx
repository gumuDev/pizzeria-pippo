"use client";

import { useState, useEffect } from "react";
import { Modal, Button, Typography, Tag, Select } from "antd";
import { useIsMobile } from "@/lib/useIsMobile";
import { PlusOutlined, MinusOutlined, DeleteOutlined, CheckOutlined } from "@ant-design/icons";
import type { Promotion, PromotionRule } from "@/lib/promotions";
import type { Product, Variant } from "../types/pos.types";
import type { CartItem, FlavorItem } from "@/lib/promotions";

const { Text } = Typography;

interface SlotSelection {
  variantId: string;
  productName: string;
  variantName: string;
  price: number;
  category: string;
  flavors?: FlavorItem[];
}

interface FlavorEntry {
  variantId: string;
  productName: string;
  parts: number;
}

interface Props {
  promo: Promotion | null;
  products: Product[];
  branchId: string;
  getVariantPrice: (variant: Variant, branchId: string) => number;
  onConfirm: (items: CartItem[]) => void;
  onClose: () => void;
}

function buildSlotLabel(rule: PromotionRule, products: Product[]): string {
  if (rule.variant_id) {
    for (const p of products) {
      const v = p.product_variants.find((pv) => pv.id === rule.variant_id);
      if (v) return `${p.name} — ${v.name}`;
    }
    return "Producto específico";
  }
  const parts = [rule.category, rule.variant_size].filter(Boolean);
  return parts.length ? parts.join(" ") : "Cualquier producto";
}

function getSlotOptions(rule: PromotionRule, products: Product[], branchId: string, getVariantPrice: (v: Variant, b: string) => number) {
  if (rule.variant_id) {
    for (const p of products) {
      const v = p.product_variants.find((pv) => pv.id === rule.variant_id && pv.is_active !== false);
      if (v) return [{ product: p, variant: v, price: getVariantPrice(v, branchId) }];
    }
    return [];
  }
  const results: { product: Product; variant: Variant; price: number }[] = [];
  for (const p of products) {
    if (rule.category && p.category !== rule.category) continue;
    for (const v of p.product_variants) {
      if (v.is_active === false) continue;
      if (rule.variant_size && v.name !== rule.variant_size) continue;
      results.push({ product: p, variant: v, price: getVariantPrice(v, branchId) });
    }
  }
  return results;
}

function FlavorBuilder({
  selectedVariant,
  product,
  products,
  onChange,
}: {
  selectedVariant: Variant;
  product: Product;
  products: Product[];
  onChange: (flavors: FlavorEntry[]) => void;
}) {
  const [flavors, setFlavors] = useState<FlavorEntry[]>([
    { variantId: selectedVariant.id, productName: product.name, parts: 1 },
  ]);

  useEffect(() => {
    onChange(flavors);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flavors]);

  const pizzaProducts = products.filter((p) => p.category === "pizza" && p.is_active !== false);
  const selectedIds = new Set(flavors.map((f) => f.variantId));
  const flavorOptions = pizzaProducts.flatMap((p) =>
    p.product_variants
      .filter((v) => v.name === selectedVariant.name && v.is_active !== false && !selectedIds.has(v.id))
      .map((v) => ({ value: v.id, label: `${p.name}`, productName: p.name }))
  );

  const totalParts = flavors.reduce((s, f) => s + f.parts, 0);

  const addFlavor = (variantId: string) => {
    const opt = flavorOptions.find((o) => o.value === variantId);
    if (!opt) return;
    setFlavors((prev) => [...prev, { variantId, productName: opt.productName, parts: 1 }]);
  };

  const updateParts = (idx: number, delta: number) => {
    setFlavors((prev) => prev.map((f, i) => i === idx ? { ...f, parts: Math.max(1, f.parts + delta) } : f));
  };

  const removeFlavor = (idx: number) => {
    setFlavors((prev) => prev.filter((_, i) => i !== idx));
  };

  return (
    <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 8 }}>
      <Text type="secondary" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1 }}>Sabores</Text>
      {flavors.map((flavor, idx) => {
        const fraction = `${flavor.parts}/${totalParts}`;
        const barWidth = Math.round((flavor.parts / totalParts) * 100);
        return (
          <div key={flavor.variantId} style={{ background: "#f9fafb", borderRadius: 8, padding: "8px 10px", border: "1px solid #e5e7eb" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
              <Text strong style={{ fontSize: 13 }}>{flavor.productName}</Text>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Text type="secondary" style={{ fontSize: 11 }}>{fraction}</Text>
                {flavors.length > 1 && (
                  <button onClick={() => removeFlavor(idx)} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", padding: 2 }}>
                    <DeleteOutlined style={{ fontSize: 12 }} />
                  </button>
                )}
              </div>
            </div>
            <div style={{ height: 4, background: "#e5e7eb", borderRadius: 4, marginBottom: 8 }}>
              <div style={{ height: "100%", width: `${barWidth}%`, background: "#ea580c", borderRadius: 4, transition: "width 0.2s" }} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button onClick={() => updateParts(idx, -1)} disabled={flavor.parts <= 1} style={{ width: 26, height: 26, borderRadius: 6, border: "1px solid #d1d5db", background: "#fff", cursor: flavor.parts <= 1 ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: flavor.parts <= 1 ? 0.4 : 1 }}>
                <MinusOutlined style={{ fontSize: 10 }} />
              </button>
              <Text strong style={{ fontSize: 13, width: 16, textAlign: "center" }}>{flavor.parts}</Text>
              <button onClick={() => updateParts(idx, 1)} style={{ width: 26, height: 26, borderRadius: 6, border: "1px solid #d1d5db", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <PlusOutlined style={{ fontSize: 10 }} />
              </button>
              <Text type="secondary" style={{ fontSize: 11 }}>{flavor.parts === 1 ? "parte" : "partes"}</Text>
            </div>
          </div>
        );
      })}
      {flavorOptions.length > 0 && (
        <Select
          placeholder="+ Agregar otro sabor"
          value={undefined}
          onChange={addFlavor}
          options={flavorOptions}
          style={{ width: "100%" }}
          suffixIcon={<PlusOutlined />}
        />
      )}
    </div>
  );
}

export function PromoComboModal({ promo, products, branchId, getVariantPrice, onConfirm, onClose }: Props) {
  const isMobile = useIsMobile();
  const [selections, setSelections] = useState<(SlotSelection | null)[]>([]);
  const [flavorOverrides, setFlavorOverrides] = useState<Map<number, FlavorEntry[]>>(new Map());
  const [showFlavors, setShowFlavors] = useState<Set<number>>(new Set());

  const rules = promo?.promotion_rules ?? [];
  const comboPrice = rules[0]?.combo_price ?? 0;

  useEffect(() => {
    if (!promo) return;
    const fixed: (SlotSelection | null)[] = rules.map((rule) => {
      if (!rule.variant_id) return null;
      for (const p of products) {
        const v = p.product_variants.find((pv) => pv.id === rule.variant_id);
        if (v) return { variantId: v.id, productName: p.name, variantName: v.name, price: getVariantPrice(v, branchId), category: p.category };
      }
      return null;
    });
    setSelections(fixed);
    setFlavorOverrides(new Map());
    setShowFlavors(new Set());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [promo?.id]);

  if (!promo) return null;

  const allFilled = selections.length === rules.length && selections.every(Boolean);

  const selectOption = (slotIdx: number, product: Product, variant: Variant) => {
    setSelections((prev) => {
      const next = [...prev];
      next[slotIdx] = {
        variantId: variant.id,
        productName: product.name,
        variantName: variant.name,
        price: getVariantPrice(variant, branchId),
        category: product.category,
      };
      return next;
    });
    // reset flavor override for this slot
    setFlavorOverrides((prev) => { const m = new Map(prev); m.delete(slotIdx); return m; });
    setShowFlavors((prev) => { const s = new Set(prev); s.delete(slotIdx); return s; });
  };

  const handleConfirm = () => {
    const items: CartItem[] = selections.map((sel, idx) => {
      if (!sel) return null as unknown as CartItem;
      const flavorEntries = flavorOverrides.get(idx);
      const totalParts = flavorEntries?.reduce((s, f) => s + f.parts, 0) ?? 1;
      const flavors: FlavorItem[] | undefined = flavorEntries && flavorEntries.length > 1
        ? flavorEntries.map((f) => ({ variant_id: f.variantId, product_name: f.productName, proportion: f.parts / totalParts }))
        : undefined;
      return {
        variant_id: sel.variantId,
        qty: 1,
        unit_price: sel.price,
        product_name: sel.productName,
        variant_name: sel.variantName,
        category: sel.category,
        ...(flavors ? { flavors } : {}),
      };
    });
    onConfirm(items.filter(Boolean));
    onClose();
  };

  return (
    <Modal
      title={<span>🎁 {promo.name}</span>}
      open={!!promo}
      onCancel={onClose}
      footer={null}
      width={isMobile ? "100%" : 820}
      style={{ maxWidth: "calc(100vw - 32px)", top: isMobile ? 16 : 24 }}
      destroyOnHidden
    >
      <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: 20, alignItems: "flex-start" }}>
        {/* Slots grid */}
        <div style={{ flex: 1, display: "grid", gridTemplateColumns: isMobile ? "1fr" : (rules.length > 1 ? "1fr 1fr" : "1fr"), gap: 12, minWidth: 0 }}>
          {rules.map((rule, idx) => {
            const options = getSlotOptions(rule, products, branchId, getVariantPrice);
            const isFixed = !!rule.variant_id;
            const selected = selections[idx];
            const label = buildSlotLabel(rule, products);
            const isPizzaSlot = rule.category === "pizza" || (!rule.category && selected?.category === "pizza");
            const selectedProduct = selected ? products.find((p) => p.product_variants.some((v) => v.id === selected.variantId)) : null;
            const selectedVariant = selectedProduct?.product_variants.find((v) => v.id === selected?.variantId);

            return (
              <div key={idx} style={{ border: `2px solid ${selected ? "#fed7aa" : "#e5e7eb"}`, borderRadius: 10, overflow: "hidden", transition: "border-color 0.2s" }}>
                {/* Slot header */}
                <div style={{ padding: "8px 12px", background: selected ? "#fff7ed" : "#f9fafb", display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 22, height: 22, borderRadius: "50%", background: selected ? "#ea580c" : "#e5e7eb", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {selected
                      ? <CheckOutlined style={{ fontSize: 11, color: "#fff" }} />
                      : <Text style={{ fontSize: 11, color: "#6b7280", fontWeight: 700 }}>{idx + 1}</Text>
                    }
                  </div>
                  <Text strong style={{ fontSize: 13, color: selected ? "#c2410c" : "#374151" }}>{label}</Text>
                  {isFixed && <Tag color="blue" style={{ margin: 0, fontSize: 10 }}>Fijo</Tag>}
                </div>

                {/* Selected summary (fixed slots) */}
                {isFixed && selected && (
                  <div style={{ padding: "8px 12px" }}>
                    <Text style={{ fontSize: 12, color: "#ea580c", fontWeight: 600 }}>
                      {selected.productName}{selected.variantName !== selected.productName ? ` — ${selected.variantName}` : ""}
                    </Text>
                  </div>
                )}

                {/* Slot options (flexible slots) */}
                {!isFixed && (
                  <div style={{ padding: "10px 12px" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: 6 }}>
                      {options.map(({ product, variant, price }) => {
                        const isSel = selected?.variantId === variant.id;
                        return (
                          <button
                            key={variant.id}
                            onClick={() => selectOption(idx, product, variant)}
                            style={{
                              border: `2px solid ${isSel ? "#ea580c" : "#e5e7eb"}`,
                              borderRadius: 8,
                              padding: "8px 6px",
                              background: isSel ? "#fff7ed" : "#fff",
                              cursor: "pointer",
                              textAlign: "center",
                              transition: "all 0.15s",
                            }}
                          >
                            <div style={{ fontSize: 12, fontWeight: 700, color: isSel ? "#ea580c" : "#374151", lineHeight: 1.3 }}>{product.name}</div>
                            {variant.name !== product.name && (
                              <div style={{ fontSize: 11, color: "#6b7280", marginTop: 1 }}>{variant.name}</div>
                            )}
                            <div style={{ fontSize: 12, color: isSel ? "#ea580c" : "#9ca3af", fontWeight: 600, marginTop: 2 }}>Bs {price}</div>
                          </button>
                        );
                      })}
                    </div>

                    {isPizzaSlot && selected && selectedProduct && selectedVariant && (
                      <div style={{ marginTop: 8 }}>
                        {!showFlavors.has(idx) ? (
                          <button
                            onClick={() => setShowFlavors((prev) => new Set(Array.from(prev).concat(idx)))}
                            style={{ fontSize: 12, color: "#ea580c", background: "none", border: "none", cursor: "pointer", padding: 0, textDecoration: "underline" }}
                          >
                            + Pizza mixta (combinar sabores)
                          </button>
                        ) : (
                          <FlavorBuilder
                            selectedVariant={selectedVariant}
                            product={selectedProduct}
                            products={products}
                            onChange={(entries) => setFlavorOverrides((prev) => { const m = new Map(prev); m.set(idx, entries); return m; })}
                          />
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Price + confirm panel */}
        <div style={{ flex: isMobile ? "none" : "0 0 180px", width: isMobile ? "100%" : undefined, display: "flex", flexDirection: isMobile ? "row" : "column", gap: 12, alignItems: isMobile ? "center" : undefined }}>
          <div style={{ padding: "16px 14px", background: "#fff7ed", borderRadius: 10, border: "1px solid #fed7aa", textAlign: "center" }}>
            <Text style={{ color: "#c2410c", fontSize: 12, display: "block", marginBottom: 4 }}>Precio del combo</Text>
            <Text strong style={{ color: "#ea580c", fontSize: 24 }}>Bs {comboPrice.toFixed(2)}</Text>
          </div>
          {!isMobile && (
            <div style={{ padding: "10px 14px", background: "#f9fafb", borderRadius: 10, border: "1px solid #e5e7eb" }}>
              {rules.map((_, idx) => {
                const sel = selections[idx];
                return (
                  <div key={idx} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: idx < rules.length - 1 ? 6 : 0 }}>
                    <div style={{ width: 16, height: 16, borderRadius: "50%", background: sel ? "#ea580c" : "#e5e7eb", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {sel && <CheckOutlined style={{ fontSize: 9, color: "#fff" }} />}
                    </div>
                    <Text style={{ fontSize: 11, color: sel ? "#374151" : "#9ca3af" }}>
                      {sel ? `${sel.productName}${sel.variantName !== "Unidad" && sel.variantName !== sel.productName ? ` ${sel.variantName}` : ""}` : `Slot ${idx + 1} pendiente`}
                    </Text>
                  </div>
                );
              })}
            </div>
          )}
          <Button
            type="primary"
            size="large"
            block={!isMobile}
            disabled={!allFilled}
            onClick={handleConfirm}
            style={{ background: allFilled ? "#ea580c" : undefined, borderColor: allFilled ? "#ea580c" : undefined, whiteSpace: "nowrap" }}
          >
            {isMobile ? `Agregar — Bs ${comboPrice.toFixed(2)}` : "Agregar combo"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
