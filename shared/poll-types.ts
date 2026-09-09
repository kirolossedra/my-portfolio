export const POLL_TIMEZONE = 'America/Toronto' as const;
export const POLL_STATUSES = ['draft', 'open', 'closed', 'finalized'] as const;
export const AVAILABILITY_MODES = ['online', 'in_person', 'either'] as const;

export type PollStatus = (typeof POLL_STATUSES)[number];
export type AvailabilityMode = (typeof AVAILABILITY_MODES)[number];

export type PollTimeRange = { startTime: string; endTime: string };

export type PollDefinition = {
  schemaVersion: 1;
  title: string;
  description: string;
  timezone: typeof POLL_TIMEZONE;
  participantNames: string[];
  dates: string[];
  timeRanges: PollTimeRange[];
  slotWidthMinutes: number;
};

export type PollSlot = { date: string; startTime: string; endTime: string };
export type ExpectedParticipant = { id: number; displayName: string; sortOrder: number };
export type AvailabilitySelection = { date: string; slotStart: string; mode: AvailabilityMode };
export type ParticipantResponse = {
  participantId: number;
  revision: number;
  createdAt: string;
  updatedAt: string;
  selections: AvailabilitySelection[];
};
export type PollFinalization = {
  date: string;
  startTime: string;
  endTime: string;
  timezone: typeof POLL_TIMEZONE;
  location: string | null;
  meetingLink: string | null;
  note: string | null;
};
export type PublicPoll = {
  publicToken: string;
  title: string;
  description: string;
  timezone: typeof POLL_TIMEZONE;
  status: Exclude<PollStatus, 'draft'>;
  slotWidthMinutes: number;
  dates: string[];
  timeRanges: PollTimeRange[];
  participants: ExpectedParticipant[];
  finalization: PollFinalization | null;
};
export type AdminParticipantStatus = ExpectedParticipant & {
  responded: boolean;
  responseRevision: number | null;
  updatedAt: string | null;
};
export type AdminPollSummary = {
  id: number;
  publicToken: string;
  title: string;
  description: string;
  timezone: typeof POLL_TIMEZONE;
  status: PollStatus;
  slotWidthMinutes: number;
  participantCount: number;
  responseCount: number;
  createdAt: string;
  updatedAt: string;
  finalization: PollFinalization | null;
};
export type AdminPollDetail = AdminPollSummary & {
  definition: PollDefinition;
  participants: AdminParticipantStatus[];
  responses: ParticipantResponse[];
};
export type IntersectionSlot = PollSlot & {
  availableCount: number;
  totalParticipants: number;
  percentage: number;
  onlineCount: number;
  inPersonCount: number;
  eitherCount: number;
  participantModes: Array<{ participantId: number; displayName: string; mode: AvailabilityMode }>;
};
export type IntersectionFilter =
  | { kind: 'all' }
  | { kind: 'full' }
  | { kind: 'threshold'; percentage: number }
  | { kind: 'highest_below_full' };
export type ParticipantResponseWriteInput = {
  participantId: number;
  revision: number | null;
  selections: AvailabilitySelection[];
};
export type FinalizePollInput = {
  date: string;
  startTime: string;
  location?: string | null;
  meetingLink?: string | null;
  note?: string | null;
};

export class PollDefinitionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PollDefinitionError';
  }
}
