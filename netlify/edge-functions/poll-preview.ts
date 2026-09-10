type EdgeContext = {
  next: () => Promise<Response>;
};

const POLL_TITLE = 'Availability Poll | kirolos.dev';
const POLL_DESCRIPTION = 'This link opens an availability poll for coordinating meeting times and collecting participants’ online and in-person availability.';

function escapeAttribute(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function withPollMetadata(html: string, requestUrl: string): string {
  const title = `<title>${POLL_TITLE}</title>`;
  const description = `<meta name="description" content="${POLL_DESCRIPTION}" />`;
  const socialMetadata = [
    '<meta name="robots" content="noindex, nofollow, noarchive" />',
    '<meta property="og:site_name" content="kirolos.dev" />',
    '<meta property="og:type" content="website" />',
    `<meta property="og:title" content="${POLL_TITLE}" />`,
    `<meta property="og:description" content="${POLL_DESCRIPTION}" />`,
    `<meta property="og:url" content="${escapeAttribute(requestUrl)}" />`,
    '<meta name="twitter:card" content="summary" />',
    `<meta name="twitter:title" content="${POLL_TITLE}" />`,
    `<meta name="twitter:description" content="${POLL_DESCRIPTION}" />`,
  ].join('\n    ');

  return html
    .replace(/<title>[\s\S]*?<\/title>/i, title)
    .replace(/<meta\s+name=["']description["'][\s\S]*?\/>/i, description)
    .replace('</head>', `    ${socialMetadata}\n  </head>`);
}

export default async (request: Request, context: EdgeContext): Promise<Response | undefined> => {
  if (request.method !== 'GET' && request.method !== 'HEAD') return;

  const response = await context.next();
  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.toLowerCase().includes('text/html')) return response;

  const html = withPollMetadata(await response.text(), request.url);
  const headers = new Headers(response.headers);
  headers.delete('content-length');

  return new Response(request.method === 'HEAD' ? null : html, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
};
