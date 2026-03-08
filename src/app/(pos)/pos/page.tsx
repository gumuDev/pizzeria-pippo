"use client";

import { useState } from "react";
import { message } from "antd";
import { usePosIdentity } from "@/features/pos/hooks/usePosIdentity";
import { usePosProducts } from "@/features/pos/hooks/usePosProducts";
import { usePosCart } from "@/features/pos/hooks/usePosCart";
import { usePosBroadcast } from "@/features/pos/hooks/usePosBroadcast";
import { useDayOrders } from "@/features/pos/hooks/useDayOrders";
import { PosHeader } from "@/features/pos/components/PosHeader";
import { DayOrdersPanel } from "@/features/pos/components/DayOrdersPanel";
import { ProductCatalog } from "@/features/pos/components/ProductCatalog";
import { PosCart } from "@/features/pos/components/PosCart";
import { VariantSelectorModal } from "@/features/pos/components/VariantSelectorModal";
import { PaymentModal } from "@/features/pos/components/PaymentModal";
import { ConfirmSaleModal } from "@/features/pos/components/ConfirmSaleModal";
import { TicketModal } from "@/features/pos/components/TicketModal";
import { PosService } from "@/features/pos/services/pos.service";
import type { Product } from "@/features/pos/types/pos.types";
import type { TicketData } from "@/features/pos/types/pos.types";

export default function PosPage() {
  const { identity, handleLogout } = usePosIdentity();
  const { broadcast } = usePosBroadcast();
  const { products, promotions, loading, getVariantPrice, getPromoLabel } = usePosProducts(identity?.branch_id);
  const cart = usePosCart(promotions, identity?.branch_id, broadcast);
  const [showOrders, setShowOrders] = useState(false);
  const { dayOrders, markingReady, fetchDayOrders, handleMarkReady } = useDayOrders(identity?.branch_id, showOrders);

  const [variantModal, setVariantModal] = useState<Product | null>(null);
  const [paymentModal, setPaymentModal] = useState(false);
  const [confirmModal, setConfirmModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"efectivo" | "qr" | null>(null);
  const [ticket, setTicket] = useState<TicketData | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  if (!identity) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-100">
        <div className="text-gray-500">Cargando...</div>
      </div>
    );
  }

  const handleProductClick = (product: Product) => {
    const variants = product.product_variants ?? [];
    if (variants.length === 1) {
      cart.addToCart(product, variants[0], getVariantPrice(variants[0], identity.branch_id));
    } else {
      setVariantModal(product);
    }
  };

  const handleVariantSelect = (product: Product, variant: Product["product_variants"][0]) => {
    cart.addToCart(product, variant, getVariantPrice(variant, identity.branch_id));
    setVariantModal(null);
  };

  const handlePaymentSelect = (method: "efectivo" | "qr" | null) => {
    setPaymentMethod(method);
    setPaymentModal(false);
    setConfirmModal(true);
  };

  const handleConfirmSale = async () => {
    if (!identity.branch_id) {
      message.error("Tu usuario no tiene sucursal asignada. Contactá al administrador.");
      return;
    }
    setConfirmLoading(true);
    const token = await PosService.getToken();
    const result = await PosService.confirmSale(identity.branch_id, cart.discountedCart, cart.total, paymentMethod, token);
    setConfirmLoading(false);

    if (result.ok) {
      broadcast("ORDER_COMPLETE");
      cart.suppressNextClear();
      setConfirmModal(false);
      setPaymentMethod(null);
      setTicket({ orderId: result.order_id!, dailyNumber: result.daily_number!, items: cart.discountedCart, total: cart.total, paymentMethod });
      cart.clearCart();
      if (identity.branch_id) fetchDayOrders(identity.branch_id);
    } else {
      message.error(`Error al confirmar venta: ${result.error}`);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-100 overflow-hidden">
      <PosHeader
        identity={identity}
        showOrders={showOrders}
        pendingCount={dayOrders.filter((o) => o.kitchen_status === "pending").length}
        onToggleOrders={() => setShowOrders((v) => !v)}
        onLogout={handleLogout}
      />

      {showOrders && (
        <DayOrdersPanel
          dayOrders={dayOrders}
          markingReady={markingReady}
          onMarkReady={handleMarkReady}
        />
      )}

      <div className="flex flex-1 overflow-hidden">
        <ProductCatalog
          products={products}
          loading={loading}
          branchId={identity.branch_id}
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

      <VariantSelectorModal
        product={variantModal}
        branchId={identity.branch_id}
        getVariantPrice={getVariantPrice}
        getPromoLabel={getPromoLabel}
        onSelect={handleVariantSelect}
        onClose={() => setVariantModal(null)}
      />
      <PaymentModal
        open={paymentModal}
        onClose={() => { setPaymentModal(false); setPaymentMethod(null); }}
        onSelect={handlePaymentSelect}
      />
      <ConfirmSaleModal
        open={confirmModal}
        discountedCart={cart.discountedCart}
        total={cart.total}
        totalDiscount={cart.totalDiscount}
        paymentMethod={paymentMethod}
        loading={confirmLoading}
        onConfirm={handleConfirmSale}
        onCancel={() => { setConfirmModal(false); setPaymentMethod(null); }}
      />
      <TicketModal ticket={ticket} onClose={() => setTicket(null)} />
    </div>
  );
}
