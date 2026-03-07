"use client";

import { useEffect, useState } from "react";
import { getUserProfile } from "@/lib/auth";

export default function KitchenLayout({ children }: { children: React.ReactNode }) {
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    getUserProfile().then((profile) => {
      if (!profile) {
        window.location.href = "/login";
        return;
      }
      if (profile.role !== "cocinero" && profile.role !== "admin") {
        window.location.href = "/login";
        return;
      }
      setAllowed(true);
    });
  }, []);

  if (!allowed) return null;
  return <>{children}</>;
}
