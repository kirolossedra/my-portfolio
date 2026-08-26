import { readFile } from 'node:fs/promises';

const files = [
  'wrangler.jsonc',
  'worker/env.ts',
  'worker/index.ts',
  'worker/milestones-repository.ts',
  'worker/validation.ts',
  'shared/milestone.ts',
  'scripts/milestone-cli.mjs',
];

const forbiddenPatterns = [
  /\bR2Bucket\b/,
  /\br2_buckets\b/,
  /\br2Key\b/,
  /\br2_key\b/,
  /\/api\/media\//,
  /wrangler r2/i,
];

const violations = [];
for (const path of files) {
  const text = await readFile(path, 'utf8');
  for (const pattern of forbiddenPatterns) {
    if (pattern.test(text)) violations.push(`${path}: ${pattern}`);
  }
}

if (violations.length > 0) {
  console.error('R2 references are not allowed in the active portfolio implementation:');
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log('No active R2 storage references found.');
