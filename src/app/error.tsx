'use client';

import { useTranslations } from 'next-intl';
import { type ReactNode, useEffect } from 'react';
import { Container } from '@/components/Container';
import { Button } from '@/ui';
import styles from './status-page.module.scss';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps): ReactNode {
  const t = useTranslations();

  useEffect(() => {
    // Hook point for error reporting (Sentry etc.). Never render error.message to users.
    console.error(error);
  }, [error]);

  return (
    <Container className={styles.root}>
      <h1 className={styles.title}>{t('error.title')}</h1>
      <p className={styles.description}>{t('error.description')}</p>
      <Button onClick={reset}>{t('common.tryAgain')}</Button>
    </Container>
  );
}
