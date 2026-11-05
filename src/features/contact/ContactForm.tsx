'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';
import { type FieldError, useForm } from 'react-hook-form';
import { Button, TextField } from '@/ui';
import styles from './ContactForm.module.scss';
import { CONTACT_LIMITS, type ContactErrorKey, type ContactInput, contactSchema } from './schema';
import { useSendContact } from './use-send-contact';

const ERROR_KEYS: readonly ContactErrorKey[] = ['nameRequired', 'emailInvalid', 'messageTooShort'];

const isErrorKey = (value: string | undefined): value is ContactErrorKey =>
  ERROR_KEYS.includes(value as ContactErrorKey);

export function ContactForm(): ReactNode {
  const t = useTranslations('contact');
  const mutation = useSendContact();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactInput>({ resolver: zodResolver(contactSchema) });

  const errorText = (error: FieldError | undefined): string | undefined => {
    if (!error) return undefined;
    return isErrorKey(error.message)
      ? t(`errors.${error.message}`, { min: CONTACT_LIMITS.messageMin })
      : error.message;
  };

  const onSubmit = handleSubmit((values) => {
    mutation.mutate(values, { onSuccess: () => reset() });
  });

  return (
    <form className={styles.form} onSubmit={onSubmit} noValidate>
      <TextField
        label={t('name')}
        autoComplete="name"
        error={errorText(errors.name)}
        {...register('name')}
      />
      <TextField
        label={t('email')}
        type="email"
        autoComplete="email"
        error={errorText(errors.email)}
        {...register('email')}
      />
      <TextField
        label={t('message')}
        multiline
        error={errorText(errors.message)}
        {...register('message')}
      />
      <div className={styles.actions}>
        <Button type="submit" isLoading={mutation.isPending}>
          {t('submit')}
        </Button>
      </div>
      <div aria-live="polite">
        {mutation.isSuccess ? <p className={styles.success}>{t('success')}</p> : null}
        {mutation.isError ? (
          <p role="alert" className={styles.error}>
            {t('error')}
          </p>
        ) : null}
      </div>
    </form>
  );
}
