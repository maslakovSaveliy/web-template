import type { Messages } from 'next-intl';
import type { Locale } from './config';

/**
 * Where UI texts come from. Components never import message files directly, so
 * texts can move to a CMS or database without touching any component:
 * swap `activeSource` (see docs/recipes/remote-messages.md).
 */
export interface MessageSource {
  load(locale: Locale): Promise<Messages>;
}

export const localMessageSource: MessageSource = {
  async load(locale) {
    const file = (await import(`../../messages/${locale}.json`)) as { default: Messages };
    return file.default;
  },
};

const activeSource: MessageSource = localMessageSource;

export const loadMessages = (locale: Locale): Promise<Messages> => activeSource.load(locale);
