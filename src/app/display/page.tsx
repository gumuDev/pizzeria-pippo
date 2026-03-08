"use client";

import Image from "next/image";
import { useDisplay } from "@/features/display/hooks/useDisplay";
import { DisplayMenu } from "@/features/display/components/DisplayMenu";
import { DisplayCart } from "@/features/display/components/DisplayCart";
import { DisplayThankYou } from "@/features/display/components/DisplayThankYou";

export default function DisplayPage() {
  const { mode, cartItems, cartTotal, products, menuPage } = useDisplay();

  return (
    <div className="h-screen w-screen overflow-hidden bg-gray-950 text-white flex flex-col">
      <div className="flex items-center justify-between px-8 py-4 bg-orange-600">
        <div className="flex items-center gap-3">
          <Image
            src="/pippo.jpg"
            alt="Pippo Pizza"
            width={44}
            height={44}
            style={{ borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
          />
          <span className="text-2xl font-bold tracking-wide">Pizzería Pippo</span>
        </div>
        <span className="text-orange-200 text-sm">
          {mode === "order" ? "Tu pedido" : mode === "thanks" ? "" : "Nuestro menú"}
        </span>
      </div>

      {mode === "thanks" && <DisplayThankYou />}
      {mode === "order" && <DisplayCart cartItems={cartItems} cartTotal={cartTotal} />}
      {mode === "menu" && <DisplayMenu products={products} menuPage={menuPage} />}
    </div>
  );
}
