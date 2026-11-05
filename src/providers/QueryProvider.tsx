'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { type ReactNode, useState } from 'react';
import { isApiError } from '@/lib/api';

const STALE_TIME_MS = 60_000;
const MAX_RETRIES = 2;
const CLIENT_ERROR_MIN = 400;
const SERVER_ERROR_MIN = 500;

// Do not retry 4xx: the request itself is wrong and retrying only repeats the error.
const shouldRetry = (failureCount: number, error: unknown): boolean => {
  if (isApiError(error) && error.status >= CLIENT_ERROR_MIN && error.status < SERVER_ERROR_MIN) {
    return false;
  }
  return failureCount < MAX_RETRIES;
};

export function QueryProvider({ children }: { children: ReactNode }): ReactNode {
  // One client per browser session; created lazily so server renders never share it.
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: STALE_TIME_MS, retry: shouldRetry, refetchOnWindowFocus: false },
          mutations: { retry: false },
        },
      }),
  );

  return (
    <QueryClientProvider client={client}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
