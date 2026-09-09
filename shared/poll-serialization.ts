import { POLL_TIMEZONE, PollDefinitionError, type PollDefinition } from './poll-types.ts';
import { validatePollDefinition } from './poll-validation.ts';

export function pollDefinitionToJson(definition: PollDefinition): string {
  return `${JSON.stringify(definition, null, 2)}\n`;
}

function escapeXml(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;').replaceAll("'", '&apos;');
}

export function pollDefinitionToXml(definition: PollDefinition): string {
  const participants = definition.participantNames.map((name) => `    <participant>${escapeXml(name)}</participant>`).join('\n');
  const dates = definition.dates.map((date) => `    <date>${date}</date>`).join('\n');
  const ranges = definition.timeRanges.map((range) => `    <timeRange start="${range.startTime}" end="${range.endTime}" />`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<poll schemaVersion="1">\n  <title>${escapeXml(definition.title)}</title>\n  <description>${escapeXml(definition.description)}</description>\n  <timezone>${definition.timezone}</timezone>\n  <slotWidthMinutes>${definition.slotWidthMinutes}</slotWidthMinutes>\n  <participants>\n${participants}\n  </participants>\n  <dates>\n${dates}\n  </dates>\n  <timeRanges>\n${ranges}\n  </timeRanges>\n</poll>\n`;
}

function decodeXml(value: string): string {
  return value.replace(/&(?:#(\d+)|#x([0-9a-fA-F]+)|amp|lt|gt|quot|apos);/g, (entity, decimal: string | undefined, hex: string | undefined) => {
    if (decimal) return String.fromCodePoint(Number(decimal));
    if (hex) return String.fromCodePoint(Number.parseInt(hex, 16));
    if (entity === '&amp;') return '&';
    if (entity === '&lt;') return '<';
    if (entity === '&gt;') return '>';
    if (entity === '&quot;') return '"';
    if (entity === '&apos;') return "'";
    return entity;
  });
}

function xmlSection(source: string, tag: string, required = true): string {
  const match = source.match(new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  if (!match) {
    if (!required) return '';
    throw new PollDefinitionError(`XML is missing <${tag}>.`);
  }
  return match[1] ?? '';
}
function xmlText(source: string, tag: string, required = true): string {
  return decodeXml(xmlSection(source, tag, required).trim());
}
function xmlAttribute(source: string, name: string): string | undefined {
  const match = source.match(new RegExp(`\\b${name}\\s*=\\s*(["'])(.*?)\\1`, 'i'));
  return match?.[2] ? decodeXml(match[2]) : undefined;
}

export function parsePollXml(source: string): PollDefinition {
  if (typeof source !== 'string' || !source.trim()) throw new PollDefinitionError('XML poll definition is empty.');
  if (/<!DOCTYPE|<!ENTITY/i.test(source)) throw new PollDefinitionError('DOCTYPE and ENTITY declarations are not supported in poll XML.');
  const withoutDeclaration = source.replace(/^\s*<\?xml[\s\S]*?\?>\s*/i, '');
  const root = withoutDeclaration.match(/^\s*<poll\b([^>]*)>([\s\S]*?)<\/poll>\s*$/i);
  if (!root) throw new PollDefinitionError('XML root element must be <poll>.');
  const rootAttributes = root[1] ?? '';
  const body = root[2] ?? '';
  const participantBody = xmlSection(body, 'participants');
  const dateBody = xmlSection(body, 'dates');
  const rangeBody = xmlSection(body, 'timeRanges');
  const participantNames = [...participantBody.matchAll(/<participant\b[^>]*>([\s\S]*?)<\/participant>/gi)]
    .map((match) => decodeXml((match[1] ?? '').trim()));
  const dates = [...dateBody.matchAll(/<date\b[^>]*>([\s\S]*?)<\/date>/gi)]
    .map((match) => decodeXml((match[1] ?? '').trim()));
  const timeRanges = [...rangeBody.matchAll(/<timeRange\b([^>]*)\/\s*>/gi)].map((match) => ({
    startTime: xmlAttribute(match[1] ?? '', 'start') ?? '',
    endTime: xmlAttribute(match[1] ?? '', 'end') ?? '',
  }));
  return validatePollDefinition({
    schemaVersion: Number(xmlAttribute(rootAttributes, 'schemaVersion') ?? '1'),
    title: xmlText(body, 'title'),
    description: xmlText(body, 'description', false),
    timezone: xmlText(body, 'timezone') || POLL_TIMEZONE,
    participantNames,
    dates,
    timeRanges,
    slotWidthMinutes: Number(xmlText(body, 'slotWidthMinutes')),
  });
}
