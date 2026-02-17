import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@myl/shared', '@myl/db'],
  redirects: async () => [
    { source: '/builder', destination: '/decks', permanent: false },
    { source: '/builder/new', destination: '/decks/new', permanent: false },
  ],
  headers: async () => [
    {
      source: '/api/:path*',
      headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-Frame-Options', value: 'DENY' },
      ],
    },
  ],
};

export default nextConfig;
