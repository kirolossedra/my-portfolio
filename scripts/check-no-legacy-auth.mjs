import { readFile } from 'node:fs/promises';

const files = [
  'worker/env.ts',
  'worker/http.ts',
  'worker/index.ts',
  'worker/auth.ts',
  'scripts/milestone-cli.mjs',
  'README.md',
];

const forbiddenPatterns = [
  /ADMIN_API_TOKEN/,
  /PORTFOLIO_ADMIN_TOKEN/,
  /temporary bearer token/i,
];

const violations = [];
for (const path of files) {
  const text = await readFile(path, 'utf8');
  for (const pattern of forbiddenPatterns) {
    if (pattern.test(text)) violations.push(`${path}: ${pattern}`);
  }
}

if (violations.length) {
  console.error('Legacy permanent admin-token authentication is not allowed:');
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log('No legacy permanent admin-token authentication found.');
