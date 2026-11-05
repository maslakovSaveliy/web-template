#!/usr/bin/env node
// i18n guard: every locale file in messages/ has exactly the keys of the default locale.
// Hardcoded JSX text is caught by the Biome plugin biome-plugins/no-hardcoded-jsx-text.grit.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
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

export const readDefaultLocale = (configSource) =>
  /defaultLocale: Locale = '([^']+)'/.exec(configSource)?.[1] ?? 'en';

const run = (root) => {
  const messagesDir = join(root, 'messages');
  const defaultLocale = readDefaultLocale(readFileSync(join(root, 'src/i18n/config.ts'), 'utf8'));
  const base = JSON.parse(readFileSync(join(messagesDir, `${defaultLocale}.json`), 'utf8'));
  const problems = [];
  for (const file of readdirSync(messagesDir).filter((f) => f.endsWith('.json'))) {
    const other = JSON.parse(readFileSync(join(messagesDir, file), 'utf8'));
    const { missing, extra } = diffKeys(base, other);
    for (const key of missing) problems.push(`messages/${file}: missing key "${key}"`);
    for (const key of extra) problems.push(`messages/${file}: extra key "${key}"`);
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
