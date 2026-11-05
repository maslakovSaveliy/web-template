import { describe, expect, it } from 'vitest';
import { defaultLocale, isLocale, locales } from './config';
import { loadMessages } from './messages';

describe('i18n messages', () => {
  it('loads messages for every configured locale', async () => {
    for (const locale of locales) {
      const messages = await loadMessages(locale);
      expect(messages.home.title).toEqual(expect.any(String));
    }
  });

  it('default locale is one of the configured locales', () => {
    expect(isLocale(defaultLocale)).toBe(true);
    expect(isLocale('xx')).toBe(false);
  });
});
