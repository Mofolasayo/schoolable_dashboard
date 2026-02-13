import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  // Optimize images
  images: {
    formats: ['image/avif', 'image/webp'],
  },

  // Type checking during build
  typescript: {
    ignoreBuildErrors: true,
  },

  // ESLint during build
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
