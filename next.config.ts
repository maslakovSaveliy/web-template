import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const isDev = process.env.NODE_ENV === 'development';
// WebKit applies upgrade-insecure-requests even on http://localhost and then fails to load
// CSS/JS, so only send it when the site is actually served over HTTPS.
const isHttpsSite = process.env.NEXT_PUBLIC_SITE_URL?.startsWith('https://') ?? false;

// apiFetch may call an absolute API origin (NEXT_PUBLIC_API_URL); allow exactly that origin.
const apiOrigin = ((): string => {
  const value = process.env.NEXT_PUBLIC_API_URL;
  if (!value?.startsWith('http')) return '';
  try {
    return ` ${new URL(value).origin}`;
  } catch {
    return '';
  }
})();

/**
 * Baseline CSP that works with static rendering. Next inlines bootstrap scripts,
 * so script-src needs 'unsafe-inline' unless you switch to the nonce-based CSP
 * in `src/proxy.ts` (see docs/recipes/strict-csp.md), which forces dynamic rendering.
 */
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  `connect-src 'self'${apiOrigin}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isHttpsSite ? ['upgrade-insecure-requests'] : []),
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: contentSecurityPolicy },
  // Add `; includeSubDomains; preload` only when every subdomain is HTTPS-only (hard to undo).
  { key: 'Strict-Transport-Security', value: 'max-age=63072000' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()',
  },
];

const nextConfig: NextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  reactStrictMode: true,
  typedRoutes: true,
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [],
  },
  sassOptions: {
    loadPaths: ['src'],
    additionalData: '@use "styles/abstracts" as *;',
  },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

export default withNextIntl(nextConfig);
