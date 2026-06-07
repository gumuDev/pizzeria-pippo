"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button, Card, Space, Typography } from "antd";
import { ArrowLeftOutlined, DollarOutlined } from "@ant-design/icons";
import { supabase } from "@/lib/supabase";
import { useProductBranchPrices } from "@/features/products/hooks/useProductBranchPrices";
import { ProductBranchPricesView } from "@/features/products/components/ProductBranchPricesView";

const { Title, Text } = Typography;

export default function ProductBranchPricesPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [productName, setProductName] = useState("");

  const { variants, branches, isLoading, saving, savePrice } = useProductBranchPrices(id);

  useEffect(() => {
    supabase.from("products").select("name").eq("id", id).single()
      .then(({ data }) => { if (data) setProductName(data.name); });
  }, [id]);

  return (
    <div style={{ padding: 24, maxWidth: 800 }}>
      <Space style={{ marginBottom: 20 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => router.push("/products")}>
          Volver a productos
        </Button>
      </Space>

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
        <DollarOutlined style={{ fontSize: 22, color: "#ea580c" }} />
        <div>
          <Title level={4} style={{ margin: 0 }}>{productName || "Cargando..."}</Title>
          <Text type="secondary">Precios por sucursal</Text>
        </div>
      </div>

      <Card>
        <ProductBranchPricesView
          productName={productName}
          variants={variants}
          branches={branches}
          isLoading={isLoading}
          saving={saving}
          onSave={savePrice}
        />
      </Card>
    </div>
  );
}
