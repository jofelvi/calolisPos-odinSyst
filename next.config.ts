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
};

export default nextConfig;
