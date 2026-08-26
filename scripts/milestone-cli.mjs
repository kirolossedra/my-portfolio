import { readFile } from 'node:fs/promises';
import { extname } from 'node:path';

const apiBase = (process.env.PORTFOLIO_API_URL ?? 'https://kirolos-portfolio-api.linc-ministry.workers.dev').replace(/\/$/, '');
const token = process.env.PORTFOLIO_ADMIN_TOKEN;
const [command, ...args] = process.argv.slice(2);

const CONTENT_TYPES = {
  '.avif': 'image/avif',
  '.gif': 'image/gif',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
};

const MAX_IMAGE_BYTES = 1_310_720;

function usage() {
  console.log(`Usage:
  npm run milestone -- list
  npm run milestone -- create <milestone.json>
  npm run milestone -- update <id> <milestone.json>
  npm run milestone -- sections <id> <sections.json>
  npm run milestone -- images <id> <images.json>
  npm run milestone -- image-add <id> <file> --alt="Alt text" [--caption="Caption"] [--order=0] [--cover]
  npm run milestone -- image-delete <milestone-id> <image-id>
  npm run milestone -- delete <id>

Environment:
  PORTFOLIO_API_URL       Optional; defaults to the production Worker URL.
  PORTFOLIO_ADMIN_TOKEN   Required until GitHub OAuth replaces temporary CLI authentication.`);
}

if (!command) {
  usage();
  process.exit(1);
}

if (!token) {
  console.error('PORTFOLIO_ADMIN_TOKEN is required until GitHub OAuth is configured.');
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

function option(name) {
  const prefix = `--${name}=`;
  return args.find((value) => value.startsWith(prefix))?.slice(prefix.length);
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
  case 'image-add': {
    const [id, file] = args;
    const altText = option('alt');
    if (!id || !file || !altText) {
      throw new Error('image-add requires <id> <file> --alt="Alt text".');
    }

    const extension = extname(file).toLowerCase();
    const mimeType = CONTENT_TYPES[extension];
    if (!mimeType) {
      throw new Error('image-add supports AVIF, GIF, JPEG, PNG, and WebP images only.');
    }

    const bytes = await readFile(file);
    if (bytes.byteLength > MAX_IMAGE_BYTES) {
      throw new Error(`Image is ${bytes.byteLength} bytes; maximum is ${MAX_IMAGE_BYTES} bytes before Base64 encoding.`);
    }

    const orderRaw = option('order');
    const displayOrder = orderRaw === undefined ? 0 : Number(orderRaw);
    if (!Number.isInteger(displayOrder)) throw new Error('--order must be an integer.');

    await request(`/api/admin/milestones/${id}/images`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mimeType,
        base64Data: bytes.toString('base64'),
        altText,
        caption: option('caption') ?? null,
        displayOrder,
        isCover: args.includes('--cover'),
      }),
    });
    break;
  }
  case 'image-delete': {
    const [milestoneId, imageId] = args;
    if (!milestoneId || !imageId) throw new Error('image-delete requires <milestone-id> <image-id>.');
    await request(`/api/admin/milestones/${milestoneId}/images/${imageId}`, { method: 'DELETE' });
    break;
  }
  case 'delete': {
    const [id] = args;
    if (!id) throw new Error('delete requires an id.');
    await request(`/api/admin/milestones/${id}`, { method: 'DELETE' });
    break;
  }
  default:
    usage();
    process.exit(1);
}
