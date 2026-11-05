import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import type { ReactNode } from 'react';
import { createPageMetadata } from '@/lib/seo';
import { ContactView } from '@/views';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('contact');
  return createPageMetadata({ path: '/contact', title: t('title'), description: t('lead') });
}

export default function ContactPage(): ReactNode {
  return <ContactView />;
}
