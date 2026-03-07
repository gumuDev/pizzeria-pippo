"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import {
  Button, Tag, Modal, Typography, Space, Badge,
  Empty, Divider, Select, message,
} from "antd";
import {
  PlusOutlined, MinusOutlined, DeleteOutlined,
  CheckOutlined, CloseOutlined, LogoutOutlined,
  UnorderedListOutlined, CheckCircleOutlined,
} from "@ant-design/icons";
import { supabase } from "@/lib/supabase";
import {
  applyPromotions, getActivePromotions,
  getTotalDiscount, getCartTotal,
  type CartItem, type DiscountedItem, type Promotion,
} from "@/lib/promotions";
import { todayInBolivia, formatTimeBolivia } from "@/lib/timezone";

const { Title, Text } = Typography;

const CATEGORY_OPTIONS = [
  { value: "all", label: "Todos" },
  { value: "pizza", label: "Pizza" },
  { value: "bebida", label: "Bebida" },
  { value: "otro", label: "Otro" },
];

const CATEGORY_COLORS: Record<string, string> = {
  pizza: "red",
  bebida: "blue",
  otro: "green",
};

interface Variant {
  id: string;
  name: string;
  base_price: number;
  branch_prices: { branch_id: string; price: number }[];
}

interface Product {
  id: string;
  name: string;
  category: string;
  description: string;
  image_url: string;
  product_variants: Variant[];
}

interface Identity {
  id: string;
  name: string;
  role: string;
  branch_id: string;
}

interface DayOrder {
  id: string;
  daily_number: number;
  created_at: string;
  total: number;
  kitchen_status: string;
  payment_method: "efectivo" | "qr" | null;
  order_items: {
    qty: number;
    product_variants: { name: string; products: { name: string } | null } | null;
  }[];
}

export default function PosPage() {
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discountedCart, setDiscountedCart] = useState<DiscountedItem[]>([]);
  const [filterCategory, setFilterCategory] = useState("all");
  const [variantModal, setVariantModal] = useState<Product | null>(null);
  const [confirmModal, setConfirmModal] = useState(false);
  const [paymentModal, setPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"efectivo" | "qr" | null>(null);
  const [ticketModal, setTicketModal] = useState<{ orderId: string; dailyNumber: number; items: DiscountedItem[]; total: number; paymentMethod: "efectivo" | "qr" | null } | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState("");
  const [showOrders, setShowOrders] = useState(false);
  const [dayOrders, setDayOrders] = useState<DayOrder[]>([]);
  const [markingReady, setMarkingReady] = useState<string | null>(null);
  const broadcastRef = useRef<BroadcastChannel | null>(null);
  const suppressClearRef = useRef(false);

  const getToken = async () => {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? "";
  };

  // Clock
  useEffect(() => {
    const tick = () => setCurrentTime(formatTimeBolivia(new Date()));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  // BroadcastChannel for display
  useEffect(() => {
    broadcastRef.current = new BroadcastChannel("pos-display");
    return () => broadcastRef.current?.close();
  }, []);

  const broadcast = (type: string, payload?: unknown) => {
    broadcastRef.current?.postMessage({ type, payload });
  };

  // Load identity
  useEffect(() => {
    const loadIdentity = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.href = "/login"; return; }
      const { data: profile } = await supabase
        .from("profiles")
        .select("role, branch_id, full_name")
        .eq("id", user.id)
        .single();
      if (!profile) { window.location.href = "/login"; return; }
      setIdentity({ id: user.id, name: profile.full_name ?? user.email ?? "", role: profile.role, branch_id: profile.branch_id });
    };
    loadIdentity();
  }, []);

  // Load products and promotions once identity is ready
  const fetchData = useCallback(async (branchId: string) => {
    setLoading(true);
    const token = await getToken();
    const today = todayInBolivia();

    const [productsRes, promoRes] = await Promise.all([
      fetch("/api/products", { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`/api/promotions?branchId=${branchId}&date=${today}`, { headers: { Authorization: `Bearer ${token}` } }),
    ]);

    const [productsData, promoData] = await Promise.all([
      productsRes.json(),
      promoRes.json(),
    ]);

    if (Array.isArray(productsData)) setProducts(productsData);
    if (Array.isArray(promoData)) setPromotions(promoData);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (identity?.branch_id) fetchData(identity.branch_id);
  }, [identity, fetchData]);

  const fetchDayOrders = useCallback(async (branchId: string) => {
    const today = todayInBolivia();
    const { data } = await supabase
      .from("orders")
      .select(`
        id, daily_number, created_at, total, kitchen_status, payment_method,
        order_items (
          qty,
          product_variants ( name, products ( name ) )
        )
      `)
      .eq("branch_id", branchId)
      .gte("created_at", `${today}T00:00:00-04:00`)
      .lte("created_at", `${today}T23:59:59-04:00`)
      .order("created_at", { ascending: false });
    if (data) setDayOrders(data as DayOrder[]);
  }, []);

  // Load day orders when panel opens
  useEffect(() => {
    if (showOrders && identity?.branch_id) fetchDayOrders(identity.branch_id);
  }, [showOrders, identity, fetchDayOrders]);

  // Realtime: update kitchen_status in day orders list
  useEffect(() => {
    if (!identity?.branch_id) return;
    const channel = supabase
      .channel("pos-kitchen-status")
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "orders",
        filter: `branch_id=eq.${identity.branch_id}`,
      }, (payload) => {
        setDayOrders((prev) =>
          prev.map((o) => o.id === payload.new.id ? { ...o, kitchen_status: payload.new.kitchen_status } : o)
        );
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [identity?.branch_id]);

  const handleMarkReady = async (orderId: string) => {
    setMarkingReady(orderId);
    await supabase.from("orders").update({ kitchen_status: "ready" }).eq("id", orderId);
    setMarkingReady(null);
  };

  // Recalculate discounts whenever cart changes
  useEffect(() => {
    if (cart.length === 0) {
      setDiscountedCart([]);
      if (!suppressClearRef.current) broadcast("CART_CLEAR");
      suppressClearRef.current = false;
      return;
    }
    const result = applyPromotions(cart, promotions);
    setDiscountedCart(result);
    broadcast("CART_UPDATE", { items: result, total: getCartTotal(result) });
  }, [cart, promotions]);

  const getVariantPrice = (variant: Variant, branchId: string) => {
    const override = variant.branch_prices?.find((bp) => bp.branch_id === branchId);
    return override ? override.price : variant.base_price;
  };

  const getPromoLabel = (variantId: string): string | null => {
    for (const promo of promotions) {
      for (const rule of promo.promotion_rules) {
        if (rule.variant_id === variantId) {
          if (promo.type === "BUY_X_GET_Y" && rule.buy_qty && rule.get_qty) {
            return `${rule.buy_qty + rule.get_qty}x${rule.buy_qty}`;
          }
          if (promo.type === "PERCENTAGE" && rule.discount_percent) {
            return `${rule.discount_percent}% OFF`;
          }
          if (promo.type === "COMBO") return "COMBO";
        }
        // PERCENTAGE with no variant_id applies to all
        if (!rule.variant_id && promo.type === "PERCENTAGE" && rule.discount_percent) {
          return `${rule.discount_percent}% OFF`;
        }
      }
    }
    return null;
  };

  const addToCart = (product: Product, variant: Variant) => {
    const price = getVariantPrice(variant, identity?.branch_id ?? "");
    setCart((prev) => {
      const existing = prev.find((i) => i.variant_id === variant.id);
      if (existing) {
        return prev.map((i) => i.variant_id === variant.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, {
        variant_id: variant.id,
        qty: 1,
        unit_price: price,
        product_name: product.name,
        variant_name: variant.name,
        category: product.category,
      }];
    });
    setVariantModal(null);
  };

  const updateQty = (variantId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) => i.variant_id === variantId ? { ...i, qty: i.qty + delta } : i)
        .filter((i) => i.qty > 0)
    );
  };

  const removeFromCart = (variantId: string) => {
    setCart((prev) => prev.filter((i) => i.variant_id !== variantId));
  };

  const clearCart = () => {
    setCart([]);
    broadcast("CART_CLEAR");
  };

  const handleProductClick = (product: Product) => {
    const variants = product.product_variants ?? [];
    if (variants.length === 1) {
      addToCart(product, variants[0]);
    } else {
      setVariantModal(product);
    }
  };

  const handleConfirmSale = async (method: "efectivo" | "qr" | null) => {
    if (!identity || discountedCart.length === 0) return;
    if (!identity.branch_id) {
      message.error("Tu usuario no tiene sucursal asignada. Contactá al administrador.");
      return;
    }
    setLoading(true);
    const token = await getToken();
    const total = getCartTotal(discountedCart);

    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        branch_id: identity.branch_id,
        total,
        payment_method: method,
        items: discountedCart.map((i) => ({
          variant_id: i.variant_id,
          qty: i.qty_physical,
          qty_physical: i.qty_physical,
          unit_price: i.unit_price,
          discount_applied: i.discount_applied,
        })),
      }),
    });

    setLoading(false);
    if (res.ok) {
      const { order_id, daily_number } = await res.json();
      broadcast("ORDER_COMPLETE");
      suppressClearRef.current = true;
      setPaymentModal(false);
      setConfirmModal(false);
      setPaymentMethod(null);
      setTicketModal({ orderId: order_id, dailyNumber: daily_number, items: discountedCart, total, paymentMethod: method });
      setCart([]);
      if (identity?.branch_id) fetchDayOrders(identity.branch_id);
    } else {
      const { error } = await res.json();
      message.error(`Error al confirmar venta: ${error}`);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  const filteredProducts = filterCategory === "all"
    ? products
    : products.filter((p) => p.category === filterCategory);

  const total = getCartTotal(discountedCart);
  const totalDiscount = getTotalDiscount(discountedCart);

  return (
    <div className="h-screen flex flex-col bg-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b px-4 py-2 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Image
              src="/pippo.jpg"
              alt="Pippo Pizza"
              width={36}
              height={36}
              style={{ borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
            />
            <Title level={5} className="!mb-0 text-orange-600">Pizzería Pippo — POS</Title>
          </div>
          <Tag color="blue">{identity?.name}</Tag>
          {identity?.branch_id && (
            <Tag color="green">
              {/* Branch name loaded below */}
              Sucursal
            </Tag>
          )}
        </div>
        <div className="flex items-center gap-4">
          <Text className="text-gray-500 font-mono text-lg">{currentTime}</Text>
          <Button
            icon={<UnorderedListOutlined />}
            size="small"
            type={showOrders ? "primary" : "default"}
            onClick={() => setShowOrders((v) => !v)}
          >
            Pedidos del día
            {dayOrders.filter((o) => o.kitchen_status === "pending").length > 0 && (
              <span className="ml-1 bg-orange-500 text-white text-xs rounded-full px-1.5 py-0.5">
                {dayOrders.filter((o) => o.kitchen_status === "pending").length}
              </span>
            )}
          </Button>
          <Button icon={<LogoutOutlined />} size="small" onClick={handleLogout}>
            Salir
          </Button>
        </div>
      </div>

      {/* Orders panel (collapsible) */}
      {showOrders && (
        <div className="bg-white border-b shadow-inner px-4 py-3 max-h-64 overflow-y-auto">
          <div className="flex items-center justify-between mb-2">
            <Text strong>Pedidos de hoy ({dayOrders.length})</Text>
            <Text type="secondary" className="text-xs">
              {dayOrders.filter((o) => o.kitchen_status === "pending").length} pendientes ·{" "}
              {dayOrders.filter((o) => o.kitchen_status === "ready").length} listos
            </Text>
          </div>
          {dayOrders.length === 0 ? (
            <Text type="secondary" className="text-sm">Sin ventas registradas hoy.</Text>
          ) : (
            <div className="flex flex-col gap-2">
              {dayOrders.map((order) => {
                const orderLabel = `#${String(order.daily_number).padStart(2, "0")}`;
                const timeStr = formatTimeBolivia(order.created_at);
                const summary = order.order_items
                  .map((i) => `${i.qty}x ${i.product_variants?.products?.name ?? ""} ${i.product_variants?.name ?? ""}`)
                  .join(", ");
                const isPending = order.kitchen_status === "pending";

                return (
                  <div
                    key={order.id}
                    className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm border ${
                      isPending ? "bg-orange-50 border-orange-200" : "bg-gray-50 border-gray-200"
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Text strong className="shrink-0 text-gray-500">{orderLabel}</Text>
                      <Text type="secondary" className="shrink-0">{timeStr}</Text>
                      <Text className="truncate flex-1">{summary}</Text>
                      <Text strong className="shrink-0 text-orange-600">Bs {Number(order.total).toFixed(2)}</Text>
                      <span className="shrink-0 text-xs text-gray-400">
                        {order.payment_method === "efectivo" ? "💵" : order.payment_method === "qr" ? "📱" : "—"}
                      </span>
                    </div>
                    <div className="ml-3 shrink-0">
                      {isPending ? (
                        <Button
                          size="small"
                          type="primary"
                          icon={<CheckCircleOutlined />}
                          loading={markingReady === order.id}
                          onClick={() => handleMarkReady(order.id)}
                        >
                          Marcar listo
                        </Button>
                      ) : (
                        <span className="text-green-600 font-semibold text-xs flex items-center gap-1">
                          <CheckCircleOutlined /> Listo
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">

        {/* LEFT: Product catalog */}
        <div className="flex-1 flex flex-col overflow-hidden p-4">
          {/* Category filter */}
          <div className="flex gap-2 mb-4">
            {CATEGORY_OPTIONS.map((c) => (
              <Button
                key={c.value}
                type={filterCategory === c.value ? "primary" : "default"}
                size="small"
                onClick={() => setFilterCategory(c.value)}
              >
                {c.label}
              </Button>
            ))}
          </div>

          {/* Product grid */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <Text type="secondary">Cargando productos...</Text>
              </div>
            ) : (
              <div className="grid grid-cols-3 xl:grid-cols-4 gap-3">
                {filteredProducts.map((product) => {
                  const firstVariant = product.product_variants?.[0];
                  const price = firstVariant
                    ? getVariantPrice(firstVariant, identity?.branch_id ?? "")
                    : 0;
                  const hasMultipleVariants = (product.product_variants?.length ?? 0) > 1;

                  // Check if any variant of this product has an active promo
                  const promoLabels = product.product_variants
                    ?.map((v) => getPromoLabel(v.id))
                    .filter(Boolean);
                  const promoLabel = promoLabels?.[0] ?? null;

                  return (
                    <div
                      key={product.id}
                      className="bg-white rounded-lg shadow-sm cursor-pointer hover:shadow-md hover:border-orange-300 border-2 border-transparent transition-all overflow-hidden"
                      onClick={() => handleProductClick(product)}
                    >
                      {/* Product image */}
                      <div className="relative">
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="w-full h-28 object-cover"
                          />
                        ) : (
                          <div className="w-full h-28 bg-orange-50 flex items-center justify-center text-3xl">
                            {product.category === "pizza" ? "🍕" : product.category === "bebida" ? "🥤" : "🍽️"}
                          </div>
                        )}
                        {promoLabel && (
                          <div className="absolute top-1 right-1">
                            <Tag color="red" className="!m-0 text-xs font-bold">{promoLabel}</Tag>
                          </div>
                        )}
                        <div className="absolute top-1 left-1">
                          <Tag color={CATEGORY_COLORS[product.category]} className="!m-0 text-xs">
                            {product.category}
                          </Tag>
                        </div>
                      </div>

                      <div className="p-2">
                        <Text strong className="text-sm block leading-tight">{product.name}</Text>
                        <div className="flex justify-between items-center mt-1">
                          <Text className="text-orange-600 font-bold">
                            {hasMultipleVariants ? `Desde Bs ${price}` : `Bs ${price}`}
                          </Text>
                          {hasMultipleVariants && (
                            <Text type="secondary" className="text-xs">varios tamaños</Text>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {!loading && filteredProducts.length === 0 && (
              <Empty description="No hay productos en esta categoría" />
            )}
          </div>
        </div>

        {/* RIGHT: Cart */}
        <div className="w-80 xl:w-96 bg-white border-l flex flex-col shadow-lg">
          <div className="px-4 py-3 border-b">
            <Title level={5} className="!mb-0">Pedido actual</Title>
          </div>

          {/* Cart items */}
          <div className="flex-1 overflow-y-auto p-4">
            {discountedCart.length === 0 ? (
              <Empty description="Carrito vacío" className="mt-8" />
            ) : (
              discountedCart.map((item) => (
                <div key={item.variant_id} className="mb-3 p-2 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-start mb-1">
                    <div className="flex-1 min-w-0">
                      <Text strong className="text-sm block truncate">{item.product_name}</Text>
                      <Text type="secondary" className="text-xs">{item.variant_name}</Text>
                      {item.promo_label && (
                        <Tag color="red" className="!text-xs !mt-1">{item.promo_label}</Tag>
                      )}
                    </div>
                    <Button
                      type="text"
                      danger
                      size="small"
                      icon={<DeleteOutlined />}
                      onClick={() => removeFromCart(item.variant_id)}
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <Space size={4}>
                      <Button
                        size="small"
                        icon={<MinusOutlined />}
                        onClick={() => updateQty(item.variant_id, -1)}
                      />
                      <div className="text-center">
                        <Text strong className="w-6 block">{item.qty_physical}</Text>
                        {item.qty_physical !== item.qty && (
                          <Text className="text-xs text-green-600 block leading-none">
                            ({item.qty} cobradas)
                          </Text>
                        )}
                      </div>
                      <Button
                        size="small"
                        icon={<PlusOutlined />}
                        onClick={() => updateQty(item.variant_id, 1)}
                      />
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
              ))
            )}
          </div>

          {/* Cart footer */}
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
                type="primary"
                block
                size="large"
                icon={<CheckOutlined />}
                disabled={cart.length === 0}
                onClick={() => setPaymentModal(true)}
              >
                Confirmar venta
              </Button>
              <Button
                block
                danger
                icon={<CloseOutlined />}
                disabled={cart.length === 0}
                onClick={clearCart}
              >
                Cancelar pedido
              </Button>
            </Space>
          </div>
        </div>
      </div>

      {/* Modal: variant selector */}
      <Modal
        title={variantModal?.name}
        open={!!variantModal}
        onCancel={() => setVariantModal(null)}
        footer={null}
        width={360}
      >
        <div className="flex flex-col gap-3 mt-4">
          {variantModal?.product_variants?.map((variant) => {
            const price = getVariantPrice(variant, identity?.branch_id ?? "");
            const promoLabel = getPromoLabel(variant.id);
            return (
              <Button
                key={variant.id}
                size="large"
                block
                className="flex justify-between items-center h-auto py-3"
                onClick={() => addToCart(variantModal, variant)}
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

      {/* Modal: payment method selector */}
      <Modal
        title="¿Cómo pagó el cliente?"
        open={paymentModal}
        onCancel={() => { setPaymentModal(false); setPaymentMethod(null); }}
        footer={null}
        width={360}
      >
        <div className="flex flex-col gap-3 mt-4">
          <Button
            size="large"
            block
            type={paymentMethod === "efectivo" ? "primary" : "default"}
            className="h-14 text-base"
            onClick={() => { setPaymentMethod("efectivo"); setConfirmModal(true); setPaymentModal(false); }}
          >
            💵 Efectivo
          </Button>
          <Button
            size="large"
            block
            type={paymentMethod === "qr" ? "primary" : "default"}
            className="h-14 text-base"
            onClick={() => { setPaymentMethod("qr"); setConfirmModal(true); setPaymentModal(false); }}
          >
            📱 QR
          </Button>
          <Button
            size="large"
            block
            type="text"
            className="text-gray-400"
            onClick={() => { setPaymentMethod(null); setConfirmModal(true); setPaymentModal(false); }}
          >
            Confirmar sin especificar
          </Button>
        </div>
      </Modal>

      {/* Modal: confirm sale */}
      <Modal
        title="Confirmar venta"
        open={confirmModal}
        onCancel={() => { setConfirmModal(false); setPaymentMethod(null); }}
        onOk={() => handleConfirmSale(paymentMethod)}
        okText="Confirmar y cobrar"
        cancelText="Volver"
        confirmLoading={loading}
        okButtonProps={{ size: "large" }}
      >
        <div className="mt-4">
          {discountedCart.map((item) => (
            <div key={item.variant_id} className="flex justify-between py-1 border-b last:border-0">
              <div>
                <Text>{item.qty_physical}x {item.product_name} ({item.variant_name})</Text>
                {item.promo_label && (
                  <Tag color="red" className="!ml-1 !text-xs">{item.promo_label}</Tag>
                )}
              </div>
              <Text strong>Bs {(item.unit_price * item.qty_physical - item.discount_applied).toFixed(2)}</Text>
            </div>
          ))}
          {totalDiscount > 0 && (
            <div className="flex justify-between py-2 text-green-600">
              <Text>Descuentos aplicados</Text>
              <Text>- Bs {totalDiscount.toFixed(2)}</Text>
            </div>
          )}
          <Divider className="!my-2" />
          <div className="flex justify-between mb-2">
            <Text strong className="text-lg">Total a cobrar</Text>
            <Text strong className="text-xl text-orange-600">Bs {total.toFixed(2)}</Text>
          </div>
          {paymentMethod && (
            <div className="flex justify-between text-gray-500 text-sm">
              <Text type="secondary">Método de pago</Text>
              <Text>{paymentMethod === "efectivo" ? "💵 Efectivo" : "📱 QR"}</Text>
            </div>
          )}
        </div>
      </Modal>

      {/* Modal: ticket post-sale */}
      <Modal
        title="✅ Venta confirmada"
        open={!!ticketModal}
        onCancel={() => setTicketModal(null)}
        footer={
          <Button type="primary" size="large" block onClick={() => setTicketModal(null)}>
            Nueva venta
          </Button>
        }
        width={400}
      >
        {ticketModal && (
          <div className="mt-4">
            <div className="text-center mb-4">
              <Text strong className="text-4xl text-orange-600">
                #{String(ticketModal.dailyNumber).padStart(2, "0")}
              </Text>
            </div>
            {ticketModal.items.map((item) => (
              <div key={item.variant_id} className="flex justify-between py-1 border-b last:border-0">
                <div>
                  <Text>{item.qty_physical}x {item.product_name} ({item.variant_name})</Text>
                  {item.promo_label && (
                    <Tag color="red" className="!ml-1 !text-xs">{item.promo_label}</Tag>
                  )}
                </div>
                <Text>Bs {(item.unit_price * item.qty_physical - item.discount_applied).toFixed(2)}</Text>
              </div>
            ))}
            <Divider className="!my-2" />
            <div className="flex justify-between mb-1">
              <Text strong>Total cobrado</Text>
              <Text strong className="text-orange-600">Bs {ticketModal.total.toFixed(2)}</Text>
            </div>
            <div className="flex justify-between">
              <Text type="secondary">Método de pago</Text>
              <Text>
                {ticketModal.paymentMethod === "efectivo" ? "💵 Efectivo"
                  : ticketModal.paymentMethod === "qr" ? "📱 QR"
                  : "—"}
              </Text>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
