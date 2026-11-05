import { getRequestConfig } from 'next-intl/server';
import { defaultLocale, timeZone } from './config';
import { loadMessages } from './messages';

// Single-locale setup: no routing, the locale is fixed by config.
export default getRequestConfig(async () => ({
  locale: defaultLocale,
  timeZone,
  messages: await loadMessages(defaultLocale),
}));
