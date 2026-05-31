"use client";

import { Refine, Authenticated } from "@refinedev/core";
import { RefineKbar, RefineKbarProvider } from "@refinedev/kbar";
import {
  ThemedLayout,
  ThemedSider,
  useNotificationProvider,
} from "@refinedev/antd";
import { dataProvider, liveProvider } from "@refinedev/supabase";
import routerProvider from "@refinedev/nextjs-router";
import "@refinedev/antd/dist/reset.css";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { ConfigProvider } from "antd";
import { supabase } from "@/lib/supabase";
import { authProvider } from "@/lib/authProvider";
import Image from "next/image";
import {
  DashboardOutlined,
  BankOutlined,
  ShopOutlined,
  InboxOutlined,
  DatabaseOutlined,
  GiftOutlined,
  TeamOutlined,
  BarChartOutlined,
  HomeOutlined,
  TagsOutlined,
  SettingOutlined,
  AppstoreOutlined,
} from "@ant-design/icons";
import { useBusinessConfigPublic } from "@/features/business-config/hooks/useBusinessConfigPublic";

const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? "1.0.0";

function AppFooter({ name }: { name: string }) {
  return (
    <div style={{ textAlign: "center", padding: "8px 16px", color: "#9ca3af", fontSize: 12, borderTop: "1px solid #f0f0f0" }}>
      {name || "Sistema"} — v{APP_VERSION}
    </div>
  );
}

function SiderTitle({ collapsed, logoUrl, name, color }: { collapsed: boolean; logoUrl: string; name: string; color: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      {logoUrl ? (
        <Image
          src={logoUrl}
          alt={name}
          width={36}
          height={36}
          style={{ objectFit: "contain", borderRadius: "50%", flexShrink: 0, background: "white", padding: 2 }}
        />
      ) : (
        <div style={{ width: 36, height: 36, borderRadius: "50%", background: color, flexShrink: 0 }} />
      )}
      {!collapsed && (
        <span style={{ fontWeight: 700, fontSize: 14, color, lineHeight: 1.2, whiteSpace: "nowrap" }}>
          {name || "Mi Negocio"}
        </span>
      )}
    </div>
  );
}

function buildResources(businessType: string) {
  const isPizzeria = businessType === "pizzeria";
  const isStore = businessType === "store";
  const showKitchen = isPizzeria;
  const showWarehouse = isPizzeria || isStore;
  const ingredientsLabel = isStore ? "Materiales" : "Insumos";

  return [
    { name: "dashboard", list: "/dashboard", meta: { label: "Dashboard", icon: <DashboardOutlined /> } },
    { name: "branches", list: "/branches", create: "/branches/create", edit: "/branches/edit/:id", meta: { label: "Sucursales", icon: <BankOutlined /> } },
    { name: "products", list: "/products", create: "/products/create", edit: "/products/edit/:id", meta: { label: "Productos", icon: <ShopOutlined /> } },
    { name: "product-categories", list: "/product-categories", meta: { label: "Categorías", icon: <AppstoreOutlined /> } },
    { name: "variant-types", list: "/variant-types", meta: { label: "Tipos de variante", icon: <TagsOutlined /> } },
    { name: "ingredients", list: "/ingredients", create: "/ingredients/create", edit: "/ingredients/edit/:id", meta: { label: ingredientsLabel, icon: <InboxOutlined /> } },
    { name: "stock", list: "/stock", meta: { label: "Stock", icon: <DatabaseOutlined /> } },
    ...(showWarehouse ? [{ name: "warehouse", list: "/warehouse", meta: { label: "Bodega", icon: <HomeOutlined /> } }] : []),
    ...(showKitchen ? [{ name: "kitchen", list: "/kitchen", meta: { label: "Cocina", icon: <DatabaseOutlined /> } }] : []),
    { name: "promotions", list: "/promotions", create: "/promotions/create", edit: "/promotions/edit/:id", meta: { label: "Promociones", icon: <GiftOutlined /> } },
    { name: "users", list: "/users", create: "/users/create", edit: "/users/edit/:id", meta: { label: "Usuarios", icon: <TeamOutlined /> } },
    { name: "reports", list: "/reports", meta: { label: "Reportes", icon: <BarChartOutlined /> } },
    { name: "settings", list: "/settings", meta: { label: "Configuración", icon: <SettingOutlined /> } },
  ];
}

function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  const { config } = useBusinessConfigPublic();
  const resources = buildResources(config.business_type);

  return (
    <ConfigProvider theme={{ token: { colorPrimary: config.business_primary_color } }}>
      <Refine
        dataProvider={dataProvider(supabase)}
        liveProvider={liveProvider(supabase)}
        routerProvider={routerProvider}
        authProvider={authProvider}
        notificationProvider={useNotificationProvider}
        resources={resources}
        options={{ syncWithLocation: true, warnWhenUnsavedChanges: true }}
      >
        <Authenticated key="admin-auth" redirectOnFail="/login">
          <ThemedLayout
            Sider={() => (
              <ThemedSider
                fixed
                Title={({ collapsed }) => (
                  <SiderTitle
                    collapsed={collapsed}
                    logoUrl={config.business_logo_url}
                    name={config.business_name}
                    color={config.business_primary_color}
                  />
                )}
              />
            )}
            Footer={() => <AppFooter name={config.business_name} />}
          >
            {children}
          </ThemedLayout>
        </Authenticated>
        <RefineKbar />
      </Refine>
    </ConfigProvider>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AntdRegistry>
      <RefineKbarProvider>
        <AdminLayoutInner>{children}</AdminLayoutInner>
      </RefineKbarProvider>
    </AntdRegistry>
  );
}
