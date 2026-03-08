"use client";

import { Button, Typography, Space, Empty } from "antd";
import {
  PlusOutlined, MinusOutlined, DeleteOutlined,
  CheckOutlined, CloseOutlined,
} from "@ant-design/icons";
import { Tag } from "antd";
import type { DiscountedItem } from "@/lib/promotions";

const { Title, Text } = Typography;

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
  return (
    <div>
      <div className="flex justify-between items-start mb-1">
        <div className="flex-1 min-w-0">
          <Text strong className="text-sm block truncate">{item.product_name}</Text>
          <Text type="secondary" className="text-xs">{item.variant_name}</Text>
          {showPromoTag && item.promo_label && (
            <Tag color="red" className="!text-xs !mt-1">{item.promo_label}</Tag>
          )}
        </div>
        <Button type="text" danger size="small" icon={<DeleteOutlined />} onClick={() => onRemove(item.variant_id)} />
      </div>
      <div className="flex justify-between items-center">
        <Space size={4}>
          <Button size="small" icon={<MinusOutlined />} onClick={() => onUpdateQty(item.variant_id, -1)} />
          <div className="text-center">
            <Text strong className="w-6 block">{item.qty_physical}</Text>
            {item.qty_physical !== item.qty && (
              <Text className="text-xs text-green-600 block leading-none">({item.qty} cobradas)</Text>
            )}
          </div>
          <Button size="small" icon={<PlusOutlined />} onClick={() => onUpdateQty(item.variant_id, 1)} />
        </Space>
        <div className="text-right">
          {item.discount_applied > 0 && (
            <Text delete type="secondary" className="text-xs block">
              Bs {(item.unit_price * item.qty_physical).toFixed(2)}
            </Text>
          )}
          <Text strong className="text-orange-600">
            Bs {(item.unit_price * item.qty_physical - item.discount_applied).toFixed(2)}
          </Text>
        </div>
      </div>
    </div>
  );
}

export function PosCart({ discountedCart, total, totalDiscount, onUpdateQty, onRemove, onConfirm, onClear }: Props) {
  const groups = buildGroups(discountedCart);

  return (
    <div className="w-80 xl:w-96 bg-white border-l flex flex-col shadow-lg">
      <div className="px-4 py-3 border-b">
        <Title level={5} className="!mb-0">Pedido actual</Title>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {discountedCart.length === 0 ? (
          <Empty description="Carrito vacío" className="mt-8" />
        ) : (
          groups.map((group, idx) => {
            if (group.type === "item") {
              return (
                <div key={group.item.variant_id} className="mb-3 p-2 bg-gray-50 rounded-lg">
                  <CartItemRow item={group.item} onUpdateQty={onUpdateQty} onRemove={onRemove} />
                </div>
              );
            }
            const comboDiscount = group.items.reduce((sum, i) => sum + i.discount_applied, 0);
            return (
              <div key={`combo-${idx}`} className="mb-3 rounded-lg border-2 border-orange-400 overflow-hidden">
                <div className="flex justify-between items-center px-3 py-1.5 bg-orange-50">
                  <Text strong className="text-xs text-orange-700">🍕 {group.name}</Text>
                  <Text className="text-xs text-green-600 font-semibold">- Bs {comboDiscount.toFixed(2)}</Text>
                </div>
                {group.items.map((item, i) => (
                  <div key={item.variant_id} className={`px-2 py-2 bg-orange-50/40 ${i < group.items.length - 1 ? "border-b border-orange-200" : ""}`}>
                    <CartItemRow item={item} onUpdateQty={onUpdateQty} onRemove={onRemove} showPromoTag={false} />
                  </div>
                ))}
              </div>
            );
          })
        )}
      </div>

      <div className="p-4 border-t bg-gray-50">
        {totalDiscount > 0 && (
          <div className="flex justify-between mb-1">
            <Text type="secondary">Descuentos</Text>
            <Text type="success">- Bs {totalDiscount.toFixed(2)}</Text>
          </div>
        )}
        <div className="flex justify-between mb-4">
          <Text strong className="text-lg">Total</Text>
          <Text strong className="text-xl text-orange-600">Bs {total.toFixed(2)}</Text>
        </div>
        <Space direction="vertical" className="w-full" size={8}>
          <Button
            type="primary" block size="large" icon={<CheckOutlined />}
            disabled={discountedCart.length === 0} onClick={onConfirm}
          >
            Confirmar venta
          </Button>
          <Button
            block danger icon={<CloseOutlined />}
            disabled={discountedCart.length === 0} onClick={onClear}
          >
            Cancelar pedido
          </Button>
        </Space>
      </div>
    </div>
  );
}
