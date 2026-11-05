#!/usr/bin/env node
// Guards for i18n:
// 1. every locale file in messages/ has exactly the keys of the default locale;
// 2. no hardcoded user-facing text in JSX (src/**/*.tsx, tests excluded).
// Escape hatch for intentional literals (brand marks, code samples): a line
// comment `// i18n-ignore` anywhere in the file, or `{/* i18n-ignore */}` before the text.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const flatten = (value, prefix = '') =>
  Object.entries(value).flatMap(([key, child]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return child !== null && typeof child === 'object' ? flatten(child, path) : [path];
  });

export const diffKeys = (base, other) => {
  const baseKeys = new Set(flatten(base));
  const otherKeys = new Set(flatten(other));
  return {
    missing: [...baseKeys].filter((k) => !otherKeys.has(k)).sort(),
    extra: [...otherKeys].filter((k) => !baseKeys.has(k)).sort(),
  };
};

// Text between a closing `>` of a tag and the next `<`/`{`, containing a letter.
const JSX_TEXT = />([^<>{}]*\p{L}[^<>{}]*)</gu;

// Blank out comments (keeping newlines) so `<html>` in a comment is not read as JSX.
const stripComments = (source) =>
  source.replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, (comment) => comment.replace(/[^\n]/g, ' '));

export const findHardcodedText = (source) => {
  if (source.includes('// i18n-ignore')) return [];
  const code = stripComments(source);
  const hits = [];
  for (const match of code.matchAll(JSX_TEXT)) {
    const text = match[1].trim();
    if (!text) continue;
    // Skip TypeScript generics / comparisons like `a > b && c < d` inside expressions.
    if (/[=;()&|]/.test(text)) continue;
    const line = code.slice(0, match.index).split('\n').length;
    hits.push({ line, text });
  }
  return hits;
};

const walk = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });

const run = (root) => {
  const problems = [];
  const messagesDir = join(root, 'messages');
  const configSource = readFileSync(join(root, 'src/i18n/config.ts'), 'utf8');
  const defaultLocale = /defaultLocale: Locale = '([^']+)'/.exec(configSource)?.[1] ?? 'en';
  const base = JSON.parse(readFileSync(join(messagesDir, `${defaultLocale}.json`), 'utf8'));

  for (const file of readdirSync(messagesDir).filter((f) => f.endsWith('.json'))) {
    const { missing, extra } = diffKeys(base, JSON.parse(readFileSync(join(messagesDir, file))));
    for (const key of missing) problems.push(`messages/${file}: missing key "${key}"`);
    for (const key of extra) problems.push(`messages/${file}: extra key "${key}"`);
  }

  const sources = walk(join(root, 'src')).filter(
    (f) => f.endsWith('.tsx') && !f.endsWith('.test.tsx'),
  );
  for (const file of sources) {
    for (const hit of findHardcodedText(readFileSync(file, 'utf8'))) {
      problems.push(`${relative(root, file)}:${hit.line}: hardcoded text "${hit.text}" — use t()`);
    }
  }
  return problems;
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const problems = run(process.cwd());
  if (problems.length > 0) {
    console.error(`i18n check failed:\n${problems.map((p) => `  - ${p}`).join('\n')}`);
    process.exit(1);
  }
  console.info('i18n check passed');
}
