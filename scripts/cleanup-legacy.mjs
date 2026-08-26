import { rm } from 'node:fs/promises';
import { legacyFiles } from './legacy-files.mjs';

for (const path of legacyFiles) {
  await rm(path, { force: true });
  console.log(`Removed ${path}`);
}

await rm('public/content', { recursive: false, force: true }).catch(() => undefined);
