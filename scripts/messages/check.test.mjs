import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { diffKeys, readDefaultLocale } from './check.mjs';

describe('diffKeys', () => {
  it('returns no problems for identical shapes', () => {
    assert.deepEqual(diffKeys({ a: { b: 'x' } }, { a: { b: 'y' } }), { missing: [], extra: [] });
  });

  it('reports missing and extra nested keys', () => {
    const result = diffKeys({ a: { b: 'x', c: 'y' } }, { a: { b: 'x' }, d: 'z' });
    assert.deepEqual(result, { missing: ['a.c'], extra: ['d'] });
  });
});

describe('readDefaultLocale', () => {
  it('reads the default locale from config source', () => {
    assert.equal(readDefaultLocale("export const defaultLocale: Locale = 'ru';"), 'ru');
    assert.equal(readDefaultLocale('nothing here'), 'en');
  });
});
