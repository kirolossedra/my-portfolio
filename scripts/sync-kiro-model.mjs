#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { copyFile, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { dirname, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sourceRoot = resolve(projectRoot, 'rag/3d-kiro');
const publicRoot = resolve(projectRoot, 'public/models/kiro');
const sourceModel = resolve(sourceRoot, 'athletic+man+3d+model.fbx');
const publicModel = resolve(publicRoot, 'kiro.fbx');
const sourceAnimations = resolve(sourceRoot, 'animations');
const publicAnimations = resolve(publicRoot, 'animations');
const sha256 = (buffer) => createHash('sha256').update(buffer).digest('hex');

async function copyIfChanged(source, destination) {
  const sourceBytes = await readFile(source);
  let destinationHash = null;
  try { destinationHash = sha256(await readFile(destination)); } catch { /* generated file is absent */ }
  await mkdir(dirname(destination), { recursive: true });
  if (destinationHash !== sha256(sourceBytes)) await copyFile(source, destination);
}

await copyIfChanged(sourceModel, publicModel);
await mkdir(sourceAnimations, { recursive: true });
await mkdir(publicAnimations, { recursive: true });

const animationFiles = (await readdir(sourceAnimations, { withFileTypes: true }))
  .filter((entry) => entry.isFile() && extname(entry.name).toLowerCase() === '.fbx')
  .map((entry) => entry.name)
  .sort((left, right) => left.localeCompare(right));

const generatedFiles = await readdir(publicAnimations, { withFileTypes: true });
for (const entry of generatedFiles) {
  if (entry.isFile() && extname(entry.name).toLowerCase() === '.fbx' && !animationFiles.includes(entry.name)) {
    await rm(resolve(publicAnimations, entry.name));
  }
}
for (const name of animationFiles) {
  await copyIfChanged(resolve(sourceAnimations, name), resolve(publicAnimations, name));
}

await writeFile(
  resolve(publicRoot, 'animations.json'),
  `${JSON.stringify({ files: animationFiles }, null, 2)}\n`,
  'utf8',
);

console.log(`Kiro model ready: ${publicModel}`);
console.log(`Kiro animation clips ready: ${animationFiles.length}`);
