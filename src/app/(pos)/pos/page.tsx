"use client";

import { useState } from "react";
import { message } from "antd";
import { usePosIdentity } from "@/features/pos/hooks/usePosIdentity";
import { usePosProducts } from "@/features/pos/hooks/usePosProducts";
import { usePosCart } from "@/features/pos/hooks/usePosCart";
import { usePosBroadcast } from "@/features/pos/hooks/usePosBroadcast";
import { useDayOrders } from "@/features/pos/hooks/useDayOrders";
import { PosHeader } from "@/features/pos/components/PosHeader";
import type { PosTab } from "@/features/pos/components/PosHeader";
import { DayOrdersPanel } from "@/features/pos/components/DayOrdersPanel";
import { DaySummaryPanel } from "@/features/pos/components/DaySummaryPanel";
import { ProductCatalog } from "@/features/pos/components/ProductCatalog";
import { PosCart } from "@/features/pos/components/PosCart";
import { VariantSelectorModal } from "@/features/pos/components/VariantSelectorModal";
import { PaymentModal } from "@/features/pos/components/PaymentModal";
import { ConfirmSaleModal } from "@/features/pos/components/ConfirmSaleModal";
import { TicketModal } from "@/features/pos/components/TicketModal";
import { BranchSelector } from "@/features/pos/components/BranchSelector";
import { CancelOrderModal } from "@/features/pos/components/CancelOrderModal";
import { PosService } from "@/features/pos/services/pos.service";
import type { Product, TicketData, OrderType } from "@/features/pos/types/pos.types";

export default function PosPage() {
  const { identity, branches, effectiveBranchId, isAdminChoosingBranch, selectBranch, handleLogout } = usePosIdentity();
  const { broadcast } = usePosBroadcast();
  const { products, promotions, loading, getVariantPrice, getPromoLabel } = usePosProducts(effectiveBranchId ?? undefined);
  const cart = usePosCart(promotions, effectiveBranchId ?? undefined, broadcast);
  const [activeTab, setActiveTab] = useState<PosTab>("sale");
  const { dayOrders, markingReady, fetchDayOrders, handleMarkReady, cancelModal, cancelling, openCancelModal, closeCancelModal, handleCancelOrder } = useDayOrders(effectiveBranchId ?? undefined, activeTab !== "sale");

  const [variantModal, setVariantModal] = useState<Product | null>(null);
  const [paymentModal, setPaymentModal] = useState(false);
  const [confirmModal, setConfirmModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"efectivo" | "qr" | null>(null);
  const [ticket, setTicket] = useState<TicketData | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  if (!identity) {
    return (
      <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f5f5f5" }}>
        <div style={{ color: "#9ca3af" }}>Cargando...</div>
      </div>
    );
  }

  if (isAdminChoosingBranch) {
    return (
      <BranchSelector
        branches={branches}
        userName={identity.name}
        onSelect={selectBranch}
        onLogout={handleLogout}
      />
    );
  }

  // En este punto effectiveBranchId siempre es string (cajero tiene branch_id, admin ya eligió)
  const branchId = effectiveBranchId!;

  const handleProductClick = (product: Product) => {
    const variants = product.product_variants ?? [];
    if (variants.length === 1) {
      cart.addToCart(product, variants[0], getVariantPrice(variants[0], branchId));
    } else {
      setVariantModal(product);
    }
  };

  const handleVariantSelect = (product: Product, variant: Product["product_variants"][0], flavors?: import("@/lib/promotions").FlavorItem[]) => {
    cart.addToCart(product, variant, getVariantPrice(variant, branchId), flavors);
    setVariantModal(null);
  };

  const handlePaymentConfirm = (orderType: OrderType, method: "efectivo" | "qr" | null) => {
    setPaymentMethod(method);
    cart.setOrderType(orderType);
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
    setConfirmLoading(true);
    const token = await PosService.getToken();
    const result = await PosService.confirmSale(branchId, cart.discountedCart, cart.total, paymentMethod, cart.orderType, token);
    setConfirmLoading(false);

    if (result.ok) {
      broadcast("ORDER_COMPLETE");
      cart.suppressNextClear();
      setConfirmModal(false);
      setPaymentMethod(null);
      setActiveTab("sale");
      setTicket({ orderId: result.order_id!, dailyNumber: result.daily_number!, items: cart.discountedCart, total: cart.total, paymentMethod, orderType: cart.orderType });
      cart.clearCart();
      fetchDayOrders(branchId);
    } else {
      message.error(`Error al confirmar venta: ${result.error}`);
    }
  };

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "#f5f5f5", overflow: "hidden" }}>
      <PosHeader
        identity={identity}
        activeTab={activeTab}
        pendingCount={dayOrders.filter((o) => o.kitchen_status === "pending" && !o.cancelled_at).length}
        onTabChange={setActiveTab}
        onLogout={handleLogout}
      />

      {activeTab === "sale" && (
        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
          <ProductCatalog
            products={products}
            loading={loading}
            branchId={branchId}
            getVariantPrice={getVariantPrice}
            getPromoLabel={getPromoLabel}
            onProductClick={handleProductClick}
          />
          <PosCart
            discountedCart={cart.discountedCart}
            total={cart.total}
            totalDiscount={cart.totalDiscount}
            onUpdateQty={cart.updateQty}
            onRemove={cart.removeFromCart}
            onConfirm={() => setPaymentModal(true)}
            onClear={cart.clearCart}
          />
        </div>
      )}

      {activeTab === "orders" && (
        <DayOrdersPanel
          dayOrders={dayOrders}
          markingReady={markingReady}
          onMarkReady={handleMarkReady}
          onCancel={openCancelModal}
        />
      )}

      {activeTab === "summary" && (
        <DaySummaryPanel dayOrders={dayOrders} />
      )}

      <VariantSelectorModal
        product={variantModal}
        branchId={branchId}
        allProducts={products}
        getVariantPrice={getVariantPrice}
        getPromoLabel={getPromoLabel}
        onSelect={handleVariantSelect}
        onClose={() => setVariantModal(null)}
      />
      <PaymentModal
        open={paymentModal}
        onClose={() => { setPaymentModal(false); setPaymentMethod(null); }}
        onConfirm={handlePaymentConfirm}
      />
      <ConfirmSaleModal
        open={confirmModal}
        discountedCart={cart.discountedCart}
        total={cart.total}
        totalDiscount={cart.totalDiscount}
        paymentMethod={paymentMethod}
        orderType={cart.orderType}
        loading={confirmLoading}
        onConfirm={handleConfirmSale}
        onCancel={() => { setConfirmModal(false); setPaymentMethod(null); }}
      />
      <TicketModal ticket={ticket} onClose={() => setTicket(null)} />
      <CancelOrderModal
        order={cancelModal}
        loading={cancelling}
        onConfirm={handleCancelOrder}
        onClose={closeCancelModal}
      />
    </div>
  );
}
