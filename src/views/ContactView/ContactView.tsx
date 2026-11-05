import { getTranslations } from 'next-intl/server';
import type { ReactNode } from 'react';
import { Container } from '@/components';
import { ContactForm } from '@/features/contact';
import styles from './ContactView.module.scss';

export async function ContactView(): Promise<ReactNode> {
  const t = await getTranslations('contact');
  return (
    <Container className={styles.root}>
      <h1 className={styles.title}>{t('title')}</h1>
      <p className={styles.lead}>{t('lead')}</p>
      <ContactForm />
    </Container>
  );
}
