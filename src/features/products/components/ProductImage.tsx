"use client";

import NextImage from "next/image";
import { CATEGORY_BG } from "../constants/product.constants";
import { CategoryIcon } from "./CategoryIcon";

interface Props {
  url: string;
  category: string;
  width?: number;
  height?: number;
}

export function ProductImage({ url, category, width = 48, height = 48 }: Props) {
  if (url) {
    return (
      <NextImage
        src={url}
        alt="producto"
        width={width}
        height={height}
        style={{ objectFit: "cover", borderRadius: 8 }}
      />
    );
  }
  return (
    <div style={{
      width, height, borderRadius: 8,
      background: CATEGORY_BG[category] ?? "#f3f4f6",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <CategoryIcon category={category} size={width * 0.45} />
    </div>
  );
}
