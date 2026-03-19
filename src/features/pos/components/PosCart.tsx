"use client";

import { Typography, Tag } from "antd";
import {
  PlusOutlined, MinusOutlined, DeleteOutlined,
  CheckOutlined, CloseOutlined, ShoppingCartOutlined,
} from "@ant-design/icons";
import type { DiscountedItem } from "@/lib/promotions";

const { Text } = Typography;

interface Props {
  discountedCart: DiscountedItem[];
  total: number;
  totalDiscount: number;
  onUpdateQty: (variantId: string, delta: number) => void;
  onRemove: (variantId: string) => void;
  onConfirm: () => void;
  onClear: () => void;
}

type CartGroup =
  | { type: "item"; item: DiscountedItem }
  | { type: "combo"; name: string; items: DiscountedItem[] };

function buildGroups(discountedCart: DiscountedItem[]): CartGroup[] {
  const groups: CartGroup[] = [];
  const comboMap = new Map<string, DiscountedItem[]>();

  for (const item of discountedCart) {
    const comboMatch = item.promo_label?.match(/^Combo — (.+)$/);
    if (comboMatch) {
      const comboName = comboMatch[1];
      if (!comboMap.has(comboName)) comboMap.set(comboName, []);
      comboMap.get(comboName)!.push(item);
    } else {
      groups.push({ type: "item", item });
    }
  }
  // Combos go after individual items
  for (const [name, items] of Array.from(comboMap)) {
    groups.push({ type: "combo", name, items });
  }
  return groups;
}

function CartItemRow({ item, onUpdateQty, onRemove, showPromoTag = true }: {
  item: DiscountedItem;
  onUpdateQty: (id: string, delta: number) => void;
  onRemove: (id: string) => void;
  showPromoTag?: boolean;
}) {
  const lineTotal = item.unit_price * item.qty_physical - item.discount_applied;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <Text strong style={{ fontSize: 13, display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {item.flavors?.length ? "Pizza mixta" : item.product_name}
        </Text>
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 2, flexWrap: "wrap" }}>
          {item.flavors?.length ? (
            <Text type="secondary" style={{ fontSize: 12 }}>
              {item.variant_name} — {item.flavors.map((f) => f.product_name).join(" / ")}
            </Text>
          ) : (
            <Text type="secondary" style={{ fontSize: 12 }}>{item.variant_name}</Text>
          )}
          {showPromoTag && item.promo_label && (
            <Tag color="red" style={{ margin: 0, fontSize: 11, lineHeight: "16px" }}>{item.promo_label}</Tag>
          )}
        </div>
      </div>

      {/* Quantity controls */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
        <button
          onClick={() => onUpdateQty(item.variant_id, -1)}
          style={{ width: 28, height: 28, borderRadius: "50%", border: "none", background: "#f3f4f6", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
        >
          <MinusOutlined style={{ fontSize: 10 }} />
        </button>
        <div style={{ textAlign: "center", width: 24 }}>
          <Text strong style={{ fontSize: 14 }}>{item.qty_physical}</Text>
          {item.qty_physical !== item.qty && (
            <Text style={{ fontSize: 11, color: "#16a34a", display: "block", lineHeight: 1 }}>({item.qty})</Text>
          )}
        </div>
        <button
          onClick={() => onUpdateQty(item.variant_id, 1)}
          style={{ width: 28, height: 28, borderRadius: "50%", border: "none", background: "#ffedd5", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
        >
          <PlusOutlined style={{ fontSize: 10, color: "#ea580c" }} />
        </button>
      </div>

      {/* Price */}
      <div style={{ textAlign: "right", flexShrink: 0, minWidth: 72 }}>
        {item.discount_applied > 0 && (
          <Text delete type="secondary" style={{ fontSize: 11, display: "block", lineHeight: 1.2 }}>
            Bs {(item.unit_price * item.qty_physical).toFixed(2)}
          </Text>
        )}
        <Text strong style={{ fontSize: 13, color: "#ea580c" }}>Bs {lineTotal.toFixed(2)}</Text>
      </div>

      {/* Delete */}
      <button
        onClick={() => onRemove(item.variant_id)}
        style={{ width: 28, height: 28, borderRadius: "50%", border: "none", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#fef2f2"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
      >
        <DeleteOutlined style={{ fontSize: 12, color: "#9ca3af" }} />
      </button>
    </div>
  );
}

export function PosCart({ discountedCart, total, totalDiscount, onUpdateQty, onRemove, onConfirm, onClear }: Props) {
  const groups = buildGroups(discountedCart);
  const isEmpty = discountedCart.length === 0;

  return (
    <div style={{ width: 380, minWidth: 380, background: "#fff", borderLeft: "1px solid #e5e7eb", display: "flex", flexDirection: "column", boxShadow: "-4px 0 16px rgba(0,0,0,0.06)" }}>

      {/* Header */}
      <div style={{ padding: "14px 20px", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", gap: 8, background: "#ea580c" }}>
        <ShoppingCartOutlined style={{ color: "#fff", fontSize: 18 }} />
        <span style={{ color: "#fff", fontWeight: 700, fontSize: 16 }}>Pedido actual</span>
        {discountedCart.length > 0 && (
          <span style={{ marginLeft: "auto", background: "#fff", color: "#ea580c", fontSize: 12, fontWeight: 700, borderRadius: 12, padding: "1px 8px" }}>
            {discountedCart.reduce((s, i) => s + i.qty_physical, 0)}
          </span>
        )}
      </div>

      {/* Items */}
      <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px" }}>
        {isEmpty ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", color: "#9ca3af" }}>
            <ShoppingCartOutlined style={{ fontSize: 48, opacity: 0.25, marginBottom: 12 }} />
            <Text type="secondary">Agregá productos al pedido</Text>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {groups.map((group, idx) => {
              if (group.type === "item") {
                return (
                  <div key={`item-${idx}-${group.item.variant_id}`} style={{ padding: "10px 12px", background: "#f9fafb", borderRadius: 10, border: "1px solid #f3f4f6" }}>
                    <CartItemRow item={group.item} onUpdateQty={onUpdateQty} onRemove={onRemove} />
                  </div>
                );
              }
              const comboDiscount = group.items.reduce((sum, i) => sum + i.discount_applied, 0);
              return (
                <div key={`combo-${idx}`} style={{ borderRadius: 10, border: "2px solid #fed7aa", overflow: "hidden" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "#fff7ed" }}>
                    <Text strong style={{ fontSize: 12, color: "#c2410c" }}>🍕 {group.name}</Text>
                    <Text style={{ fontSize: 12, color: "#16a34a", fontWeight: 600 }}>- Bs {comboDiscount.toFixed(2)}</Text>
                  </div>
                  {group.items.map((item, i) => (
                    <div key={item.variant_id} style={{ padding: "10px 12px", background: "rgba(255,247,237,0.4)", borderTop: i > 0 ? "1px solid #fed7aa" : undefined }}>
                      <CartItemRow item={item} onUpdateQty={onUpdateQty} onRemove={onRemove} showPromoTag={false} />
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ borderTop: "1px solid #e5e7eb", background: "#fff", padding: "16px 20px" }}>
        {totalDiscount > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 14 }}>
            <Text type="secondary">Descuentos aplicados</Text>
            <Text style={{ color: "#16a34a", fontWeight: 600 }}>- Bs {totalDiscount.toFixed(2)}</Text>
          </div>
        )}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 16 }}>
          <Text style={{ color: "#6b7280", fontSize: 16 }}>Total</Text>
          <Text strong style={{ fontSize: 32, color: "#ea580c" }}>Bs {total.toFixed(2)}</Text>
        </div>

        <button
          disabled={isEmpty}
          onClick={onConfirm}
          style={{
            width: "100%",
            padding: "14px 0",
            borderRadius: 10,
            border: "none",
            fontWeight: 600,
            fontSize: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            marginBottom: 8,
            cursor: isEmpty ? "not-allowed" : "pointer",
            background: isEmpty ? "#f3f4f6" : "#ea580c",
            color: isEmpty ? "#9ca3af" : "#fff",
            transition: "background 0.15s",
          }}
          onMouseEnter={(e) => { if (!isEmpty) (e.currentTarget as HTMLButtonElement).style.background = "#dc4a08"; }}
          onMouseLeave={(e) => { if (!isEmpty) (e.currentTarget as HTMLButtonElement).style.background = "#ea580c"; }}
        >
          <CheckOutlined />
          Confirmar venta
        </button>

        <button
          disabled={isEmpty}
          onClick={onClear}
          style={{
            width: "100%",
            padding: "10px 0",
            borderRadius: 10,
            border: "none",
            fontWeight: 500,
            fontSize: 14,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            cursor: isEmpty ? "not-allowed" : "pointer",
            background: "transparent",
            color: isEmpty ? "#d1d5db" : "#f87171",
            transition: "color 0.15s, background 0.15s",
          }}
          onMouseEnter={(e) => { if (!isEmpty) { (e.currentTarget as HTMLButtonElement).style.color = "#ef4444"; (e.currentTarget as HTMLButtonElement).style.background = "#fef2f2"; } }}
          onMouseLeave={(e) => { if (!isEmpty) { (e.currentTarget as HTMLButtonElement).style.color = "#f87171"; (e.currentTarget as HTMLButtonElement).style.background = "transparent"; } }}
        >
          <CloseOutlined />
          Cancelar pedido
        </button>
      </div>
    </div>
  );
}
