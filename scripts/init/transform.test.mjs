import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  applyCompose,
  applyLocaleConfig,
  applyPackageJson,
  applySiteConfig,
  normalizeSlug,
  parseOptions,
  planInit,
} from './transform.mjs';

describe('normalizeSlug', () => {
  it('lowercases and hyphenates', () => {
    assert.equal(normalizeSlug('My App'), 'my-app');
    assert.equal(normalizeSlug('  Coffee_Shop 2 '), 'coffee-shop-2');
  });

  it('rejects empty and path-like names', () => {
    assert.throws(() => normalizeSlug(''), /name/);
    assert.throws(() => normalizeSlug('   '), /name/);
    assert.throws(() => normalizeSlug('../x'), /name/);
    assert.throws(() => normalizeSlug('a/b'), /name/);
  });
});

describe('parseOptions', () => {
  it('requires --name and validates url, locale and ci', () => {
    assert.throws(() => parseOptions({}), /--name/);
    assert.throws(() => parseOptions({ name: 'x', url: 'ftp://x' }), /--url/);
    assert.throws(() => parseOptions({ name: 'x', locale: 'english' }), /--locale/);
    assert.throws(() => parseOptions({ name: 'x', ci: 'jenkins' }), /--ci/);
  });

  it('fills defaults', () => {
    const options = parseOptions({ name: 'Coffee Shop' });
    assert.equal(options.slug, 'coffee-shop');
    assert.equal(options.title, 'Coffee Shop');
    assert.equal(options.locale, 'en');
    assert.equal(options.ci, 'github');
    assert.equal(options.keepRecipes, 'all');
  });

  it('parses recipe lists', () => {
    assert.deepEqual(parseOptions({ name: 'x', 'keep-recipes': 'payments, auth' }).keepRecipes, [
      'payments',
      'auth',
    ]);
    assert.equal(parseOptions({ name: 'x', 'keep-recipes': 'none' }).keepRecipes, 'none');
  });
});

describe('file transforms', () => {
  it('rewrites only marked site config values', () => {
    const source = [
      "  name: 'Web Template', // TEMPLATE:name",
      "  shortName: 'Template', // TEMPLATE:shortName",
      "  description: 'Old.', // TEMPLATE:description",
      '  url: clientEnv.NEXT_PUBLIC_SITE_URL,',
    ].join('\n');
    const out = applySiteConfig(source, { title: "Bob's Café", description: 'Best coffee.' });
    assert.match(out, /name: 'Bob\\'s Café', \/\/ TEMPLATE:name/);
    assert.match(out, /shortName: 'Bob\\'s Café', \/\/ TEMPLATE:shortName/);
    assert.match(out, /description: 'Best coffee.', \/\/ TEMPLATE:description/);
    assert.match(out, /url: clientEnv.NEXT_PUBLIC_SITE_URL,/);
  });

  it('sets locale config', () => {
    const source =
      "export const locales = ['en'] as const; // TEMPLATE:locales\nexport const defaultLocale: Locale = 'en'; // TEMPLATE:defaultLocale";
    const out = applyLocaleConfig(source, 'ru');
    assert.match(out, /locales = \['ru'\] as const;/);
    assert.match(out, /defaultLocale: Locale = 'ru';/);
  });

  it('renames package and drops the init script', () => {
    const pkg = JSON.stringify({
      name: 'web-template',
      scripts: { dev: 'x', 'template:init': 'y' },
    });
    const out = JSON.parse(applyPackageJson(pkg, 'coffee-shop'));
    assert.equal(out.name, 'coffee-shop');
    assert.equal(out.scripts['template:init'], undefined);
    assert.equal(out.scripts.dev, 'x');
  });

  it('renames the compose container', () => {
    const out = applyCompose('    container_name: web-template-web # TEMPLATE:container', 'shop');
    assert.equal(out, '    container_name: shop-web # TEMPLATE:container');
  });
});

describe('planInit', () => {
  const files = {
    'package.json': JSON.stringify({ name: 'web-template', scripts: {} }),
    'src/config/site.ts': "  name: 'Web Template', // TEMPLATE:name",
    'src/i18n/config.ts': "export const locales = ['en'] as const; // TEMPLATE:locales",
    'messages/en.json': JSON.stringify({
      metadata: { title: 'T', description: 'D' },
      home: { title: 'T' },
    }),
    'docker-compose.yml': 'container_name: web-template-web # TEMPLATE:container',
    'CLAUDE.md': '<!-- TEMPLATE:project -->',
    'docs/decisions.md': '# Decisions\n',
    'global.d.ts': "import type messages from './messages/en.json';",
    'src/test/render.tsx': 'import messages from \'../../messages/en.json\';\nlocale="en"',
    'e2e/smoke.spec.ts':
      "import messages from '../messages/en.json' with { type: 'json' };\n'lang', 'en'",
  };
  const context = {
    read: (path) => {
      if (!(path in files)) throw new Error(`unexpected read ${path}`);
      return files[path];
    },
    recipes: ['payments', 'auth', 'supabase'],
    templateVersion: 'abc1234',
    today: '2026-11-06',
  };

  it('github: removes the gitlab pipeline and keeps workflows', () => {
    const plan = planInit(parseOptions({ name: 'shop' }), context);
    assert.ok(plan.deletes.includes('.gitlab-ci.yml'));
    assert.ok(!plan.deletes.includes('.github'));
    assert.ok(plan.deletes.includes('scripts/init'));
  });

  it('gitlab: removes .github and keeps the gitlab pipeline', () => {
    const plan = planInit(parseOptions({ name: 'shop', ci: 'gitlab' }), context);
    assert.ok(plan.deletes.includes('.github'));
    assert.ok(!plan.deletes.includes('.gitlab-ci.yml'));
  });

  it('keeps only requested recipes', () => {
    const plan = planInit(parseOptions({ name: 'shop', 'keep-recipes': 'payments' }), context);
    assert.ok(plan.deletes.includes('docs/recipes/auth.md'));
    assert.ok(plan.deletes.includes('docs/recipes/supabase.md'));
    assert.ok(!plan.deletes.includes('docs/recipes/payments.md'));
  });

  it('rejects unknown recipes', () => {
    assert.throws(
      () => planInit(parseOptions({ name: 'shop', 'keep-recipes': 'paymnts' }), context),
      /paymnts/,
    );
  });

  it('moves messages to the new locale and updates references', () => {
    const plan = planInit(parseOptions({ name: 'shop', locale: 'ru', title: 'Магазин' }), context);
    const write = (path) => plan.writes.find((w) => w.path === path)?.content;
    assert.ok(plan.deletes.includes('messages/en.json'));
    assert.equal(JSON.parse(write('messages/ru.json')).home.title, 'Магазин');
    assert.match(write('global.d.ts'), /messages\/ru\.json/);
    assert.match(write('src/test/render.tsx'), /locale="ru"/);
    assert.match(write('e2e/smoke.spec.ts'), /'lang', 'ru'/);
  });

  it('records the template version in decisions', () => {
    const plan = planInit(parseOptions({ name: 'shop' }), context);
    const decisions = plan.writes.find((w) => w.path === 'docs/decisions.md')?.content ?? '';
    assert.match(decisions, /D-001/);
    assert.match(decisions, /abc1234/);
  });
});
