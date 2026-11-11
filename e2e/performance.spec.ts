import { expect, type Page, test } from '@playwright/test';

/**
 * Lab guards for the performance budget in docs/performance.md. They catch regressions in CI;
 * they do not replace field data (p75 from real users).
 */

// Compressed first-load JS of the home page (template: ~161 KB on 2026-11-11). Raise it only with a reason in docs/decisions.md.
const HOME_JS_BUDGET_KB = 200;
const CLS_BUDGET = 0.1;
const KB = 1024;
const SETTLE_MS = 1000;

// First-load JS = every script the page needs to render and hydrate. Router prefetches for links
// in the viewport are blocked: they cost idle bandwidth, not time to interactive.
const collectFirstLoadScriptBytes = async (page: Page): Promise<() => Promise<number>> => {
  await page.route('**/*', (route) =>
    route.request().headers()['next-router-prefetch'] ? route.abort() : route.continue(),
  );
  const sizes: Promise<number>[] = [];
  page.on('response', (response) => {
    if (response.request().resourceType() !== 'script') return;
    sizes.push(
      response
        .request()
        .sizes()
        .then((value) => value.responseBodySize),
    );
  });
  return async () => (await Promise.all(sizes)).reduce((sum, size) => sum + size, 0);
};

test.describe('performance budget', () => {
  // Byte and layout-shift measurements need Chromium's network and PerformanceObserver APIs.
  test.skip(({ browserName }) => browserName !== 'chromium', 'Chromium-only lab measurement');

  test('home page ships compressed JS within budget', async ({ page }) => {
    const totalScriptBytes = await collectFirstLoadScriptBytes(page);
    await page.goto('/', { waitUntil: 'networkidle' });
    const kilobytes = (await totalScriptBytes()) / KB;
    test.info().annotations.push({ type: 'home-js-kb', description: kilobytes.toFixed(1) });
    // Zero means the measurement broke, not that the page is free.
    expect(kilobytes).toBeGreaterThan(0);
    expect(kilobytes).toBeLessThanOrEqual(HOME_JS_BUDGET_KB);
  });

  test('home page layout shift stays under the CLS threshold', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    const cls = await page.evaluate(
      (settleMs) =>
        new Promise<number>((resolve) => {
          let total = 0;
          new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              // LayoutShift is not in the TS DOM lib; these two fields are all we read.
              const shift = entry as PerformanceEntry & { value: number; hadRecentInput: boolean };
              if (!shift.hadRecentInput) total += shift.value;
            }
          }).observe({ type: 'layout-shift', buffered: true });
          setTimeout(() => resolve(total), settleMs);
        }),
      SETTLE_MS,
    );
    expect(cls).toBeLessThanOrEqual(CLS_BUDGET);
  });

  test('hashed static assets are cached as immutable', async ({ page }) => {
    const scripts: string[] = [];
    page.on('response', (response) => {
      if (response.url().includes('/_next/static/')) {
        scripts.push(response.headers()['cache-control'] ?? '');
      }
    });
    await page.goto('/', { waitUntil: 'networkidle' });
    expect(scripts.length).toBeGreaterThan(0);
    for (const cacheControl of scripts) expect(cacheControl).toContain('immutable');
  });
});
