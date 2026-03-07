"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import NextImage from "next/image";
import {
  Table, Button, Modal, Form, Input, Select, Space,
  Tag, Typography, Steps, Upload, Switch, Tooltip,
  InputNumber, Row, Col, Card, notification,
} from "antd";
import {
  PlusOutlined, EditOutlined, StopOutlined,
  CheckCircleOutlined, UploadOutlined, MinusCircleOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import { supabase } from "@/lib/supabase";

const { Title, Text } = Typography;
const { TextArea } = Input;

const CATEGORY_OPTIONS = [
  { value: "pizza", label: "Pizza" },
  { value: "bebida", label: "Bebida" },
  { value: "otro", label: "Otro" },
];

const CATEGORY_COLORS: Record<string, string> = {
  pizza: "red",
  bebida: "blue",
  otro: "green",
};

const CATEGORY_BG: Record<string, string> = {
  pizza: "#fef2f2",
  bebida: "#eff6ff",
  otro: "#f0fdf4",
};

const CATEGORY_ICON_COLOR: Record<string, string> = {
  pizza: "#f97316",
  bebida: "#3b82f6",
  otro: "#22c55e",
};

const CATEGORY_EMOJI: Record<string, string> = {
  pizza: "🍕",
  bebida: "🥤",
  otro: "🍽️",
};

function CategoryIcon({ category, size = 24 }: { category: string; size?: number }) {
  return (
    <span style={{ fontSize: size, lineHeight: 1 }}>
      {CATEGORY_EMOJI[category] ?? "🍽️"}
    </span>
  );
}

function ProductImage({ url, category, width = 48, height = 48 }: {
  url: string; category: string; width?: number; height?: number;
}) {
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

const VARIANT_OPTIONS = [
  { value: "Personal", label: "Personal" },
  { value: "Mediana", label: "Mediana" },
  { value: "Familiar", label: "Familiar" },
];

interface Ingredient { id: string; name: string; unit: string; }
interface Branch { id: string; name: string; }
interface RecipeItem { ingredient_id: string; quantity: number; }
interface BranchPrice { branch_id: string; price: number; }
interface Variant {
  name: string;
  base_price: number;
  branch_prices: BranchPrice[];
  recipes: RecipeItem[];
}
// branch_id is set once at step 1 and applied to all variants
interface Product {
  id: string;
  name: string;
  category: string;
  description: string;
  image_url: string;
  is_active: boolean;
  product_variants: Array<{ id: string; name: string; base_price: number }>;
}

export default function ProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>("");
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [showInactive, setShowInactive] = useState(false);
  const [selectedBranchId, setSelectedBranchId] = useState<string>("");
  const [step1Data, setStep1Data] = useState<{ name: string; category: string; description: string; branch_id: string }>({ name: "", category: "", description: "", branch_id: "" });

  // Step forms
  const [formStep1] = Form.useForm();
  const [variants, setVariants] = useState<Variant[]>([
    { name: "Personal", base_price: 0, branch_prices: [], recipes: [] },
  ]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    let productQuery = supabase.from("products").select("*, product_variants(id, name, base_price)").order("name");
    if (!showInactive) productQuery = productQuery.eq("is_active", true);
    const [{ data: p }, { data: i }, { data: b }] = await Promise.all([
      productQuery,
      supabase.from("ingredients").select("*").eq("is_active", true).order("name"),
      supabase.from("branches").select("*").eq("is_active", true).order("name"),
    ]);
    if (p) setProducts(p);
    if (i) setIngredients(i);
    if (b) setBranches(b);
    setLoading(false);
  }, [showInactive]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const openCreate = () => {
    setEditing(null);
    setCurrentStep(0);
    setImageUrl("");
    setSelectedBranchId("");
    setStep1Data({ name: "", category: "", description: "", branch_id: "" });
    formStep1.resetFields();
    setVariants([{ name: "Personal", base_price: 0, branch_prices: [], recipes: [] }]);
    setModalOpen(true);
  };

  const openEdit = async (record: Product) => {
    setEditing(record);
    setCurrentStep(0);
    setImageUrl(record.image_url ?? "");

    // Load full variant data
    const { data } = await supabase
      .from("product_variants")
      .select("*, branch_prices(*), recipes(*)")
      .eq("product_id", record.id);

    const loadedVariants = data
      ? data.map((v) => ({
          name: v.name,
          base_price: v.base_price,
          branch_prices: v.branch_prices ?? [],
          recipes: v.recipes ?? [],
        }))
      : [];

    // Infer selected branch from existing branch_prices
    const existingBranchId = loadedVariants[0]?.branch_prices?.[0]?.branch_id ?? "";
    setSelectedBranchId(existingBranchId);

    formStep1.setFieldsValue({
      name: record.name,
      category: record.category,
      description: record.description,
      branch_id: existingBranchId || undefined,
    });

    setStep1Data({
      name: record.name,
      category: record.category,
      description: record.description ?? "",
      branch_id: existingBranchId,
    });

    setVariants(loadedVariants);
    setModalOpen(true);
  };

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    const token = await getToken();
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/upload", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    if (res.ok) {
      const { url } = await res.json();
      setImageUrl(url);
    } else {
      const { error } = await res.json();
      notification.error({ message: error ?? "Error al subir la imagen" });
    }
    setUploading(false);
    return false; // prevent default upload
  };

  const getToken = async () => {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? "";
  };

  const handleSave = async () => {
    // Ensure each variant has a branch_price entry for the selected branch
    const variantsWithBranch = variants.map((v) => {
      if (!selectedBranchId) return v;
      const alreadyHas = v.branch_prices.some((bp) => bp.branch_id === selectedBranchId);
      if (alreadyHas) return v;
      return { ...v, branch_prices: [...v.branch_prices, { branch_id: selectedBranchId, price: v.base_price }] };
    });
    const payload = {
      name: step1Data.name,
      category: step1Data.category,
      description: step1Data.description,
      image_url: imageUrl,
      branch_id: selectedBranchId,
      variants: variantsWithBranch,
    };

    const url = editing ? `/api/products/${editing.id}` : "/api/products";
    const method = editing ? "PUT" : "POST";
    const token = await getToken();

    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      setModalOpen(false);
      fetchAll();
    }
  };

  const updateVariant = (index: number, field: keyof Variant, value: unknown) => {
    setVariants((prev) => prev.map((v, i) => i === index ? { ...v, [field]: value } : v));
  };

  const addVariant = () => {
    const used = variants.map((v) => v.name);
    const next = VARIANT_OPTIONS.find((o) => !used.includes(o.value));
    if (next) {
      setVariants((prev) => [...prev, { name: next.value, base_price: 0, branch_prices: [], recipes: [] }]);
    }
  };

  const removeVariant = (index: number) => {
    setVariants((prev) => prev.filter((_, i) => i !== index));
  };

  const addRecipeItem = (variantIndex: number) => {
    updateVariant(variantIndex, "recipes", [
      ...variants[variantIndex].recipes,
      { ingredient_id: "", quantity: 0 },
    ]);
  };

  const updateRecipeItem = (variantIndex: number, recipeIndex: number, field: keyof RecipeItem, value: string | number) => {
    const updated = variants[variantIndex].recipes.map((r, i) =>
      i === recipeIndex ? { ...r, [field]: value } : r
    );
    updateVariant(variantIndex, "recipes", updated);
  };

  const removeRecipeItem = (variantIndex: number, recipeIndex: number) => {
    updateVariant(variantIndex, "recipes", variants[variantIndex].recipes.filter((_, i) => i !== recipeIndex));
  };

  const updateBranchPrice = (variantIndex: number, branchId: string, price: number) => {
    const updated = variants[variantIndex].branch_prices.map((bp) =>
      bp.branch_id === branchId ? { ...bp, price } : bp
    );
    updateVariant(variantIndex, "branch_prices", updated);
  };

  const handleToggleActive = async (product: Product) => {
    const token = await getToken();
    const res = await fetch(`/api/products/${product.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ is_active: !product.is_active }),
    });
    if (res.ok) {
      fetchAll();
      notification.success({ message: product.is_active ? "Producto desactivado" : "Producto reactivado" });
    } else {
      const { error } = await res.json();
      notification.error({ message: error ?? "Error al actualizar" });
    }
  };

  const filteredProducts = filterCategory
    ? products.filter((p) => p.category === filterCategory)
    : products;

  const columns = [
    {
      title: "Imagen",
      key: "image_url",
      width: 72,
      render: (_: unknown, record: Product) => (
        <ProductImage url={record.image_url} category={record.category} />
      ),
    },
    {
      title: "Nombre",
      dataIndex: "name",
      key: "name",
      render: (name: string, record: Product) => (
        <Space>
          <Text delete={!record.is_active} style={!record.is_active ? { color: "#9ca3af" } : {}}>
            {name}
          </Text>
          {!record.is_active && <Tag color="default">Inactivo</Tag>}
        </Space>
      ),
    },
    {
      title: "Categoría",
      dataIndex: "category",
      key: "category",
      render: (cat: string) => (
        <Tag color={CATEGORY_COLORS[cat]}>{CATEGORY_OPTIONS.find((c) => c.value === cat)?.label ?? cat}</Tag>
      ),
    },
    {
      title: "Variantes",
      key: "variants",
      render: (_: unknown, record: Product) => (
        <Space>
          {record.product_variants?.map((v) => (
            <Tag key={v.id}>{v.name}</Tag>
          ))}
        </Space>
      ),
    },
    {
      title: "Acciones",
      key: "actions",
      width: 120,
      render: (_: unknown, record: Product) => (
        <Space>
          <Tooltip title="Ver detalle">
            <Button icon={<EyeOutlined />} size="small" onClick={() => router.push(`/products/${record.id}`)} />
          </Tooltip>
          <Tooltip title="Editar">
            <Button icon={<EditOutlined />} size="small" onClick={() => openEdit(record)} />
          </Tooltip>
          <Tooltip title={record.is_active ? "Desactivar" : "Reactivar"}>
            <Button
              icon={record.is_active ? <StopOutlined /> : <CheckCircleOutlined />}
              size="small"
              danger={record.is_active}
              onClick={() => handleToggleActive(record)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const steps = [
    { title: "Datos generales" },
    { title: "Variantes y precios" },
    { title: "Recetas" },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <Title level={4} className="!mb-0">Productos</Title>
        <Space>
          <Space>
            <EyeOutlined style={{ color: "#6b7280" }} />
            <Text type="secondary">Ver inactivos</Text>
            <Switch size="small" checked={showInactive} onChange={setShowInactive} />
          </Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            Nuevo producto
          </Button>
        </Space>
      </div>

      <Space className="mb-4">
        <Text>Filtrar:</Text>
        <Button size="small" type={!filterCategory ? "primary" : "default"} onClick={() => setFilterCategory(null)}>Todos</Button>
        {CATEGORY_OPTIONS.map((c) => (
          <Button key={c.value} size="small" type={filterCategory === c.value ? "primary" : "default"} onClick={() => setFilterCategory(c.value)}>
            {c.label}
          </Button>
        ))}
      </Space>

      <Table dataSource={filteredProducts} columns={columns} rowKey="id" loading={loading} pagination={{ pageSize: 20 }} />

      <Modal
        title={editing ? "Editar producto" : "Nuevo producto"}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        width={700}
        destroyOnHidden
      >
        <Steps current={currentStep} items={steps} className="my-6" />

        {/* STEP 1 — General data */}
        {currentStep === 0 && (
          <Form form={formStep1} layout="vertical">
            <Form.Item label="Sucursal" name="branch_id" rules={[{ required: true, message: "Requerido" }]}>
              <Select
                options={branches.map((b) => ({ value: b.id, label: b.name }))}
                placeholder="Seleccionar sucursal"
                onChange={(val) => setSelectedBranchId(val)}
              />
            </Form.Item>
            <Form.Item label="Nombre" name="name" rules={[{ required: true, message: "Requerido" }]}>
              <Input placeholder="Ej: Pizza Pepperoni" />
            </Form.Item>
            <Form.Item label="Categoría" name="category" rules={[{ required: true, message: "Requerido" }]}>
              <Select options={CATEGORY_OPTIONS} placeholder="Seleccionar categoría" />
            </Form.Item>
            <Form.Item label="Descripción para el cliente" name="description">
              <TextArea rows={3} placeholder="Ej: Pepperoni, mozzarella, salsa de tomate" />
            </Form.Item>
            <Form.Item label="Imagen">
              <Space direction="vertical">
                <Upload
                  beforeUpload={handleImageUpload}
                  showUploadList={false}
                  accept="image/*"
                >
                  <Button icon={<UploadOutlined />} loading={uploading}>
                    {uploading ? "Subiendo..." : "Subir imagen"}
                  </Button>
                </Upload>
                <ProductImage url={imageUrl} category={step1Data.category} width={120} height={120} />
              </Space>
            </Form.Item>
            <div className="flex justify-end mt-4">
              <Button type="primary" onClick={() => formStep1.validateFields().then((values) => { setStep1Data(values); setCurrentStep(1); })}>
                Siguiente
              </Button>
            </div>
          </Form>
        )}

        {/* STEP 2 — Variants & prices */}
        {currentStep === 1 && (
          <div>
            {selectedBranchId && (
              <div className="mb-4 px-3 py-2 bg-blue-50 rounded text-sm text-blue-700">
                Sucursal: <strong>{branches.find((b) => b.id === selectedBranchId)?.name}</strong>
              </div>
            )}
            {variants.map((variant, vi) => (
              <Card key={vi} className="mb-4" size="small"
                title={
                  <Select
                    value={variant.name}
                    options={VARIANT_OPTIONS.filter(
                      (o) => o.value === variant.name || !variants.some((v, i) => i !== vi && v.name === o.value)
                    )}
                    onChange={(val) => updateVariant(vi, "name", val)}
                    style={{ width: 140 }}
                  />
                }
                extra={variants.length > 1 && (
                  <Button type="text" danger icon={<MinusCircleOutlined />} onClick={() => removeVariant(vi)} />
                )}
              >
                <Row gutter={16}>
                  <Col span={12}>
                    <Text type="secondary">Precio</Text>
                    <InputNumber
                      prefix="Bs"
                      value={variant.branch_prices.find((bp) => bp.branch_id === selectedBranchId)?.price ?? variant.base_price}
                      onChange={(val) => {
                        const price = val ?? 0;
                        updateVariant(vi, "base_price", price);
                        const existing = variants[vi].branch_prices.find((bp) => bp.branch_id === selectedBranchId);
                        if (existing) {
                          updateBranchPrice(vi, selectedBranchId, price);
                        } else if (selectedBranchId) {
                          updateVariant(vi, "branch_prices", [
                            ...variants[vi].branch_prices,
                            { branch_id: selectedBranchId, price },
                          ]);
                        }
                      }}
                      style={{ width: "100%", marginTop: 4 }}
                      min={0}
                    />
                  </Col>
                </Row>
              </Card>
            ))}

            {variants.length < 3 && (
              <Button type="dashed" block icon={<PlusOutlined />} onClick={addVariant} className="mb-4">
                Agregar variante
              </Button>
            )}

            <div className="flex justify-between mt-4">
              <Button onClick={() => setCurrentStep(0)}>Anterior</Button>
              <Button type="primary" onClick={() => setCurrentStep(2)} disabled={variants.length === 0}>
                Siguiente
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3 — Recipes */}
        {currentStep === 2 && (
          <div>
            {variants.map((variant, vi) => (
              <Card key={vi} className="mb-4" size="small" title={`Receta — ${variant.name}`}>
                {variant.recipes.map((recipe, ri) => (
                  <Row key={ri} gutter={8} className="mb-2" align="middle">
                    <Col span={12}>
                      <Select
                        value={recipe.ingredient_id || undefined}
                        placeholder="Insumo"
                        options={ingredients.map((i) => ({ value: i.id, label: `${i.name} (${i.unit})` }))}
                        onChange={(val) => updateRecipeItem(vi, ri, "ingredient_id", val)}
                        style={{ width: "100%" }}
                        showSearch
                        filterOption={(input, option) =>
                          (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                        }
                      />
                    </Col>
                    <Col span={8}>
                      <InputNumber
                        value={recipe.quantity}
                        placeholder="Cantidad"
                        onChange={(val) => updateRecipeItem(vi, ri, "quantity", val ?? 0)}
                        style={{ width: "100%" }}
                        min={0}
                      />
                    </Col>
                    <Col span={4}>
                      <Button type="text" danger icon={<MinusCircleOutlined />} onClick={() => removeRecipeItem(vi, ri)} />
                    </Col>
                  </Row>
                ))}
                <Button type="dashed" size="small" icon={<PlusOutlined />} onClick={() => addRecipeItem(vi)}>
                  Agregar insumo
                </Button>
              </Card>
            ))}

            <div className="flex justify-between mt-4">
              <Button onClick={() => setCurrentStep(1)}>Anterior</Button>
              <Button type="primary" onClick={handleSave}>
                {editing ? "Guardar cambios" : "Crear producto"}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
