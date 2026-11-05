// Pure transforms for `pnpm template:init`. No file system access here: index.mjs
// reads files, calls planInit() and applies the resulting writes/deletes.

const LOCALE_PATTERN = /^[a-z]{2}(-[A-Z]{2})?$/;
const CI_PROVIDERS = ['github', 'gitlab'];
const DEFAULT_DESCRIPTION = 'Product description.';

export const normalizeSlug = (input) => {
  const raw = String(input ?? '').trim();
  if (!raw || raw.includes('/') || raw.includes('\\') || raw.includes('..')) {
    throw new Error(`Invalid --name "${input}": use letters, digits, spaces or hyphens.`);
  }
  if (/[^A-Za-z0-9 _-]/.test(raw)) {
    throw new Error(
      `Invalid --name "${input}": use Latin letters, digits, spaces or hyphens. Put the display name in --title.`,
    );
  }
  const slug = raw
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  if (!slug) throw new Error(`Invalid --name "${input}": nothing left after normalizing.`);
  return slug;
};

const parseRecipes = (value) => {
  if (value === undefined || value === 'all') return 'all';
  if (value === 'none') return 'none';
  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
};

export const parseOptions = (raw) => {
  if (!raw.name) throw new Error('Missing --name <project-name>.');
  const slug = normalizeSlug(raw.name);
  if (raw.url !== undefined && !/^https?:\/\/[^\s]+$/.test(raw.url)) {
    throw new Error(`Invalid --url "${raw.url}": expected http(s)://...`);
  }
  const locale = raw.locale ?? 'en';
  if (!LOCALE_PATTERN.test(locale))
    throw new Error(`Invalid --locale "${locale}": use e.g. en, ru, pt-BR.`);
  const ci = raw.ci ?? 'github';
  if (!CI_PROVIDERS.includes(ci)) throw new Error(`Invalid --ci "${ci}": use github or gitlab.`);

  return {
    slug,
    title: raw.title?.trim() || String(raw.name).trim(),
    description: raw.description?.trim() || DEFAULT_DESCRIPTION,
    url: raw.url,
    locale,
    ci,
    keepRecipes: parseRecipes(raw['keep-recipes']),
    dryRun: Boolean(raw['dry-run']),
    force: Boolean(raw.force),
  };
};

const quote = (value) => `'${String(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;

const replaceMarked = (source, marker, render) =>
  source.replace(
    new RegExp(`^(.*?)(\\S.*?)(,?)( // TEMPLATE:${marker})$`, 'm'),
    (_m, indent, _old, comma, tag) => `${indent}${render()}${comma}${tag}`,
  );

export const applySiteConfig = (source, { title, description }) => {
  let out = replaceMarked(source, 'name', () => `name: ${quote(title)}`);
  out = replaceMarked(out, 'shortName', () => `shortName: ${quote(title)}`);
  return replaceMarked(out, 'description', () => `description: ${quote(description)}`);
};

export const applyLocaleConfig = (source, locale) =>
  source
    .replace(/locales = \[[^\]]*\] as const;/, `locales = ['${locale}'] as const;`)
    .replace(/defaultLocale: Locale = '[^']*';/, `defaultLocale: Locale = '${locale}';`);

export const applyPackageJson = (json, slug) => {
  const pkg = JSON.parse(json);
  pkg.name = slug;
  pkg.version = '0.1.0';
  if (pkg.scripts) delete pkg.scripts['template:init'];
  return `${JSON.stringify(pkg, null, 2)}\n`;
};

export const applyCompose = (source, slug) =>
  source.replace(/container_name: \S+( # TEMPLATE:container)/, `container_name: ${slug}-web$1`);

const applyMessages = (json, { title, description }) => {
  const messages = JSON.parse(json);
  messages.metadata = { ...messages.metadata, title, description };
  messages.home = { ...messages.home, title };
  return `${JSON.stringify(messages, null, 2)}\n`;
};

const renderReadme = ({ title, description, url, ci }) => `# ${title}

${description}

${url ? `Production: ${url}\n\n` : ''}## Start

\`\`\`bash
cp .env.example .env.local
pnpm install
pnpm dev
\`\`\`

## Commands

| Command | What it does |
|---|---|
| \`pnpm dev\` | Dev server on http://localhost:3000 |
| \`pnpm verify\` | Lint, i18n check, types, unit tests, build |
| \`pnpm e2e\` | Playwright (Chromium + WebKit) against a production build |
| \`pnpm knip\` | Unused files, exports and dependencies |

## Docs

- \`CLAUDE.md\`: rules for humans and coding agents (start here)
- \`docs/architecture.md\`: structure and boundaries
- \`docs/decisions.md\`: decision log
- \`docs/deploy.md\`: ${ci === 'gitlab' ? 'GitLab' : 'GitHub'} CI/CD and server setup
- \`docs/recipes/\`: how to add a database, auth, payments and more
`;

const renderDecision = ({ title, slug, locale, ci }, { templateVersion, today }) => `
## D-001 · ${today} · Project created from web-template

- **Decision:** Start "${title}" (\`${slug}\`) from web-template@${templateVersion}.
- **Setup:** locale \`${locale}\`, CI \`${ci}\`.
- **Why:** shared, tested core (Next.js, SCSS tokens, i18n, tests, CI/CD, agent rules).
`;

const localeWrites = (options, context) => {
  const { locale, title, description } = options;
  const messagesPath = `messages/${locale}.json`;
  const source = context.read('messages/en.json');
  const writes = [{ path: messagesPath, content: applyMessages(source, { title, description }) }];
  if (locale === 'en') return { writes, deletes: [] };

  const swap = (path, edit) => writes.push({ path, content: edit(context.read(path)) });
  swap('src/i18n/config.ts', (s) => applyLocaleConfig(s, locale));
  swap('global.d.ts', (s) => s.replace('messages/en.json', messagesPath));
  swap('src/test/render.tsx', (s) =>
    s.replace('messages/en.json', messagesPath).replace('locale="en"', `locale="${locale}"`),
  );
  swap('e2e/smoke.spec.ts', (s) =>
    s.replace('messages/en.json', messagesPath).replace("'lang', 'en'", `'lang', '${locale}'`),
  );
  return { writes, deletes: ['messages/en.json'] };
};

const recipeDeletes = (keepRecipes, recipes) => {
  if (keepRecipes === 'all') return [];
  const keep = keepRecipes === 'none' ? [] : keepRecipes;
  const unknown = keep.filter((name) => !recipes.includes(name));
  if (unknown.length > 0) {
    throw new Error(`Unknown recipe(s): ${unknown.join(', ')}. Available: ${recipes.join(', ')}`);
  }
  return recipes.filter((name) => !keep.includes(name)).map((name) => `docs/recipes/${name}.md`);
};

const TEMPLATE_REPO_URL = 'https://github.com/maslakovSaveliy/web-template';

/** Drops index rows of removed recipes and says where to find them. */
export const pruneRecipeIndex = (source, removed) => {
  if (removed.length === 0) return source;
  const kept = source
    .split('\n')
    .filter((line) => !removed.some((name) => line.includes(`](${name}.md)`)))
    .join('\n')
    .trimEnd();
  return `${kept}\n\nRemoved at init (still available in ${TEMPLATE_REPO_URL}/tree/main/docs/recipes): ${removed.join(', ')}.\n`;
};

/**
 * @param options result of parseOptions()
 * @param context { read(path): string, recipes: string[], templateVersion: string, today: string }
 * @returns {{ writes: {path: string, content: string}[], deletes: string[] }}
 */
export const planInit = (options, context) => {
  const { slug, title, description, ci } = options;
  const locale = localeWrites(options, context);

  const writes = [
    { path: 'package.json', content: applyPackageJson(context.read('package.json'), slug) },
    {
      path: 'src/config/site.ts',
      content: applySiteConfig(context.read('src/config/site.ts'), { title, description }),
    },
    { path: 'docker-compose.yml', content: applyCompose(context.read('docker-compose.yml'), slug) },
    {
      path: 'CLAUDE.md',
      content: context
        .read('CLAUDE.md')
        .replace('<!-- TEMPLATE:project -->', `**${title}**: ${description}`),
    },
    {
      path: 'docs/decisions.md',
      content: context.read('docs/decisions.md') + renderDecision(options, context),
    },
    { path: 'README.md', content: renderReadme(options) },
    ...locale.writes,
  ];

  const removedRecipes = recipeDeletes(options.keepRecipes, context.recipes);
  if (removedRecipes.length > 0) {
    const names = removedRecipes.map((path) => path.replace(/^docs\/recipes\/|\.md$/g, ''));
    writes.push({
      path: 'docs/recipes/README.md',
      content: pruneRecipeIndex(context.read('docs/recipes/README.md'), names),
    });
  }

  const deletes = [
    ci === 'github' ? '.gitlab-ci.yml' : '.github',
    'scripts/init',
    'docs/superpowers',
    ...locale.deletes,
    ...removedRecipes,
  ];

  return { writes, deletes };
};
