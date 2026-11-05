#!/usr/bin/env node
// Turns this template into a project. Usage:
//   pnpm template:init --name "Coffee Shop" [--title "Coffee Shop"] [--description "..."]
//     [--url https://coffee.example] [--locale en] [--ci github|gitlab]
//     [--keep-recipes all|none|payments,auth] [--dry-run] [--force]
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseArgs } from 'node:util';
import { parseOptions, planInit } from './transform.mjs';

const ROOT = process.cwd();
const TEMPLATE_PACKAGE_NAME = 'web-template';

const git = (...args) => {
  try {
    return execFileSync('git', args, {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return undefined;
  }
};

const fail = (message) => {
  console.error(`✖ ${message}`);
  process.exit(1);
};

const { values } = parseArgs({
  options: {
    name: { type: 'string' },
    title: { type: 'string' },
    description: { type: 'string' },
    url: { type: 'string' },
    locale: { type: 'string' },
    ci: { type: 'string' },
    'keep-recipes': { type: 'string' },
    'dry-run': { type: 'boolean' },
    force: { type: 'boolean' },
  },
  strict: true,
});

let options;
try {
  options = parseOptions(values);
} catch (error) {
  fail(error.message);
}

const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
if (pkg.name !== TEMPLATE_PACKAGE_NAME) {
  fail(`Already initialized (package name is "${pkg.name}"). Nothing to do.`);
}

const insideGit = git('rev-parse', '--is-inside-work-tree') === 'true';
if (insideGit && !options.force && git('status', '--porcelain')) {
  fail('Working tree has uncommitted changes. Commit or stash them, or pass --force.');
}

const recipesDir = join(ROOT, 'docs/recipes');
const recipes = existsSync(recipesDir)
  ? readdirSync(recipesDir)
      .filter((file) => file.endsWith('.md') && file !== 'README.md')
      .map((file) => file.replace(/\.md$/, ''))
  : [];

let plan;
try {
  plan = planInit(options, {
    read: (path) => readFileSync(join(ROOT, path), 'utf8'),
    recipes,
    templateVersion: (insideGit && git('rev-parse', '--short', 'HEAD')) || 'unknown',
    today: new Date().toISOString().slice(0, 10),
  });
} catch (error) {
  fail(error.message);
}

if (options.dryRun) {
  console.info('Dry run. Would write:');
  for (const { path } of plan.writes) console.info(`  + ${path}`);
  console.info('Would delete:');
  for (const path of plan.deletes) console.info(`  - ${path}`);
  process.exit(0);
}

for (const { path, content } of plan.writes) writeFileSync(join(ROOT, path), content);
for (const path of plan.deletes) rmSync(join(ROOT, path), { recursive: true, force: true });

// Generated files (README tables, JSON) must pass `pnpm check` right away.
try {
  execFileSync(
    'pnpm',
    ['exec', 'biome', 'format', '--write', ...plan.writes.map(({ path }) => path)],
    { cwd: ROOT, stdio: 'ignore' },
  );
} catch {
  console.warn('! Could not run Biome on generated files. Run `pnpm check:fix`.');
}

console.info(`✔ Initialized "${options.title}" (${options.slug}).

Next:
  1. cp .env.example .env.local && pnpm install && pnpm verify
  2. Brand: set tokens in src/styles/tokens/ (use /impeccable or /frontend-design)
  3. Legal pages for your market: /legal-kit (plan mode) before collecting any personal data
  4. CI/CD variables: see docs/deploy.md${options.url ? ` (NEXT_PUBLIC_SITE_URL=${options.url})` : ''}
  5. First feature: /superpowers:brainstorming → /superpowers:writing-plans`);
