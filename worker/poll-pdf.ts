import type { AdminPollDetail, IntersectionSlot } from '../shared/poll.ts';
import { computeIntersections, generateTimesForDefinition } from '../shared/poll.ts';

const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const MARGIN = 46;
const LINE_HEIGHT = 15;
const MAX_LINES = 44;

function asciiPdfText(value: string): string {
  return value
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, '-')
    .replace(/…/g, '...')
    .replace(/•/g, '*')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x20-\x7E]/g, '?')
    .replaceAll('\\', '\\\\')
    .replaceAll('(', '\\(')
    .replaceAll(')', '\\)');
}

function wrap(text: string, width = 82): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [''];
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > width && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function formatSlot(slot: IntersectionSlot): string {
  const modes = `in person ${slot.inPersonCount}, online ${slot.onlineCount}, either ${slot.eitherCount}`;
  return `${slot.date} ${slot.startTime}-${slot.endTime} | ${slot.availableCount}/${slot.totalParticipants} (${slot.percentage}%) | ${modes}`;
}

function pollLines(poll: AdminPollDetail): string[] {
  const intersections = computeIntersections(poll.definition, poll.participants, poll.responses)
    .sort((a, b) => b.availableCount - a.availableCount || a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));
  const lines = [
    'KIROLOS.DEV AVAILABILITY POLL',
    '',
    poll.title,
    ...wrap(poll.description || 'No description provided.'),
    '',
    `Status: ${poll.status.toUpperCase()}`,
    `Timezone: ${poll.timezone}`,
    `Slot width: ${poll.slotWidthMinutes} minutes`,
    `Dates: ${poll.definition.dates.join(', ')}`,
    `Time ranges: ${poll.definition.timeRanges.map((range) => `${range.startTime}-${range.endTime}`).join(', ')}`,
    `Generated rows per date: ${generateTimesForDefinition(poll.definition).length}`,
    '',
    'EXPECTED PARTICIPANTS / RESPONSE STATUS',
    ...poll.participants.map((participant) => `${participant.responded ? '[x]' : '[ ]'} ${participant.displayName}${participant.updatedAt ? ` - updated ${participant.updatedAt}` : ''}`),
    '',
  ];
  if (poll.finalization) {
    lines.push(
      'FINALIZED MEETING',
      `${poll.finalization.date} ${poll.finalization.startTime}-${poll.finalization.endTime} (${poll.finalization.timezone})`,
      ...(poll.finalization.location ? [`Location: ${poll.finalization.location}`] : []),
      ...(poll.finalization.meetingLink ? [`Meeting link: ${poll.finalization.meetingLink}`] : []),
      ...(poll.finalization.note ? wrap(`Note: ${poll.finalization.note}`) : []),
      '',
    );
  }
  lines.push('STRONGEST AVAILABILITY SLOTS');
  if (intersections.length === 0) {
    lines.push('No generated slots.');
  } else {
    const highest = intersections[0]?.availableCount ?? 0;
    const strongest = intersections.filter((slot) => slot.availableCount === highest).slice(0, 12);
    lines.push(...strongest.map(formatSlot));
  }
  lines.push('', 'AVAILABILITY MATRIX SUMMARY');
  for (const slot of intersections) lines.push(formatSlot(slot));
  return lines;
}

function pageStream(lines: string[], pageNumber: number, totalPages: number): string {
  const commands = [
    'BT',
    '/F1 10 Tf',
    `1 0 0 1 ${MARGIN} ${PAGE_HEIGHT - MARGIN} Tm`,
  ];
  lines.forEach((line, index) => {
    if (index > 0) commands.push(`0 -${LINE_HEIGHT} Td`);
    commands.push(`(${asciiPdfText(line)}) Tj`);
  });
  commands.push(`0 -${LINE_HEIGHT * 1.6} Td`, `/F1 8 Tf`, `(Page ${pageNumber} of ${totalPages}) Tj`, 'ET');
  return commands.join('\n');
}

export function renderPollPdf(poll: AdminPollDetail): Uint8Array {
  const lines = pollLines(poll);
  const pages: string[][] = [];
  for (let index = 0; index < lines.length; index += MAX_LINES) pages.push(lines.slice(index, index + MAX_LINES));
  if (pages.length === 0) pages.push(['Availability poll']);

  const objects: string[] = [];
  const catalogId = 1;
  const pagesId = 2;
  const fontId = 3;
  const pageIds = pages.map((_, index) => 4 + index * 2);
  const contentIds = pages.map((_, index) => 5 + index * 2);

  objects[catalogId] = `<< /Type /Catalog /Pages ${pagesId} 0 R >>`;
  objects[pagesId] = `<< /Type /Pages /Count ${pages.length} /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] >>`;
  objects[fontId] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>';

  pages.forEach((page, index) => {
    const pageId = pageIds[index];
    const contentId = contentIds[index];
    if (!pageId || !contentId) return;
    const stream = pageStream(page, index + 1, pages.length);
    objects[pageId] = `<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 ${fontId} 0 R >> >> /Contents ${contentId} 0 R >>`;
    objects[contentId] = `<< /Length ${new TextEncoder().encode(stream).length} >>\nstream\n${stream}\nendstream`;
  });

  let pdf = '%PDF-1.4\n%kirolos.dev\n';
  const offsets: number[] = [0];
  for (let id = 1; id < objects.length; id += 1) {
    const object = objects[id];
    if (!object) continue;
    offsets[id] = new TextEncoder().encode(pdf).length;
    pdf += `${id} 0 obj\n${object}\nendobj\n`;
  }
  const xrefOffset = new TextEncoder().encode(pdf).length;
  pdf += `xref\n0 ${objects.length}\n0000000000 65535 f \n`;
  for (let id = 1; id < objects.length; id += 1) {
    const offset = offsets[id] ?? 0;
    pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length} /Root ${catalogId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  return new TextEncoder().encode(pdf);
}
