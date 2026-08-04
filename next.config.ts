import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  allowedDevOrigins: [
    '127.0.0.1',
    '127.0.0.1:3000',
    'http://127.0.0.1:3000',
    'localhost',
    'localhost:3000',
    'http://localhost:3000',
    '192.168.1.34',
    '192.168.1.34:3000',
    'http://192.168.1.34:3000',
    '192.168.1.35',
    '192.168.1.35:3000',
    'http://192.168.1.35:3000',
    '192.168.1.43',
    '192.168.1.43:3000',
    'http://192.168.1.43:3000',
    'capacitor://localhost'
  ],
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
};

export default nextConfig;
