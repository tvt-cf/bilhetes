import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  // a tela "Envios" virou "Mensagens"
  async redirects() {
    return [{ source: "/admin/envios", destination: "/admin/mensagens", permanent: true }];
  },
  // PGlite carrega o próprio WASM do node_modules; não pode ser empacotado
  serverExternalPackages: ["@electric-sql/pglite"],
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [390, 640, 828, 1080, 1440, 1920],
  },
  partialPrefetching: true,
  turbopack: {
    root: __dirname,
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
