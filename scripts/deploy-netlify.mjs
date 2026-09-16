#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const netlifyStatePath = resolve(projectRoot, '.netlify/state.json');
const onWindows = process.platform === 'win32';

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: projectRoot,
    env: process.env,
    stdio: 'inherit',
    shell: onWindows,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

let state;
try {
  state = JSON.parse(await readFile(netlifyStatePath, 'utf8'));
} catch {
  console.error('This checkout is not linked to Netlify. Run `netlify login`, then `netlify link` and select the existing kirolos.dev site.');
  process.exit(1);
}

if (typeof state.siteId !== 'string' || state.siteId.length === 0) {
  console.error('The Netlify link has no site ID. Run `netlify link` and select the existing kirolos.dev site.');
  process.exit(1);
}

run('netlify', ['status']);
run('npm', ['run', 'build']);
run('netlify', ['deploy', '--prod', '--dir=dist', '--message=Direct production deploy']);
