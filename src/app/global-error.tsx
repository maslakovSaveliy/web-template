// biome-ignore-all lint/plugin/no-hardcoded-jsx-text: global-error replaces the root layout,
// so providers (and translations) are unavailable here. Keep this text minimal and generic.
'use client';

import type { ReactNode } from 'react';

export default function GlobalError({ reset }: { reset: () => void }): ReactNode {
  return (
    <html lang="en">
      <body>
        <main style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
          <h1>Something went wrong</h1>
          <button type="button" onClick={reset}>
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
