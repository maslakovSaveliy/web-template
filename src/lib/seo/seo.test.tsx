import { describe, expect, it } from 'vitest';
import { serializeJsonLd } from './json-ld';
import { createPageMetadata } from './metadata';

describe('createPageMetadata', () => {
  it('sets canonical and og url from path', () => {
    const meta = createPageMetadata({ path: '/about', title: 'About' });
    expect(meta.alternates?.canonical).toBe('/about');
    expect(meta.openGraph).toMatchObject({ url: '/about', title: 'About' });
    expect(meta.title).toBe('About');
  });

  it('marks private pages noindex', () => {
    const meta = createPageMetadata({ path: '/account', noIndex: true });
    expect(meta.robots).toMatchObject({ index: false, follow: false });
  });
});

describe('serializeJsonLd', () => {
  it('escapes sequences that could break out of the script tag', () => {
    const out = serializeJsonLd({ name: '</script><script>alert(1)</script><!--' });
    expect(out).not.toContain('</script>');
    expect(out).not.toContain('<!--');
    expect(JSON.parse(out)).toEqual({ name: '</script><script>alert(1)</script><!--' });
  });
});

describe('serializeJsonLd line separators', () => {
  it('escapes U+2028 and U+2029', () => {
    const value = `a${String.fromCharCode(0x2028)}b${String.fromCharCode(0x2029)}c`;
    const out = serializeJsonLd({ value });
    expect(out).not.toContain(String.fromCharCode(0x2028));
    expect(out).not.toContain(String.fromCharCode(0x2029));
    expect(JSON.parse(out)).toEqual({ value });
  });
});
