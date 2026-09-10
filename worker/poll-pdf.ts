import type {
  AdminParticipantStatus,
  AdminPollDetail,
  AvailabilityMode,
  IntersectionSlot,
  ParticipantResponse,
} from '../shared/poll.ts';
import { computeIntersections, generateTimesForDefinition } from '../shared/poll.ts';

const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const MARGIN = 42;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const FOOTER_HEIGHT = 28;

const TEXT = [0.12, 0.12, 0.12] as const;
const MUTED = [0.38, 0.38, 0.38] as const;
const BORDER = [0.84, 0.84, 0.84] as const;
const PANEL = [0.965, 0.965, 0.955] as const;
const ACCENT = [0.72, 0.52, 0.12] as const;
const SUCCESS = [0.18, 0.46, 0.28] as const;
const WARNING = [0.64, 0.38, 0.08] as const;
const WHITE = [1, 1, 1] as const;

type PdfColor = readonly [number, number, number];
type PdfPage = { commands: string[]; y: number };
type ReportParticipant = AdminParticipantStatus & { excludedFromCalculations: boolean };
type ReportData = {
  participants: ReportParticipant[];
  calculationParticipants: AdminParticipantStatus[];
  calculationResponses: ParticipantResponse[];
  intersections: IntersectionSlot[];
  rankedSlots: IntersectionSlot[];
  responseCount: number;
  fullConsensusCount: number;
  bestAvailableCount: number;
};

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

function isTestParticipant(displayName: string): boolean {
  const normalized = displayName.trim().toLowerCase().replace(/\s+/g, ' ');
  return normalized === 'test participant' || normalized === 'test';
}

function formatDate(value: string): string {
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return value;
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Toronto',
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(Date.UTC(year, month - 1, day, 16)));
}

function formatTime(value: string): string {
  const [hoursText = '0', minutesText = '0'] = value.split(':');
  const hours = Number(hoursText);
  const suffix = hours >= 12 ? 'PM' : 'AM';
  return `${hours % 12 || 12}:${minutesText} ${suffix}`;
}

function formatSlotWindow(slot: IntersectionSlot): string {
  return `${formatDate(slot.date)} | ${formatTime(slot.startTime)}-${formatTime(slot.endTime)}`;
}

function modeLabel(mode: AvailabilityMode): string {
  if (mode === 'in_person') return 'In person';
  if (mode === 'online') return 'Online';
  return 'Either';
}

function buildReportData(poll: AdminPollDetail): ReportData {
  const participants = poll.participants.map((participant) => ({
    ...participant,
    excludedFromCalculations: isTestParticipant(participant.displayName),
  }));
  const calculationParticipants = participants.filter((participant) => !participant.excludedFromCalculations);
  const calculationIds = new Set(calculationParticipants.map((participant) => participant.id));
  const calculationResponses = poll.responses.filter((response) => calculationIds.has(response.participantId));
  const intersections = computeIntersections(poll.definition, calculationParticipants, calculationResponses);
  const rankedSlots = [...intersections]
    .filter((slot) => slot.availableCount > 0)
    .sort(
      (a, b) => b.availableCount - a.availableCount || b.percentage - a.percentage || a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime),
    );
  const responseCount = calculationParticipants.filter((participant) => participant.responded).length;
  const bestAvailableCount = rankedSlots[0]?.availableCount ?? 0;
  const fullConsensusCount = intersections.filter(
    (slot) => slot.totalParticipants > 0 && slot.availableCount === slot.totalParticipants,
  ).length;
  return {
    participants,
    calculationParticipants,
    calculationResponses,
    intersections,
    rankedSlots,
    responseCount,
    fullConsensusCount,
    bestAvailableCount,
  };
}

function textWidthApprox(text: string, size: number): number {
  return asciiPdfText(text).length * size * 0.52;
}

function wrapText(text: string, maxWidth: number, size: number): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [''];
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (line && textWidthApprox(candidate, size) > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function rgb(color: PdfColor, fill: boolean): string {
  return `${color[0]} ${color[1]} ${color[2]} ${fill ? 'rg' : 'RG'}`;
}

function rect(x: number, y: number, width: number, height: number, fill: PdfColor, stroke?: PdfColor): string[] {
  const commands = [rgb(fill, true)];
  if (stroke) commands.push(rgb(stroke, false));
  commands.push(`${x} ${y} ${width} ${height} re ${stroke ? 'B' : 'f'}`);
  return commands;
}

function line(x1: number, y1: number, x2: number, y2: number, color = BORDER, width = 0.7): string[] {
  return [rgb(color, false), `${width} w`, `${x1} ${y1} m ${x2} ${y2} l S`];
}

function textCommand(
  text: string,
  x: number,
  y: number,
  size: number,
  font: 'F1' | 'F2' = 'F1',
  color: PdfColor = TEXT,
): string[] {
  return [
    'BT',
    rgb(color, true),
    `/${font} ${size} Tf`,
    `1 0 0 1 ${x} ${y} Tm`,
    `(${asciiPdfText(text)}) Tj`,
    'ET',
  ];
}

function pageHeader(page: PdfPage, poll: AdminPollDetail): void {
  page.commands.push(...textCommand('KIROLOS.DEV / AVAILABILITY REPORT', MARGIN, PAGE_HEIGHT - 34, 8.5, 'F2', MUTED));
  const status = poll.status.toUpperCase();
  const statusWidth = Math.max(56, textWidthApprox(status, 8) + 20);
  page.commands.push(...rect(PAGE_WIDTH - MARGIN - statusWidth, PAGE_HEIGHT - 42, statusWidth, 20, PANEL, BORDER));
  page.commands.push(...textCommand(status, PAGE_WIDTH - MARGIN - statusWidth + 10, PAGE_HEIGHT - 36, 8, 'F2', ACCENT));
  page.commands.push(...line(MARGIN, PAGE_HEIGHT - 51, PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 51, BORDER));
  page.y = PAGE_HEIGHT - 76;
}

class PdfDocument {
  private readonly pages: PdfPage[] = [];
  private currentPage: PdfPage;

  constructor(private readonly poll: AdminPollDetail) {
    this.currentPage = this.newPage();
  }

  private newPage(): PdfPage {
    const page: PdfPage = { commands: [], y: PAGE_HEIGHT - 76 };
    this.pages.push(page);
    pageHeader(page, this.poll);
    return page;
  }

  private ensureSpace(height: number): void {
    if (this.currentPage.y - height < MARGIN + FOOTER_HEIGHT) this.currentPage = this.newPage();
  }

  gap(height: number): void {
    this.ensureSpace(height);
    this.currentPage.y -= height;
  }

  heading(text: string, size = 16): void {
    this.ensureSpace(size + 14);
    this.currentPage.commands.push(...textCommand(text, MARGIN, this.currentPage.y, size, 'F2', TEXT));
    this.currentPage.y -= size + 10;
  }

  paragraph(text: string, size = 9.5, color: PdfColor = MUTED): void {
    const lines = wrapText(text, CONTENT_WIDTH, size);
    const lineHeight = size + 4;
    this.ensureSpace(lines.length * lineHeight + 4);
    for (const item of lines) {
      this.currentPage.commands.push(...textCommand(item, MARGIN, this.currentPage.y, size, 'F1', color));
      this.currentPage.y -= lineHeight;
    }
  }

  metadata(items: Array<{ label: string; value: string }>): void {
    const columnWidth = CONTENT_WIDTH / Math.min(3, Math.max(1, items.length));
    const rows = Math.ceil(items.length / 3);
    const height = rows * 36 + 4;
    this.ensureSpace(height);
    const startY = this.currentPage.y;
    items.forEach((item, index) => {
      const column = index % 3;
      const row = Math.floor(index / 3);
      const x = MARGIN + column * columnWidth;
      const y = startY - row * 36;
      this.currentPage.commands.push(...textCommand(item.label.toUpperCase(), x, y, 7.5, 'F2', MUTED));
      this.currentPage.commands.push(...textCommand(item.value, x, y - 14, 9.2, 'F1', TEXT));
    });
    this.currentPage.y -= height;
  }

  cards(cards: Array<{ label: string; value: string; detail: string }>): void {
    const gap = 10;
    const width = (CONTENT_WIDTH - gap * 2) / 3;
    const height = 72;
    this.ensureSpace(height + 6);
    const y = this.currentPage.y - height;
    cards.slice(0, 3).forEach((card, index) => {
      const x = MARGIN + index * (width + gap);
      this.currentPage.commands.push(...rect(x, y, width, height, PANEL, BORDER));
      this.currentPage.commands.push(...textCommand(card.label.toUpperCase(), x + 12, y + 52, 7.5, 'F2', MUTED));
      this.currentPage.commands.push(...textCommand(card.value, x + 12, y + 29, 18, 'F2', TEXT));
      this.currentPage.commands.push(...textCommand(card.detail, x + 12, y + 13, 7.8, 'F1', MUTED));
    });
    this.currentPage.y = y - 8;
  }

  callout(title: string, lines: string[]): void {
    const wrapped = lines.flatMap((item) => wrapText(item, CONTENT_WIDTH - 28, 9));
    const height = 34 + wrapped.length * 13;
    this.ensureSpace(height + 8);
    const y = this.currentPage.y - height;
    this.currentPage.commands.push(...rect(MARGIN, y, CONTENT_WIDTH, height, [0.985, 0.975, 0.94], ACCENT));
    this.currentPage.commands.push(...textCommand(title, MARGIN + 14, y + height - 21, 10, 'F2', ACCENT));
    let lineY = y + height - 39;
    for (const item of wrapped) {
      this.currentPage.commands.push(...textCommand(item, MARGIN + 14, lineY, 9, 'F1', TEXT));
      lineY -= 13;
    }
    this.currentPage.y = y - 8;
  }

  slotRanking(slots: IntersectionSlot[], participantCount: number): void {
    if (slots.length === 0) {
      this.paragraph('No participant availability has been recorded for any generated slot.');
      return;
    }
    const shown = slots.slice(0, 6);
    for (const [index, slot] of shown.entries()) {
      const participantNames = slot.participantModes.map((entry) => `${entry.displayName} (${modeLabel(entry.mode)})`).join(', ');
      const wrappedNames = participantNames ? wrapText(participantNames, CONTENT_WIDTH - 28, 7.8).slice(0, 2) : ['Nobody selected this slot.'];
      const height = 48 + wrappedNames.length * 11;
      this.ensureSpace(height + 5);
      const y = this.currentPage.y - height;
      this.currentPage.commands.push(...rect(MARGIN, y, CONTENT_WIDTH, height, index === 0 ? [0.985, 0.975, 0.94] : WHITE, BORDER));
      this.currentPage.commands.push(...textCommand(`#${index + 1}`, MARGIN + 12, y + height - 22, 9, 'F2', index === 0 ? ACCENT : MUTED));
      this.currentPage.commands.push(...textCommand(formatSlotWindow(slot), MARGIN + 42, y + height - 22, 9.5, 'F2', TEXT));
      const countText = `${slot.availableCount}/${participantCount} available`;
      this.currentPage.commands.push(...textCommand(countText, PAGE_WIDTH - MARGIN - textWidthApprox(countText, 9) - 12, y + height - 22, 9, 'F2', slot.percentage === 100 ? SUCCESS : TEXT));

      const barX = MARGIN + 42;
      const barY = y + height - 38;
      const barWidth = CONTENT_WIDTH - 54;
      this.currentPage.commands.push(...rect(barX, barY, barWidth, 5, PANEL));
      if (slot.percentage > 0) this.currentPage.commands.push(...rect(barX, barY, barWidth * (slot.percentage / 100), 5, slot.percentage === 100 ? SUCCESS : ACCENT));

      let namesY = y + height - 53;
      for (const namesLine of wrappedNames) {
        this.currentPage.commands.push(...textCommand(namesLine, MARGIN + 42, namesY, 7.8, 'F1', MUTED));
        namesY -= 11;
      }
      this.currentPage.y = y - 5;
    }
  }

  participantTable(participants: ReportParticipant[]): void {
    const rowHeight = 22;
    const headerHeight = 24;
    this.ensureSpace(headerHeight + rowHeight * Math.min(8, participants.length) + 10);
    const drawHeader = (): void => {
      const y = this.currentPage.y - headerHeight;
      this.currentPage.commands.push(...rect(MARGIN, y, CONTENT_WIDTH, headerHeight, PANEL, BORDER));
      this.currentPage.commands.push(...textCommand('PARTICIPANT', MARGIN + 10, y + 8, 7.5, 'F2', MUTED));
      this.currentPage.commands.push(...textCommand('STATUS', MARGIN + 320, y + 8, 7.5, 'F2', MUTED));
      this.currentPage.commands.push(...textCommand('REPORT TREATMENT', MARGIN + 410, y + 8, 7.5, 'F2', MUTED));
      this.currentPage.y = y;
    };
    drawHeader();
    for (const participant of participants) {
      if (this.currentPage.y - rowHeight < MARGIN + FOOTER_HEIGHT) {
        this.currentPage = this.newPage();
        drawHeader();
      }
      const y = this.currentPage.y - rowHeight;
      const status = participant.responded ? 'Responded' : 'Awaiting';
      const statusColor = participant.responded ? SUCCESS : WARNING;
      const treatment = participant.excludedFromCalculations ? 'Test data - excluded' : 'Included';
      this.currentPage.commands.push(...line(MARGIN, y, PAGE_WIDTH - MARGIN, y, BORDER, 0.5));
      this.currentPage.commands.push(...textCommand(participant.displayName, MARGIN + 10, y + 7, 8.5, 'F1', TEXT));
      this.currentPage.commands.push(...textCommand(status, MARGIN + 320, y + 7, 8, 'F2', statusColor));
      this.currentPage.commands.push(...textCommand(treatment, MARGIN + 410, y + 7, 7.8, participant.excludedFromCalculations ? 'F2' : 'F1', participant.excludedFromCalculations ? ACCENT : MUTED));
      this.currentPage.y = y;
    }
    this.currentPage.y -= 8;
  }

  availabilityByDate(slots: IntersectionSlot[], totalParticipants: number): void {
    const dates = [...new Set(slots.map((slot) => slot.date))];
    for (const date of dates) {
      const dateSlots = slots.filter((slot) => slot.date === date).sort((a, b) => a.startTime.localeCompare(b.startTime));
      const sectionHeight = 30;
      const rowHeight = 21;
      this.ensureSpace(sectionHeight + rowHeight * Math.min(5, dateSlots.length) + 8);
      this.currentPage.commands.push(...textCommand(formatDate(date), MARGIN, this.currentPage.y, 11, 'F2', TEXT));
      this.currentPage.y -= 18;
      const headerY = this.currentPage.y - 20;
      this.currentPage.commands.push(...rect(MARGIN, headerY, CONTENT_WIDTH, 20, PANEL, BORDER));
      const columns = [MARGIN + 10, MARGIN + 150, MARGIN + 260, MARGIN + 338, MARGIN + 414, MARGIN + 474];
      const headers = ['TIME', 'AVAILABILITY', 'TOTAL', 'IN PERSON', 'ONLINE', 'EITHER'];
      headers.forEach((header, index) => {
        const x = columns[index];
        if (x !== undefined) this.currentPage.commands.push(...textCommand(header, x, headerY + 6, 7.1, 'F2', MUTED));
      });
      this.currentPage.y = headerY;

      for (const slot of dateSlots) {
        if (this.currentPage.y - rowHeight < MARGIN + FOOTER_HEIGHT) {
          this.currentPage = this.newPage();
          this.currentPage.commands.push(...textCommand(`${formatDate(date)} (continued)`, MARGIN, this.currentPage.y, 11, 'F2', TEXT));
          this.currentPage.y -= 22;
        }
        const y = this.currentPage.y - rowHeight;
        this.currentPage.commands.push(...line(MARGIN, y, PAGE_WIDTH - MARGIN, y, BORDER, 0.45));
        this.currentPage.commands.push(...textCommand(`${formatTime(slot.startTime)}-${formatTime(slot.endTime)}`, columns[0] ?? MARGIN, y + 7, 8, 'F1', TEXT));
        const barX = columns[1] ?? MARGIN + 150;
        const barWidth = 88;
        this.currentPage.commands.push(...rect(barX, y + 8, barWidth, 5, PANEL));
        if (slot.percentage > 0) this.currentPage.commands.push(...rect(barX, y + 8, barWidth * (slot.percentage / 100), 5, slot.percentage === 100 ? SUCCESS : ACCENT));
        this.currentPage.commands.push(...textCommand(`${slot.percentage}%`, barX, y + 1, 6.8, 'F1', MUTED));
        this.currentPage.commands.push(...textCommand(`${slot.availableCount}/${totalParticipants}`, columns[2] ?? MARGIN + 260, y + 7, 8, 'F2', TEXT));
        this.currentPage.commands.push(...textCommand(String(slot.inPersonCount), columns[3] ?? MARGIN + 338, y + 7, 8, 'F1', TEXT));
        this.currentPage.commands.push(...textCommand(String(slot.onlineCount), columns[4] ?? MARGIN + 414, y + 7, 8, 'F1', TEXT));
        this.currentPage.commands.push(...textCommand(String(slot.eitherCount), columns[5] ?? MARGIN + 474, y + 7, 8, 'F1', TEXT));
        this.currentPage.y = y;
      }
      this.currentPage.y -= 12;
    }
  }

  buildStreams(): string[] {
    return this.pages.map((page, index) => {
      const commands = [...page.commands];
      commands.push(...line(MARGIN, 33, PAGE_WIDTH - MARGIN, 33, BORDER, 0.5));
      commands.push(...textCommand(`Page ${index + 1} of ${this.pages.length}`, MARGIN, 19, 7.5, 'F1', MUTED));
      commands.push(...textCommand('Generated from the live poll data at kirolos.dev', PAGE_WIDTH - MARGIN - 190, 19, 7.5, 'F1', MUTED));
      return commands.join('\n');
    });
  }
}

function assemblePdf(streams: string[]): ArrayBuffer {
  const objects: string[] = [];
  const catalogId = 1;
  const pagesId = 2;
  const regularFontId = 3;
  const boldFontId = 4;
  const pageIds = streams.map((_, index) => 5 + index * 2);
  const contentIds = streams.map((_, index) => 6 + index * 2);

  objects[catalogId] = `<< /Type /Catalog /Pages ${pagesId} 0 R >>`;
  objects[pagesId] = `<< /Type /Pages /Count ${streams.length} /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] >>`;
  objects[regularFontId] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>';
  objects[boldFontId] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>';

  streams.forEach((stream, index) => {
    const pageId = pageIds[index];
    const contentId = contentIds[index];
    if (!pageId || !contentId) return;
    objects[pageId] = `<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 ${regularFontId} 0 R /F2 ${boldFontId} 0 R >> >> /Contents ${contentId} 0 R >>`;
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
  return new TextEncoder().encode(pdf).buffer;
}

export function renderPollPdf(poll: AdminPollDetail): ArrayBuffer {
  const report = buildReportData(poll);
  const participantCount = report.calculationParticipants.length;
  const bestPercentage = participantCount === 0 ? 0 : Math.round((report.bestAvailableCount / participantCount) * 100);
  const document = new PdfDocument(poll);

  document.heading(poll.title, 19);
  document.paragraph(poll.description || 'Availability report for this poll.');
  document.gap(4);
  document.metadata([
    { label: 'Timezone', value: poll.timezone },
    { label: 'Slot length', value: `${poll.slotWidthMinutes} minutes` },
    { label: 'Poll dates', value: `${poll.definition.dates.length} day${poll.definition.dates.length === 1 ? '' : 's'}` },
    { label: 'Daily rows', value: String(generateTimesForDefinition(poll.definition).length) },
    { label: 'Committee size', value: String(participantCount) },
    { label: 'Status', value: poll.status.toUpperCase() },
  ]);

  document.cards([
    {
      label: 'Responses',
      value: `${report.responseCount}/${participantCount}`,
      detail: 'Real participants responded',
    },
    {
      label: 'Best overlap',
      value: `${report.bestAvailableCount}/${participantCount}`,
      detail: `${bestPercentage}% of committee`,
    },
    {
      label: 'Full consensus',
      value: String(report.fullConsensusCount),
      detail: 'Slots available to everyone',
    },
  ]);

  if (poll.finalization) {
    document.callout('FINALIZED MEETING', [
      `${formatDate(poll.finalization.date)} | ${formatTime(poll.finalization.startTime)}-${formatTime(poll.finalization.endTime)} (${poll.finalization.timezone})`,
      ...(poll.finalization.location ? [`Location: ${poll.finalization.location}`] : []),
      ...(poll.finalization.meetingLink ? [`Meeting link: ${poll.finalization.meetingLink}`] : []),
      ...(poll.finalization.note ? [`Note: ${poll.finalization.note}`] : []),
    ]);
  }

  document.heading('Best meeting windows', 13);
  document.paragraph('Ranked by the number of real participants available. Test-participant data does not affect counts, percentages, or ranking.', 8.5, MUTED);
  document.slotRanking(report.rankedSlots, participantCount);

  document.gap(4);
  document.heading('Participation', 13);
  document.paragraph('Response status is shown for transparency. Any test participant remains visible but is explicitly excluded from report calculations.', 8.5, MUTED);
  document.participantTable(report.participants);

  document.heading('Detailed availability by date', 13);
  document.paragraph('Each row combines committee availability with a visual overlap bar and mode breakdown. The denominator includes only real participants.', 8.5, MUTED);
  document.availabilityByDate(report.intersections, participantCount);

  return assemblePdf(document.buildStreams());
}
