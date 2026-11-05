import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdirSync, rmSync } from 'node:fs';
import { describe, it } from 'node:test';

const FIXTURE = 'biome-plugins/__fixtures__/hardcoded.tsx';
// Fixtures are excluded from `pnpm check`; lint a temporary copy under src/ instead.
const PROBE_DIR = 'src/__plugin_probe__';
const PROBE = `${PROBE_DIR}/hardcoded.tsx`;

const pluginLines = () => {
  mkdirSync(PROBE_DIR, { recursive: true });
  copyFileSync(FIXTURE, PROBE);
  let output = '';
  try {
    output = execFileSync('pnpm', ['exec', 'biome', 'lint', '--max-diagnostics=100', PROBE], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch (error) {
    output = `${error.stdout ?? ''}${error.stderr ?? ''}`;
  } finally {
    rmSync(PROBE_DIR, { recursive: true, force: true });
  }
  return [...output.matchAll(/hardcoded\.tsx:(\d+):\d+ plugin/g)].map((m) => Number(m[1]));
};

describe('no-hardcoded-jsx-text Biome plugin', () => {
  it('reports text next to expressions, punctuation, links and literal a11y attributes', () => {
    assert.deepEqual(pluginLines(), [4, 5, 6, 7, 8, 9]);
  });
});
