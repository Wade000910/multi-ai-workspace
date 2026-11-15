// Static repo checks (no network, no PowerShell needed): node --test tests/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(root, p), 'utf8');
const scripts = [
  ...readdirSync(join(root, 'tools')).filter((f) => f.endsWith('.ps1')).map((f) => `tools/${f}`),
  'start-codex.ps1',
];

test('every PowerShell script is listed in the README file table', () => {
  const readme = read('README.md');
  for (const s of scripts) assert.ok(readme.includes(`\`${s}\``), `README missing ${s}`);
});

test('README version matches the latest VERSION_HISTORY entry', () => {
  const latest = read('VERSION_HISTORY.md').match(/^## (v\d+\.\d+)/m)[1];
  const stated = read('README.md').match(/Environment (v\d+\.\d+)/)[1];
  assert.equal(stated, latest);
});

test('no credentials or local user paths in tracked docs and scripts', () => {
  const bad = [/C:\\Users\\/i, /\/home\/\w+/, /\bsk-[A-Za-z0-9_-]{16,}/, /\bghp_[A-Za-z0-9]{20,}/, /AIza[0-9A-Za-z_-]{30,}/];
  const files = [...scripts, 'README.md', 'AGENTS.md', 'PROJECT_MEMORY.md', 'VERSION_HISTORY.md',
    'ENVIRONMENT_CHANGELOG.md', 'docs/COLLABORATION_WORKFLOW.md'];
  for (const f of files) for (const re of bad) assert.ok(!re.test(read(f)), `${f} matches ${re}`);
});

test('PowerShell scripts have balanced braces and parentheses', () => {
  for (const s of scripts) {
    const t = read(s).replace(/<#[\s\S]*?#>/g, '').replace(/^\s*#.*$/gm, '').replace(/'[^'\n]*'|"[^"\n]*"/g, '');
    for (const [o, c] of [['{', '}'], ['(', ')']]) {
      assert.equal(t.split(o).length, t.split(c).length, `${s}: unbalanced ${o}${c}`);
    }
  }
});
