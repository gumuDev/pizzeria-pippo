"use client";

import { useState } from "react";
import { message } from "antd";
import { useIsMobile } from "@/lib/useIsMobile";
import { usePosIdentity } from "@/features/pos/hooks/usePosIdentity";
import { usePosProducts } from "@/features/pos/hooks/usePosProducts";
import { usePosCart } from "@/features/pos/hooks/usePosCart";
import { usePosBroadcast } from "@/features/pos/hooks/usePosBroadcast";
import { useDayOrders } from "@/features/pos/hooks/useDayOrders";
import { PosHeader } from "@/features/pos/components/PosHeader";
import type { PosTab } from "@/features/pos/components/PosHeader";
import { DayOrdersPanel } from "@/features/pos/components/DayOrdersPanel";
import { DaySummaryPanel } from "@/features/pos/components/DaySummaryPanel";
import { PromoTab } from "@/features/pos/components/PromoTab";
import { ProductCatalog } from "@/features/pos/components/ProductCatalog";
import { PosCart } from "@/features/pos/components/PosCart";
import { VariantSelectorModal } from "@/features/pos/components/VariantSelectorModal";
import { PaymentModal } from "@/features/pos/components/PaymentModal";
import { ConfirmSaleModal } from "@/features/pos/components/ConfirmSaleModal";
import { TicketModal } from "@/features/pos/components/TicketModal";
import { BranchSelector } from "@/features/pos/components/BranchSelector";
import { CancelOrderModal } from "@/features/pos/components/CancelOrderModal";
import { PrinterStatusButton } from "@/features/printing/components/PrinterStatusButton";
import { usePrinter } from "@/features/printing/hooks/usePrinter";
import { PosService } from "@/features/pos/services/pos.service";
import { getActivePromotions } from "@/lib/promotions";
import type { Product, TicketData, OrderType, Variant } from "@/features/pos/types/pos.types";
import type { CartItem } from "@/lib/promotions";

export default function PosPage() {
  const { identity, branches, effectiveBranchId, isAdminChoosingBranch, selectBranch, handleLogout } = usePosIdentity();
  const { broadcast } = usePosBroadcast();
  const { products, promotions, loading, getVariantPrice, getPromoLabel, getStockQty, refresh: refreshProducts } = usePosProducts(effectiveBranchId ?? undefined);
  const cart = usePosCart(promotions, effectiveBranchId ?? undefined, broadcast, getStockQty);
  const [activeTab, setActiveTab] = useState<PosTab>("sale");
  const [mobileView, setMobileView] = useState<"catalog" | "cart">("catalog");
  const isMobile = useIsMobile();
  const { dayOrders, markingReady, fetchDayOrders, handleMarkReady, cancelModal, cancelling, openCancelModal, closeCancelModal, handleCancelOrder } = useDayOrders(effectiveBranchId ?? undefined, activeTab !== "sale");

  const [variantModal, setVariantModal] = useState<Product | null>(null);
  const [paymentModal, setPaymentModal] = useState(false);
  const [confirmModal, setConfirmModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"efectivo" | "qr" | null>(null);
  const [ticket, setTicket] = useState<TicketData | null>(null);
  const printer = usePrinter();
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [idempotencyKey, setIdempotencyKey] = useState<string | null>(null);

  if (!identity) {
    return (
      <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f5f5f5" }}>
        <div style={{ color: "#9ca3af" }}>Cargando...</div>
      </div>
    );
  }

  if (isAdminChoosingBranch) {
    return (
      <BranchSelector branches={branches} userName={identity.name} onSelect={selectBranch} onLogout={handleLogout} />
    );
  }

  const branchId = effectiveBranchId!;
  const activePromotions = getActivePromotions(promotions, branchId);

  const handleProductClick = (product: Product) => {
    const variants = product.product_variants ?? [];
    if (variants.length === 1) {
      cart.addToCart(product, variants[0], getVariantPrice(variants[0], branchId));
      if (isMobile) setMobileView("cart");
    } else {
      setVariantModal(product);
    }
  };

  const handleVariantSelect = (product: Product, variant: Variant, flavors?: import("@/lib/promotions").FlavorItem[]) => {
    cart.addToCart(product, variant, getVariantPrice(variant, branchId), flavors);
    setVariantModal(null);
    if (isMobile) setMobileView("cart");
  };

  const handlePromoItems = (items: CartItem[]) => {
    cart.addItemsToCart(items);
    if (isMobile) { setActiveTab("sale"); setMobileView("cart"); }
  };

  const handlePromoSingleVariant = (variantId: string, qty: number) => {
    for (const p of products) {
      const v = p.product_variants.find((pv) => pv.id === variantId);
      if (v) {
        for (let i = 0; i < qty; i++) cart.addToCart(p, v, getVariantPrice(v, branchId));
        if (isMobile) { setActiveTab("sale"); setMobileView("cart"); }
        return;
      }
    }
  };

  const handlePaymentConfirm = (orderType: OrderType, method: "efectivo" | "qr" | null) => {
    setPaymentMethod(method);
    cart.setOrderType(orderType);
    setIdempotencyKey(crypto.randomUUID());
    setPaymentModal(false);
    setConfirmModal(true);
  };

  const handleConfirmSale = async () => {
    if (!effectiveBranchId) {
      message.error("No hay sucursal seleccionada.");
      return;
    }
    if (!cart.orderType) {
      message.error("Seleccioná el tipo de pedido antes de confirmar.");
      return;
    }
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    setConfirmLoading(true);
    try {
      const token = await PosService.getToken();
      const result = await PosService.confirmSale(branchId, cart.discountedCart, cart.total, paymentMethod, cart.orderType, token, controller.signal, idempotencyKey ?? undefined);

      if (result.ok) {
        broadcast("ORDER_COMPLETE");
        cart.suppressNextClear();
        setConfirmModal(false);
        setPaymentMethod(null);
        setIdempotencyKey(null);
        setActiveTab("sale");
        setTicket({ orderId: result.order_id!, dailyNumber: result.daily_number!, items: cart.discountedCart, total: cart.total, paymentMethod, orderType: cart.orderType });
        cart.clearCart();
        fetchDayOrders(branchId);
        refreshProducts();
      } else {
        message.error(`Error al confirmar venta: ${result.error}`, 5);
      }
    } finally {
      clearTimeout(timeout);
      setConfirmLoading(false);
    }
  };

  const cartPanel = (
    <PosCart
      discountedCart={cart.discountedCart}
      total={cart.total}
      totalDiscount={cart.totalDiscount}
      onUpdateQty={cart.updateQty}
      onRemove={cart.removeFromCart}
      onConfirm={() => setPaymentModal(true)}
      onClear={cart.clearCart}
      getStockQty={cart.getStockQty}
    />
  );

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "#f5f5f5", overflow: "hidden" }}>
      <PosHeader
        identity={identity}
        branches={branches}
        activeTab={activeTab}
        pendingCount={dayOrders.filter((o) => o.kitchen_status === "pending" && !o.cancelled_at).length}
        promoCount={activePromotions.length}
        onTabChange={setActiveTab}
        onLogout={handleLogout}
        printerSlot={
          <PrinterStatusButton
            status={printer.status}
            deviceName={printer.deviceName}
            onConnect={printer.connect}
            onDisconnect={printer.disconnect}
          />
        }
      />

      {/* Desktop: sale tab */}
      {activeTab === "sale" && !isMobile && (
        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
          <ProductCatalog products={products} loading={loading} branchId={branchId} getVariantPrice={getVariantPrice} getPromoLabel={getPromoLabel} onProductClick={handleProductClick} />
          {cartPanel}
        </div>
      )}

      {/* Desktop: promos tab */}
      {activeTab === "promos" && !isMobile && (
        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
          <PromoTab
            promotions={activePromotions}
            products={products}
            branchId={branchId}
            getVariantPrice={getVariantPrice}
            onAddItems={handlePromoItems}
            onAddSingleVariant={handlePromoSingleVariant}
          />
          {cartPanel}
        </div>
      )}

      {/* Mobile: sale tab */}
      {activeTab === "sale" && isMobile && (
        <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
          <div style={{ flex: 1, overflow: "hidden", display: mobileView === "catalog" ? "flex" : "none", flexDirection: "column" }}>
            <ProductCatalog products={products} loading={loading} branchId={branchId} getVariantPrice={getVariantPrice} getPromoLabel={getPromoLabel} onProductClick={handleProductClick} />
          </div>
          <div style={{ flex: 1, overflow: "hidden", display: mobileView === "cart" ? "flex" : "none", flexDirection: "column" }}>
            {cartPanel}
          </div>
          <div style={{ display: "flex", borderTop: "1px solid #e5e7eb", background: "#fff", flexShrink: 0 }}>
            <button onClick={() => setMobileView("catalog")} style={{ flex: 1, padding: "12px 0", border: "none", cursor: "pointer", fontSize: 14, fontWeight: 600, background: mobileView === "catalog" ? "#fff7ed" : "#fff", color: mobileView === "catalog" ? "#ea580c" : "#6b7280", borderTop: mobileView === "catalog" ? "2px solid #ea580c" : "2px solid transparent", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              🛍️ Catálogo
            </button>
            <button onClick={() => setMobileView("cart")} style={{ flex: 1, padding: "12px 0", border: "none", cursor: "pointer", fontSize: 14, fontWeight: 600, background: mobileView === "cart" ? "#fff7ed" : "#fff", color: mobileView === "cart" ? "#ea580c" : "#6b7280", borderTop: mobileView === "cart" ? "2px solid #ea580c" : "2px solid transparent", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              🛒 Pedido
              {cart.discountedCart.length > 0 && (
                <span style={{ background: "#ea580c", color: "#fff", borderRadius: 10, fontSize: 11, fontWeight: 700, padding: "1px 7px" }}>
                  {cart.discountedCart.reduce((s, i) => s + i.qty_physical, 0)}
                </span>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Mobile: promos tab */}
      {activeTab === "promos" && isMobile && (
        <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
          <PromoTab
            promotions={activePromotions}
            products={products}
            branchId={branchId}
            getVariantPrice={getVariantPrice}
            onAddItems={handlePromoItems}
            onAddSingleVariant={handlePromoSingleVariant}
          />
        </div>
      )}

      {activeTab === "orders" && (
        <DayOrdersPanel dayOrders={dayOrders} markingReady={markingReady} onMarkReady={handleMarkReady} onCancel={openCancelModal} />
      )}

      {activeTab === "summary" && (
        <DaySummaryPanel dayOrders={dayOrders} />
      )}

      <VariantSelectorModal product={variantModal} branchId={branchId} allProducts={products} getVariantPrice={getVariantPrice} getPromoLabel={getPromoLabel} onSelect={handleVariantSelect} onClose={() => setVariantModal(null)} />
      <PaymentModal open={paymentModal} total={cart.total} onClose={() => { setPaymentModal(false); setPaymentMethod(null); }} onConfirm={handlePaymentConfirm} />
      <ConfirmSaleModal open={confirmModal} discountedCart={cart.discountedCart} total={cart.total} totalDiscount={cart.totalDiscount} paymentMethod={paymentMethod} orderType={cart.orderType} loading={confirmLoading} onConfirm={handleConfirmSale} onCancel={() => { setConfirmModal(false); setPaymentMethod(null); }} />
      <TicketModal
        ticket={ticket}
        onClose={() => setTicket(null)}
        onPrint={() => ticket && printer.print(ticket, branches.find((b) => b.id === branchId)?.name)}
        printing={printer.printing}
        canPrint={printer.status !== "unsupported"}
      />
      <CancelOrderModal order={cancelModal} loading={cancelling} onConfirm={handleCancelOrder} onClose={closeCancelModal} />
    </div>
  );
}
