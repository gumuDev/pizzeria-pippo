"use client";

import { Typography } from "antd";

const { Text } = Typography;

export type StockType = "ingredient" | "product";

interface Props {
  value: StockType;
  onChange: (val: StockType) => void;
}

const OPTIONS: { value: StockType; icon: string; label: string; description: string }[] = [
  { value: "ingredient", icon: "🧂", label: "Insumo", description: "Ingredientes para elaboración" },
  { value: "product", icon: "📦", label: "Reventa", description: "Productos comprados para vender" },
];

export function StockTypeSelector({ value, onChange }: Props) {
  return (
    <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
      {OPTIONS.map((opt) => {
        const selected = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            style={{
              flex: 1, padding: "12px 16px", borderRadius: 10, cursor: "pointer",
              border: `2px solid ${selected ? "#ea580c" : "#e5e7eb"}`,
              background: selected ? "#fff7ed" : "#fff",
              textAlign: "center", transition: "all 0.15s",
            }}
          >
            <div style={{ fontSize: 24, marginBottom: 4 }}>{opt.icon}</div>
            <Text strong style={{ fontSize: 13, color: selected ? "#ea580c" : "#374151", display: "block" }}>
              {opt.label}
            </Text>
            <Text type="secondary" style={{ fontSize: 11 }}>{opt.description}</Text>
          </button>
        );
      })}
    </div>
  );
}
