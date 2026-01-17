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
};

export default nextConfig;
