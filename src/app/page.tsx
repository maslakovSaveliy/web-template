import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { createPageMetadata } from '@/lib/seo';
import { HomeView } from '@/views/HomeView';

export const metadata: Metadata = createPageMetadata({ path: '/' });

export default function HomePage(): ReactNode {
  return <HomeView />;
}
