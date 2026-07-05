#!/usr/bin/env node
// 🔒 Page-structure guardrail (enforced — build breaks if violated).
// Pages in src/pages/ MUST NOT:
//   1. import apiClient/bareClient or call raw fetch( — HTTP lives in services
//   2. call useQuery(/useMutation( inline — those live in custom hooks
//   3. exceed 500 lines
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const PAGES_DIR = join(process.cwd(), 'src', 'pages');
const MAX_LINES = 500;

const walk = (dir) => {
  const out = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (/\.jsx?$/.test(name)) out.push(full);
  }
  return out;
}

const violations = [];

let files = [];
try {
  files = walk(PAGES_DIR);
} catch {
  console.log('No src/pages directory yet — nothing to check.');
  process.exit(0);
}

for (const file of files) {
  const src = readFileSync(file, 'utf8');
  const lines = src.split('\n');
  const rel = file.replace(process.cwd() + '/', '');

  if (lines.length > MAX_LINES) {
    violations.push(`${rel}: ${lines.length} lines (max ${MAX_LINES}) — extract UI into src/components/`);
  }
  if (/from\s+['"][^'"]*apiClient['"]/.test(src) || /from\s+['"][^'"]*bareClient['"]/.test(src)) {
    violations.push(`${rel}: imports apiClient/bareClient — move HTTP into src/services/`);
  }
  if (/\bfetch\s*\(/.test(src)) {
    violations.push(`${rel}: calls raw fetch( — move HTTP into src/services/`);
  }
  if (/\buseQuery\s*\(/.test(src) || /\buseMutation\s*\(/.test(src)) {
    violations.push(`${rel}: calls useQuery/useMutation inline — move into src/hooks/`);
  }
}

if (violations.length) {
  console.error('✗ Page-structure check failed:\n');
  for (const v of violations) console.error('  - ' + v);
  console.error(`\n${violations.length} violation(s).`);
  process.exit(1);
}

console.log(`✓ Page-structure check passed (${files.length} page file(s)).`);
