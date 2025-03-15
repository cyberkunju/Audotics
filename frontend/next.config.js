/** @type {import('next').NextConfig} */

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';
console.log('Next.js API URL for rewrites:', apiUrl);

const nextConfig = {
  // Temporarily disable strict mode to help with hydration issues
  reactStrictMode: false, 
  images: {
    domains: ['images.unsplash.com', 'via.placeholder.com', 'i.scdn.co'],
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // Remove experimental features that might be causing issues
  // experimental: {
  //   ppr: true,
  //   optimizePackageImports: ['framer-motion', '@heroicons/react'],
  // },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${apiUrl}/:path*`,
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Credentials',
            value: 'true',
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: apiUrl,
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET,POST,PUT,DELETE,OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization',
          },
        ],
      },
    ];
  },
}

module.exports = nextConfig
