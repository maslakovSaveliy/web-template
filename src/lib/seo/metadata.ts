import type { Metadata } from 'next';
import { siteConfig } from '@/config/site';

export interface PageMetadataInput {
  title?: string;
  description?: string;
  /** Route path, e.g. `/about`. Used for canonical and og:url (resolved by metadataBase). */
  path: string;
  /** Absolute or root-relative image URL. Defaults to the route's opengraph-image. */
  image?: string;
  /** Private or utility pages: keep out of search indexes. */
  noIndex?: boolean;
}

export const createPageMetadata = ({
  title,
  description = siteConfig.description,
  path,
  image,
  noIndex = false,
}: PageMetadataInput): Metadata => ({
  // Omit when undefined: an explicit `title: undefined` would wipe the layout's default title.
  ...(title ? { title } : {}),
  description,
  alternates: { canonical: path },
  openGraph: {
    title: title ?? siteConfig.name,
    description,
    url: path,
    siteName: siteConfig.name,
    type: 'website',
    ...(image ? { images: [{ url: image }] } : {}),
  },
  twitter: {
    card: 'summary_large_image',
    title: title ?? siteConfig.name,
    description,
  },
  robots: noIndex ? { index: false, follow: false } : { index: true, follow: true },
});
