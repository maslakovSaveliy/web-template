import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { diffKeys, findHardcodedText } from './check.mjs';

describe('diffKeys', () => {
  it('returns no problems for identical shapes', () => {
    assert.deepEqual(diffKeys({ a: { b: 'x' } }, { a: { b: 'y' } }), { missing: [], extra: [] });
  });

  it('reports missing and extra nested keys', () => {
    const result = diffKeys({ a: { b: 'x', c: 'y' } }, { a: { b: 'x' }, d: 'z' });
    assert.deepEqual(result, { missing: ['a.c'], extra: ['d'] });
  });
});

describe('findHardcodedText', () => {
  it('flags literal JSX text', () => {
    const hits = findHardcodedText('const A = () => <p>Hello world</p>;');
    assert.equal(hits.length, 1);
    assert.match(hits[0].text, /Hello world/);
  });

  it('ignores translated text, expressions and punctuation', () => {
    const source = 'const A = () => <p>{t("x")}</p>; const B = () => <span> · </span>;';
    assert.deepEqual(findHardcodedText(source), []);
  });

  it('ignores tags mentioned inside comments', () => {
    const source =
      '// sets data-theme on <html> before hydration.\nconst A = () => <p>{t("x")}</p>;';
    assert.deepEqual(findHardcodedText(source), []);
  });

  it('reports the correct line number', () => {
    const hits = findHardcodedText('/* a\n b */\nconst A = () => (\n  <p>Hello</p>\n);');
    assert.equal(hits[0].line, 4);
  });

  it('respects the i18n-ignore marker', () => {
    assert.deepEqual(findHardcodedText('// i18n-ignore\nconst A = () => <p>Brand</p>;'), []);
  });
});
