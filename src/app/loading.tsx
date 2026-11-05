import { getTranslations } from 'next-intl/server';
import type { ReactNode } from 'react';
import { Container } from '@/components';
import { Spinner } from '@/ui';

export default async function Loading(): Promise<ReactNode> {
  const t = await getTranslations('common');
  return (
    <Container>
      <Spinner label={t('loading')} />
    </Container>
  );
}
