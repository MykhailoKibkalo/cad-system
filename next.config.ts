import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  compiler: {
    emotion: true,
  },
  reactStrictMode: true,
  webpack: config => {
    config.resolve.alias.canvas = false;
    return config;
  },
};

export default nextConfig;
