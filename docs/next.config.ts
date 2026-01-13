import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  // No basePath needed for custom domain (verifily.io)
  // basePath: '',
};

export default nextConfig;
