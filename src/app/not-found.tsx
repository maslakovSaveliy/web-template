import type { Metadata } from 'next';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import type { ReactNode } from 'react';
import { Container } from '@/components';
import styles from './status-page.module.scss';

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function NotFound(): Promise<ReactNode> {
  const t = await getTranslations();
  return (
    <Container className={styles.root}>
      <h1 className={styles.title}>{t('notFound.title')}</h1>
      <p className={styles.description}>{t('notFound.description')}</p>
      <Link href="/">{t('common.backHome')}</Link>
    </Container>
  );
}
