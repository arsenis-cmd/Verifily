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

  // CORS headers for API routes
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
    ];
  },
};

export default nextConfig;
