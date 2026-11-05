import { expect, test } from '@playwright/test';
import messages from '../messages/en.json' with { type: 'json' };

test('home renders with language, title and one h1', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page).toHaveTitle(messages.metadata.title);
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
});

test('skip link moves focus to main content', async ({ page, browserName }) => {
  test.skip(browserName === 'webkit', 'WebKit does not focus links with Tab by default');
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: messages.common.skipToContent })).toBeFocused();
});

test('unknown route returns 404 page', async ({ page }) => {
  const response = await page.goto('/definitely-not-here');
  expect(response?.status()).toBe(404);
  await expect(page.getByRole('heading', { name: messages.notFound.title })).toBeVisible();
});

test('health endpoint is ok and uncached', async ({ request }) => {
  const response = await request.get('/api/health');
  expect(response.ok()).toBe(true);
  expect(response.headers()['cache-control']).toBe('no-store');
});

test('contact form validates, then submits', async ({ page }) => {
  await page.goto('/contact');
  const submit = page.getByRole('button', { name: messages.contact.submit });
  await submit.click();
  await expect(page.getByText(messages.contact.errors.nameRequired)).toBeVisible();

  await page.getByLabel(messages.contact.name).fill('Ada');
  await page.getByLabel(messages.contact.email).fill('ada@example.com');
  await page.getByLabel(messages.contact.message).fill('Hello there, this is long enough.');
  await submit.click();
  await expect(page.getByText(messages.contact.success)).toBeVisible();
});

test('theme toggle switches data-theme', async ({ page }) => {
  await page.goto('/');
  const toggle = page.getByRole('button', { name: new RegExp(messages.theme.toggle) });
  await toggle.click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', /light|dark/);
});
