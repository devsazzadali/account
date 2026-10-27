import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Keep the Neon/Prisma stack out of the server bundle: when Next bundles
  // `ws`, its native mask helper breaks ("b.mask is not a function") and
  // every Prisma query inside the Next server fails, while the same code
  // works standalone. Loading these from node_modules at runtime fixes
  // server-side Prisma for SSR pages AND future API routes (SEO port,
  // 2026-10-26).
  serverExternalPackages: [
    'ws',
    '@neondatabase/serverless',
    '@prisma/adapter-neon',
    '@prisma/client',
  ],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'picsum.photos' },
      { protocol: 'https', hostname: 'api.dicebear.com' },
      { protocol: 'https', hostname: 'transparenttextures.com' },
    ],
  },
  // Browsers probe /favicon.ico by default. On Vercel the app-router route
  // at src/app/favicon.ico/route.ts is shadowed by the platform's static
  // favicon handling (bare 404), so redirect at the config/platform level
  // instead — /icon (app/icon.tsx) is the site's real icon and serves 200.
  async redirects() {
    return [
      { source: '/favicon.ico', destination: '/icon', permanent: false },
    ];
  },
};

export default nextConfig;
