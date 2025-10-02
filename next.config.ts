import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        port: '', // Leave empty if no specific port
        pathname: '/v0/b/odinsysnext.firebasestorage.app/**', // Matches any path under your bucket
      },
    ],
  },

  // TypeScript configuration
  typescript: {
    // Ignore specific TypeScript errors including TS71007
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
