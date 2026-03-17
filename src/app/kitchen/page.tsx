"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { getUserProfile } from "@/lib/auth";
import { formatTimeBolivia } from "@/lib/timezone";

interface FlavorRow {
  variant_id: string;
  proportion: number;
  product_variants: { products: { name: string } | null } | null;
}

interface OrderItem {
  id: string;
  qty_physical: number;
  qty: number;
  product_variants: {
    name: string;
    products: {
      name: string;
      description: string;
    } | null;
  } | null;
  order_item_flavors: FlavorRow[];
}

interface KitchenOrder {
  id: string;
  daily_number: number;
  created_at: string;
  kitchen_status: string;
  order_type: "dine_in" | "takeaway";
  order_items: OrderItem[];
}

function useTimer(createdAt: string) {
  const [minutes, setMinutes] = useState(0);

  useEffect(() => {
    const calc = () => {
      const created = new Date(createdAt).getTime();
      const now = Date.now();
      setMinutes(Math.floor((now - created) / 60000));
    };
    calc();
    const interval = setInterval(calc, 30000);
    return () => clearInterval(interval);
  }, [createdAt]);

  return minutes;
}

function OrderCard({ order, onReady }: { order: KitchenOrder; onReady: (id: string) => void }) {
  const minutes = useTimer(order.created_at);
  const isLate = minutes >= 10;
  const localTime = formatTimeBolivia(order.created_at);
  const orderLabel = `#${String(order.daily_number).padStart(2, "0")}`;

  return (
    <div
      className={`rounded-2xl p-5 flex flex-col gap-3 border-2 transition-all ${
        isLate
          ? "bg-red-950 border-red-500 shadow-red-900 shadow-lg"
          : "bg-gray-800 border-gray-700"
      }`}
    >
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-black text-white tracking-wider">{orderLabel}</span>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
            order.order_type === "takeaway"
              ? "bg-blue-500 text-white"
              : "bg-gray-600 text-gray-200"
          }`}>
            {order.order_type === "takeaway" ? "🥡 Llevar" : "🍽️ Aquí"}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-sm font-semibold px-2 py-0.5 rounded-full ${
            isLate ? "bg-red-500 text-white" : "bg-gray-600 text-gray-200"
          }`}>
            🕐 {minutes} min
          </span>
          <span className="text-gray-400 text-sm">{localTime}</span>
        </div>
      </div>

      {/* Divider */}
      <div className={`h-px ${isLate ? "bg-red-700" : "bg-gray-700"}`} />

      {/* Items */}
      <div className="flex flex-col gap-3 flex-1">
        {order.order_items.map((item, i) => {
          const qty = item.qty_physical ?? item.qty;
          const productName = item.product_variants?.products?.name ?? "—";
          const variantName = item.product_variants?.name ?? "";
          const description = item.product_variants?.products?.description ?? "";
          const flavors = item.order_item_flavors ?? [];
          const isMixed = flavors.length >= 2;

          const totalParts = flavors.reduce((sum, f) => sum + Math.round(f.proportion * 100), 0) || 100;

          return (
            <div key={i} className="flex flex-col gap-0.5">
              <div className="flex items-baseline gap-2">
                <span className="text-orange-400 font-black text-xl w-8 shrink-0">{qty}x</span>
                <span className="text-white font-semibold text-base leading-tight">
                  {isMixed ? "Pizza mixta" : productName}
                  {variantName && (
                    <span className="text-gray-400 font-normal text-sm ml-1">— {variantName}</span>
                  )}
                </span>
              </div>
              {isMixed && (
                <div className="ml-10 flex flex-col gap-0.5 mt-0.5">
                  {flavors.map((f, fi) => {
                    const parts = Math.round(f.proportion * totalParts);
                    return (
                      <p key={fi} className="text-yellow-400 text-sm leading-snug font-medium m-0">
                        {parts}/{totalParts} {f.product_variants?.products?.name}
                      </p>
                    );
                  })}
                </div>
              )}
              {!isMixed && description && (
                <p className="text-gray-400 text-sm ml-10 leading-snug">{description}</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Ready button */}
      <button
        onClick={() => onReady(order.id)}
        className="mt-2 w-full py-3 rounded-xl bg-green-600 hover:bg-green-500 active:bg-green-700 text-white font-bold text-lg transition-colors"
      >
        ✓ Listo
      </button>
    </div>
  );
}

export default function KitchenPage() {
  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [branchId, setBranchId] = useState<string | null>(null);
  const [branchName, setBranchName] = useState("");
  const [currentTime, setCurrentTime] = useState("");

  // Clock
  useEffect(() => {
    const tick = () => setCurrentTime(formatTimeBolivia(new Date()));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  // Load profile and branch
  useEffect(() => {
    getUserProfile().then((profile) => {
      if (profile?.branch_id) setBranchId(profile.branch_id);
    });
  }, []);

  // Load branch name
  useEffect(() => {
    if (!branchId) return;
    supabase
      .from("branches")
      .select("name")
      .eq("id", branchId)
      .single()
      .then(({ data }) => { if (data) setBranchName(data.name); });
  }, [branchId]);

  const fetchOrders = useCallback(async () => {
    if (!branchId) return;
    const { data } = await supabase
      .from("orders")
      .select(`
        id, daily_number, created_at, kitchen_status, order_type,
        order_items (
          id, qty, qty_physical,
          product_variants (
            name,
            products ( name, description )
          ),
          order_item_flavors (
            variant_id, proportion,
            product_variants ( products ( name ) )
          )
        )
      `)
      .eq("branch_id", branchId)
      .eq("kitchen_status", "pending")
      .order("created_at", { ascending: true });

    if (data) setOrders(data as unknown as KitchenOrder[]);
  }, [branchId]);

  // Initial load
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Supabase Realtime — listen for new orders and status changes
  useEffect(() => {
    if (!branchId) return;

    const channel = supabase
      .channel("kitchen-orders")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "orders",
          filter: `branch_id=eq.${branchId}`,
        },
        () => {
          // Re-fetch to get full order with items
          fetchOrders();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `branch_id=eq.${branchId}`,
        },
        (payload) => {
          if (payload.new.kitchen_status === "ready") {
            setOrders((prev) => prev.filter((o) => o.id !== payload.new.id));
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [branchId, fetchOrders]);

  const handleReady = async (orderId: string) => {
    // Optimistic update
    setOrders((prev) => prev.filter((o) => o.id !== orderId));
    await supabase
      .from("orders")
      .update({ kitchen_status: "ready" })
      .eq("id", orderId);
  };

  const pendingCount = orders.length;
  const lateCount = orders.filter((o) => {
    const minutes = Math.floor((Date.now() - new Date(o.created_at).getTime()) / 60000);
    return minutes >= 10;
  }).length;

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      {/* Header */}
      <div className="bg-gray-950 border-b border-gray-800 px-6 py-3 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Image
            src="/pippo.jpg"
            alt="Pippo"
            width={36}
            height={36}
            style={{ borderRadius: "50%", objectFit: "cover" }}
          />
          <div>
            <p className="text-white font-bold text-lg leading-none">Cocina</p>
            {branchName && (
              <p className="text-gray-400 text-sm leading-none mt-0.5">{branchName}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-6">
          {lateCount > 0 && (
            <span className="bg-red-600 text-white text-sm font-bold px-3 py-1 rounded-full animate-pulse">
              ⚠ {lateCount} demorado{lateCount > 1 ? "s" : ""}
            </span>
          )}
          <span className="text-gray-400 text-sm">
            {pendingCount === 0
              ? "Sin pedidos pendientes"
              : `${pendingCount} pedido${pendingCount > 1 ? "s" : ""} pendiente${pendingCount > 1 ? "s" : ""}`}
          </span>
          <span className="text-gray-300 font-mono text-xl">{currentTime}</span>
        </div>
      </div>

      {/* Orders grid */}
      <div className="flex-1 p-6">
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-gray-600">
            <span className="text-7xl">🍕</span>
            <p className="text-2xl font-semibold">Sin pedidos pendientes</p>
            <p className="text-base">Los nuevos pedidos aparecerán aquí automáticamente</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {orders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onReady={handleReady}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
