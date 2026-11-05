// Locales shipped by this app. Single locale, no URL prefix by default.
// To add locales and prefixed routing see docs/recipes/i18n-multi-locale.md.
export const locales = ['en'] as const; // TEMPLATE:locales

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en'; // TEMPLATE:defaultLocale

export const timeZone = 'UTC';

export const isLocale = (value: string): value is Locale =>
  (locales as readonly string[]).includes(value);
