import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Commented out for API routes support (needed for Resend integration)
  // output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  // No basePath needed for custom domain (verifily.io)
  // basePath: '',

  // Headers for API routes and CSP
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET, POST, PUT, DELETE, OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type, Authorization" },
        ],
      },
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://*.clerk.accounts.dev https://clerk.verifily.io https://challenges.cloudflare.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https: blob:",
              "font-src 'self' data:",
              "connect-src 'self' https://*.clerk.accounts.dev https://clerk.verifily.io https://api.clerk.com https://clerk-telemetry.com",
              "frame-src 'self' https://*.clerk.accounts.dev https://clerk.verifily.io https://challenges.cloudflare.com",
              "worker-src 'self' blob:",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
