"use client";

import { Modal, Button, Tag, Typography, Space } from "antd";
import type { Product } from "../types/pos.types";

const { Text } = Typography;

interface Props {
  product: Product | null;
  branchId: string;
  getVariantPrice: (variant: Product["product_variants"][0], branchId: string) => number;
  getPromoLabel: (variantId: string) => string | null;
  onSelect: (product: Product, variant: Product["product_variants"][0]) => void;
  onClose: () => void;
}

export function VariantSelectorModal({ product, branchId, getVariantPrice, getPromoLabel, onSelect, onClose }: Props) {
  return (
    <Modal title={product?.name} open={!!product} onCancel={onClose} footer={null} width={360}>
      <div className="flex flex-col gap-3 mt-4">
        {product?.product_variants?.map((variant) => {
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
