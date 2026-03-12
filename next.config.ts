import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    const securityHeaders = [
      { key: "X-Frame-Options", value: "DENY" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "X-DNS-Prefetch-Control", value: "on" },
    ];

    // Only add HSTS in production (when ALLOWED_ORIGIN is set)
    if (process.env.ALLOWED_ORIGIN) {
      securityHeaders.push({ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" });
    }

    return [
      {
        // Security headers on all routes
        source: "/:path*",
        headers: securityHeaders,
      },
      {
        // CORS headers on API routes — never default to wildcard
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: process.env.ALLOWED_ORIGIN || "http://localhost:3000" },
          { key: "Access-Control-Allow-Methods", value: "GET,DELETE,PATCH,POST,PUT,OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, x-extension-key, x-extension-user-id" },
        ]
      }
    ];
  },
  // Note: pdf-parse removed - not in dependencies
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
};

export default nextConfig;
