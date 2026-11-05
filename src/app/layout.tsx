import '@/styles/globals.scss';
import type { Metadata, Viewport } from 'next';
import { getLocale, getTranslations } from 'next-intl/server';
import type { ReactNode } from 'react';
import { SiteFooter, SiteHeader } from '@/components';
import { siteConfig } from '@/config/site';
import { JsonLd } from '@/lib/seo';
import { AppProviders } from '@/providers';
import styles from './layout.module.scss';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('metadata');
  return {
    metadataBase: new URL(siteConfig.url),
    title: { default: t('title'), template: `%s | ${siteConfig.name}` },
    description: t('description'),
    applicationName: siteConfig.name,
    formatDetection: { email: false, address: false, telephone: false },
  };
}

export const viewport: Viewport = {
  themeColor: siteConfig.themeColor,
  colorScheme: 'light dark',
};

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}): Promise<ReactNode> {
  const locale = await getLocale();
  const t = await getTranslations('common');

  return (
    // suppressHydrationWarning: next-themes sets data-theme on <html> before hydration.
    <html lang={locale} suppressHydrationWarning>
      <body className={styles.body}>
        <JsonLd
          data={{
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: siteConfig.name,
            url: siteConfig.url,
          }}
        />
        <AppProviders>
          <a href="#main" className={styles.skipLink}>
            {t('skipToContent')}
          </a>
          <SiteHeader />
          <main id="main" className={styles.main}>
            {children}
          </main>
          <SiteFooter />
        </AppProviders>
      </body>
    </html>
  );
}
