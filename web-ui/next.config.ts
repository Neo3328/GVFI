/**
 * GVFI — Next.js config (standalone + API rewrite).
 * Developed by Mr. Gong
 * Copyright © 2026 Mr. Gong. All Rights Reserved.
 */

import type { NextConfig } from "next";

const GVFI_API = process.env.GVFI_API_ORIGIN ?? "http://127.0.0.1:8765";

const nextConfig: NextConfig = {
  output: "standalone",
  /* Do not ship client/server source maps inside the Electron installer */
  productionBrowserSourceMaps: false,
  experimental: {
    /* Default rewrite proxy is 10MB — video uploads need far more */
    proxyClientMaxBodySize: "512mb",
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${GVFI_API}/:path*`,
      },
    ];
  },
};

export default nextConfig;
