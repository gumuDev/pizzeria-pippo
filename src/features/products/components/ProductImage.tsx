"use client";

import NextImage from "next/image";
import { CategoryIcon } from "./CategoryIcon";

interface Props {
  url: string;
  width?: number;
  height?: number;
}

export function ProductImage({ url, width = 48, height = 48 }: Props) {
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
      background: "#f3f4f6",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <CategoryIcon size={width * 0.45} />
    </div>
  );
}
