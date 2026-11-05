import { getTranslations } from 'next-intl/server';
import type { ReactNode } from 'react';
import { siteConfig } from '@/config/site';
import { Container } from '../Container';
import styles from './SiteFooter.module.scss';

export async function SiteFooter(): Promise<ReactNode> {
  const t = await getTranslations('footer');
  return (
    <footer className={styles.footer}>
      <Container>
        <p>{t('rights', { year: new Date().getFullYear(), name: siteConfig.name })}</p>
      </Container>
    </footer>
  );
}
