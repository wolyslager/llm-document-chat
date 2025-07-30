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
  // Forward client-side requests that start with /api/ to the standalone back-end
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        // Use BACKEND_URL at build time; fallback to localhost for local dev
        destination: `${process.env.BACKEND_URL || 'http://localhost:3000'}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
