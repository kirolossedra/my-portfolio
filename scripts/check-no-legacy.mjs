import { access } from 'node:fs/promises';
import { constants } from 'node:fs';
import { legacyFiles } from './legacy-files.mjs';

const existing = [];
for (const path of legacyFiles) {
  try {
    await access(path, constants.F_OK);
    existing.push(path);
  } catch {
    // Missing is the desired state.
  }
}

if (existing.length) {
  console.error('Legacy JavaScript/content files remain after the TypeScript + D1 migration:');
  existing.forEach((path) => console.error(`- ${path}`));
  console.error('\nRun: npm run cleanup:legacy');
  process.exit(1);
}
