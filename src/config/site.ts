import { clientEnv } from '@/lib/env/client';

// Project identity. `pnpm template:init` rewrites the values marked TEMPLATE.
export const siteConfig = {
  name: 'Web Template', // TEMPLATE:name
  shortName: 'Template', // TEMPLATE:shortName
  description: 'A production-ready Next.js starting point.', // TEMPLATE:description
  url: clientEnv.NEXT_PUBLIC_SITE_URL,
  themeColor: '#ffffff',
} as const;

export type SiteConfig = typeof siteConfig;
