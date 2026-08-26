export interface MilestoneDate {
  year: number;
  month: number;
}

export interface TimelineMilestone {
  id: number;
  slug: string;
  date: MilestoneDate;
  title: string;
  summary: string;
  description: string;
  imageSrc: string | null;
  imageAlt: string;
}

export interface MilestoneImage {
  id: number;
  imageSrc: string;
  mimeType: string;
  byteSize: number;
  altText: string;
  caption: string | null;
  displayOrder: number;
  isCover: boolean;
}

export interface MilestoneSection {
  id: number;
  heading: string | null;
  bodyMarkdown: string;
  displayOrder: number;
}

export interface MilestoneDetail extends TimelineMilestone {
  detailMarkdown: string | null;
  images: MilestoneImage[];
  sections: MilestoneSection[];
}

export interface AdminMilestoneSummary extends TimelineMilestone {
  displayOrder: number;
  isPublished: boolean;
  publishedAt: string | null;
}

export interface ApiListResponse<T> {
  data: T[];
}

export interface ApiItemResponse<T> {
  data: T;
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
  };
}

export interface MilestoneWriteInput {
  slug: string;
  year: number;
  month: number;
  title: string;
  shortDescription: string;
  expandedDescription?: string | null;
  detailMarkdown?: string | null;
  displayOrder?: number;
  isPublished?: boolean;
}

export interface MilestoneSectionWriteInput {
  heading?: string | null;
  bodyMarkdown: string;
  displayOrder?: number;
}

export interface MilestoneImageWriteInput {
  mimeType: string;
  base64Data: string;
  altText: string;
  caption?: string | null;
  displayOrder?: number;
  isCover?: boolean;
}
