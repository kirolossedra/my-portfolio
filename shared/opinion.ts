export type OpinionStatus = 'pending' | 'approved' | 'rejected';

export interface PublicOpinion {
  id: number;
  displayName: string;
  relationship: string | null;
  opinion: string;
  createdAt: string;
}

export interface OpinionSubmissionInput {
  displayName: string;
  relationship?: string | null;
  opinion: string;
  consentToPublish: boolean;
  website?: string;
}

export interface OpinionSubmissionResponse {
  id: number;
  status: 'pending';
}

export interface AdminOpinion extends PublicOpinion {
  status: OpinionStatus;
  reviewedAt: string | null;
}

export interface OpinionModerationInput {
  status: Exclude<OpinionStatus, 'pending'>;
}
