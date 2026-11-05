import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type RenderOptions, type RenderResult, render } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { type ReactElement, type ReactNode, useState } from 'react';
import messages from '../../messages/en.json';

const createTestQueryClient = (): QueryClient =>
  new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });

/** Same providers the app uses: i18n + a fresh, retry-free QueryClient per render. */
function TestProviders({ children }: { children: ReactNode }): ReactNode {
  const [client] = useState(createTestQueryClient);
  return (
    <NextIntlClientProvider locale="en" messages={messages} timeZone="UTC">
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    </NextIntlClientProvider>
  );
}

export const renderWithProviders = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
): RenderResult => render(ui, { wrapper: TestProviders, ...options });
