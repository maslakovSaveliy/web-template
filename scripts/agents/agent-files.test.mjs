// Rules must live in one agent-neutral file: Codex reads only AGENTS.md and has no `@` imports.
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const read = (path) => readFileSync(path, 'utf8');

describe('agent rule files', () => {
  it('keeps every rule section in AGENTS.md', () => {
    const agents = read('AGENTS.md');
    for (const heading of ['## Commands', '## Invariants', '## Project memory', '## Skill map']) {
      assert.ok(agents.includes(heading), `AGENTS.md is missing "${heading}"`);
    }
  });

  for (const stub of ['CLAUDE.md', 'GEMINI.md']) {
    it(`${stub} only imports AGENTS.md`, () => {
      const content = read(stub);
      assert.match(content, /^@AGENTS\.md$/m);
      assert.doesNotMatch(content, /^## /m, `${stub} must not hold rules of its own`);
    });
  }

  it('points Cursor rules at AGENTS.md, never CLAUDE.md', () => {
    for (const file of readdirSync('.cursor/rules')) {
      assert.doesNotMatch(read(`.cursor/rules/${file}`), /CLAUDE\.md/, file);
    }
  });

  it('ships the shared memory file', () => {
    assert.ok(existsSync('docs/agents/memory.md'));
  });
});
