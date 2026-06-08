import withPWA from "next-pwa";
import createNextIntlPlugin from "next-intl/plugin";
import withBundleAnalyzer from "@next/bundle-analyzer";

const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Wildcard cubre cualquier proyecto Supabase (el ID varía por entorno)
    // No usar hostname fijo — el project ID de .env no es accesible en build time
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

const withPWAConfig = withPWA({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
  runtimeCaching: [
    {
      // Imágenes de Supabase Storage — cache-first, 30 días
      urlPattern: /^https:\/\/pftyqugovuximactyrro\.supabase\.co\/storage\/v1\/object\/public\/.*/i,
      handler: "CacheFirst",
      options: {
        cacheName: "supabase-images",
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 30 * 24 * 60 * 60,
        },
      },
    },
    {
      // JS/CSS del bundle de Next.js — stale-while-revalidate
      urlPattern: /^\/_next\/static\/.*/i,
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: "next-static",
      },
    },
    {
      // Páginas HTML — network-first con fallback offline
      urlPattern: /^\/(pos|display)(\/.*)?$/i,
      handler: "NetworkFirst",
      options: {
        cacheName: "pos-pages",
        networkTimeoutSeconds: 5,
      },
    },
  ],
});

const withAnalyzer = withBundleAnalyzer({ enabled: process.env.ANALYZE === "true" });

export default withAnalyzer(withNextIntl(withPWAConfig(nextConfig)));
