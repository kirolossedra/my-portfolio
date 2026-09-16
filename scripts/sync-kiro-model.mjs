#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { copyFile, mkdir, readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = resolve(projectRoot, 'rag/3d-kiro/athletic+man+3d+model.fbx');
const destination = resolve(projectRoot, 'public/models/kiro/kiro.fbx');
const sha256 = (buffer) => createHash('sha256').update(buffer).digest('hex');

const sourceBytes = await readFile(source);
let destinationHash = null;
try { destinationHash = sha256(await readFile(destination)); } catch { /* generated file is absent */ }

await mkdir(dirname(destination), { recursive: true });
if (destinationHash !== sha256(sourceBytes)) await copyFile(source, destination);

console.log(`Kiro Mixamo asset ready: ${destination}`);
