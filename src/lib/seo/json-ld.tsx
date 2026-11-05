import type { ReactNode } from 'react';

// Built from char codes: U+2028/U+2029 are valid in JSON but terminate JS lines.
const LINE_SEPARATOR = String.fromCharCode(0x2028);
const PARAGRAPH_SEPARATOR = String.fromCharCode(0x2029);
const UNSAFE_CHARS = new RegExp(`[<>&${LINE_SEPARATOR}${PARAGRAPH_SEPARATOR}]`, 'g');

const ESCAPES: Record<string, string> = {
  '<': '\\u003c',
  '>': '\\u003e',
  '&': '\\u0026',
  [LINE_SEPARATOR]: '\\u2028',
  [PARAGRAPH_SEPARATOR]: '\\u2029',
};

/** JSON for an inline <script>: escapes characters that could close the tag or start a comment. */
export const serializeJsonLd = (data: unknown): string =>
  JSON.stringify(data).replace(UNSAFE_CHARS, (char) => ESCAPES[char] ?? char);

export function JsonLd({ data }: { data: Record<string, unknown> }): ReactNode {
  return (
    <script
      type="application/ld+json"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: content is escaped by serializeJsonLd
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  );
}
