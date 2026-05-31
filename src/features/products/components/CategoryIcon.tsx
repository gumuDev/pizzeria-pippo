"use client";

interface Props {
  size?: number;
}

export function CategoryIcon({ size = 24 }: Props) {
  return (
    <span style={{ fontSize: size, lineHeight: 1 }}>📦</span>
  );
}
