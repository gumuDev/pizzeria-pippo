"use client";

import { Radio } from "antd";

export type StockType = "ingredient" | "product";

interface Props {
  value: StockType;
  onChange: (val: StockType) => void;
}

export function StockTypeSelector({ value, onChange }: Props) {
  return (
    <div style={{ marginBottom: 20 }}>
      <Radio.Group
        value={value}
        onChange={(e) => onChange(e.target.value)}
        optionType="button"
        buttonStyle="solid"
      >
        <Radio.Button value="ingredient">🧂 Insumos</Radio.Button>
        <Radio.Button value="product">📦 Reventa</Radio.Button>
      </Radio.Group>
    </div>
  );
}
