import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import type { ReactNode } from 'react';
import { Container } from '@/components';
import styles from './HomeView.module.scss';

/** Page composition only: no data fetching or business logic in views. */
export async function HomeView(): Promise<ReactNode> {
  const t = await getTranslations('home');

  return (
    <Container className={styles.root}>
      <h1 className={styles.title}>{t('title')}</h1>
      <p className={styles.lead}>{t('lead')}</p>
      <section className={styles.steps} aria-labelledby="next-steps">
        <h2 id="next-steps" className={styles.stepsTitle}>
          {t('nextStepsTitle')}
        </h2>
        <ol className={styles.list}>
          <li>{t('stepInit')}</li>
          <li>{t('stepDocs')}</li>
          <li>{t('stepBrand')}</li>
        </ol>
        <Link href="/contact" className={styles.link}>
          {t('contactLink')}
        </Link>
      </section>
    </Container>
  );
}
