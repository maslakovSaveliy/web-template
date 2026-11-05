import type { MetadataRoute } from 'next';
import { siteConfig } from '@/config/site';

// Public, indexable routes only. Add new public pages here.
const PUBLIC_ROUTES = ['/', '/contact'] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  return PUBLIC_ROUTES.map((path) => ({
    url: new URL(path, siteConfig.url).toString(),
    lastModified: new Date(),
  }));
}
