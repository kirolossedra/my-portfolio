import { readFile } from 'node:fs/promises';
import { basename } from 'node:path';

const apiBase = (process.env.PORTFOLIO_API_URL ?? 'https://kirolos-portfolio-api.linc-ministry.workers.dev').replace(/\/$/, '');
const token = process.env.PORTFOLIO_ADMIN_TOKEN;
const [command, ...args] = process.argv.slice(2);

function usage() {
  console.log(`Usage:
  npm run milestone -- list
  npm run milestone -- create <milestone.json>
  npm run milestone -- update <id> <milestone.json>
  npm run milestone -- sections <id> <sections.json>
  npm run milestone -- images <id> <images.json>
  npm run milestone -- delete <id>
  npm run milestone -- upload <r2-key> <file>
  npm run milestone -- remove-media <r2-key>

Environment:
  PORTFOLIO_API_URL       Optional; defaults to the production Worker URL.
  PORTFOLIO_ADMIN_TOKEN   Required admin bearer token.`);
}

if (!command) {
  usage();
  process.exit(1);
}

if (!token) {
  console.error('PORTFOLIO_ADMIN_TOKEN is required.');
  process.exit(1);
}

async function jsonFile(path) {
  return JSON.parse(await readFile(path, 'utf8'));
}

async function request(path, options = {}) {
  const headers = new Headers(options.headers ?? {});
  headers.set('Authorization', `Bearer ${token}`);
  const response = await fetch(`${apiBase}${path}`, { ...options, headers });
  const text = await response.text();
  const body = text ? JSON.parse(text) : null;

  if (!response.ok) {
    console.error(JSON.stringify(body, null, 2));
    process.exit(1);
  }

  if (body !== null) console.log(JSON.stringify(body, null, 2));
}

switch (command) {
  case 'list':
    await request('/api/admin/milestones');
    break;
  case 'create': {
    const [file] = args;
    if (!file) throw new Error('create requires a JSON file.');
    await request('/api/admin/milestones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(await jsonFile(file)),
    });
    break;
  }
  case 'update': {
    const [id, file] = args;
    if (!id || !file) throw new Error('update requires <id> <milestone.json>.');
    await request(`/api/admin/milestones/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(await jsonFile(file)),
    });
    break;
  }
  case 'sections': {
    const [id, file] = args;
    if (!id || !file) throw new Error('sections requires <id> <sections.json>.');
    await request(`/api/admin/milestones/${id}/sections`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(await jsonFile(file)),
    });
    break;
  }
  case 'images': {
    const [id, file] = args;
    if (!id || !file) throw new Error('images requires <id> <images.json>.');
    await request(`/api/admin/milestones/${id}/images`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(await jsonFile(file)),
    });
    break;
  }
  case 'delete': {
    const [id] = args;
    if (!id) throw new Error('delete requires an id.');
    await request(`/api/admin/milestones/${id}`, { method: 'DELETE' });
    break;
  }
  case 'upload': {
    const [key, file] = args;
    if (!key || !file) throw new Error('upload requires <r2-key> <file>.');
    const bytes = await readFile(file);
    const extension = basename(file).split('.').pop()?.toLowerCase();
    const contentTypes = {
      avif: 'image/avif',
      gif: 'image/gif',
      jpeg: 'image/jpeg',
      jpg: 'image/jpeg',
      png: 'image/png',
      webp: 'image/webp',
    };
    const contentType = extension ? contentTypes[extension] : undefined;
    if (!contentType) {
      throw new Error('upload supports AVIF, GIF, JPEG, PNG, and WebP images only.');
    }
    await request(`/api/admin/media/${key.split('/').map(encodeURIComponent).join('/')}`, {
      method: 'PUT',
      headers: { 'Content-Type': contentType },
      body: bytes,
    });
    break;
  }
  case 'remove-media': {
    const [key] = args;
    if (!key) throw new Error('remove-media requires an r2 key.');
    await request(`/api/admin/media/${key.split('/').map(encodeURIComponent).join('/')}`, {
      method: 'DELETE',
    });
    break;
  }
  default:
    usage();
    process.exit(1);
}
