import { NextIntlClientProvider } from 'next-intl';
import type { ReactNode } from 'react';
import { QueryProvider } from './QueryProvider';
import { ThemeProvider } from './ThemeProvider';

/** Server component: NextIntlClientProvider inherits locale and messages from i18n/request.ts. */
export function AppProviders({ children }: { children: ReactNode }): ReactNode {
  return (
    <NextIntlClientProvider>
      <ThemeProvider>
        <QueryProvider>{children}</QueryProvider>
      </ThemeProvider>
    </NextIntlClientProvider>
  );
}
