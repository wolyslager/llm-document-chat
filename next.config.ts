import type { NextConfig } from "next";

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
  env: {
    BACKEND_URL: process.env.BACKEND_URL || 'http://localhost:3000',
    NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_URL || 'http://localhost:3000',
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Skip build-time optimization that might execute API routes
  serverExternalPackages: ['@upstash/redis'],
  // Only add proxy rewrites when building the **frontend** on Vercel.
  // Railway (backend) builds don't have the VERCEL env var, so they skip this block and serve API routes directly.
  async rewrites() {
    if (process.env.VERCEL && process.env.BACKEND_URL) {
      return [
        {
          source: '/api/:path*',
          destination: `${process.env.BACKEND_URL}/api/:path*`,
        },
      ];
    }
    return [];
  },
};

export default nextConfig;
