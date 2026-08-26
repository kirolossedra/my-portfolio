import type {
  MilestoneImageWriteInput,
  MilestoneSectionWriteInput,
  MilestoneWriteInput,
} from '../shared/milestone.ts';
import { HttpError } from './http.ts';

function asRecord(value: unknown, name: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new HttpError(400, 'invalid_payload', `${name} must be a JSON object.`);
  }
  return value as Record<string, unknown>;
}

function requiredString(record: Record<string, unknown>, key: string): string {
  const value = record[key];
  if (typeof value !== 'string' || !value.trim()) {
    throw new HttpError(400, 'invalid_payload', `${key} is required and must be a non-empty string.`);
  }
  return value.trim();
}

function optionalString(record: Record<string, unknown>, key: string): string | null | undefined {
  const value = record[key];
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== 'string') {
    throw new HttpError(400, 'invalid_payload', `${key} must be a string or null.`);
  }
  return value.trim() || null;
}

function integer(record: Record<string, unknown>, key: string, fallback?: number): number {
  const value = record[key];
  if (value === undefined && fallback !== undefined) return fallback;
  if (!Number.isInteger(value)) {
    throw new HttpError(400, 'invalid_payload', `${key} must be an integer.`);
  }
  return value as number;
}

function booleanValue(record: Record<string, unknown>, key: string, fallback?: boolean): boolean {
  const value = record[key];
  if (value === undefined && fallback !== undefined) return fallback;
  if (typeof value !== 'boolean') {
    throw new HttpError(400, 'invalid_payload', `${key} must be a boolean.`);
  }
  return value;
}

export function validateMilestoneWriteInput(value: unknown): MilestoneWriteInput {
  const record = asRecord(value, 'Milestone');
  const year = integer(record, 'year');
  const month = integer(record, 'month');

  if (year < 1900 || year > 2100) {
    throw new HttpError(400, 'invalid_payload', 'year must be between 1900 and 2100.');
  }
  if (month < 1 || month > 12) {
    throw new HttpError(400, 'invalid_payload', 'month must be between 1 and 12.');
  }

  const slug = requiredString(record, 'slug').toLowerCase();
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new HttpError(400, 'invalid_payload', 'slug must use lowercase letters, numbers, and single hyphens.');
  }

  return {
    slug,
    year,
    month,
    title: requiredString(record, 'title'),
    shortDescription: requiredString(record, 'shortDescription'),
    expandedDescription: optionalString(record, 'expandedDescription'),
    detailMarkdown: optionalString(record, 'detailMarkdown'),
    displayOrder: integer(record, 'displayOrder', 0),
    isPublished: booleanValue(record, 'isPublished', false),
  };
}

export function validateSectionsWriteInput(value: unknown): MilestoneSectionWriteInput[] {
  if (!Array.isArray(value)) {
    throw new HttpError(400, 'invalid_payload', 'Sections payload must be a JSON array.');
  }

  return value.map((item, index) => {
    const record = asRecord(item, `Section ${index + 1}`);
    return {
      heading: optionalString(record, 'heading'),
      bodyMarkdown: requiredString(record, 'bodyMarkdown'),
      displayOrder: integer(record, 'displayOrder', index),
    };
  });
}

export function validateImagesWriteInput(value: unknown): MilestoneImageWriteInput[] {
  if (!Array.isArray(value)) {
    throw new HttpError(400, 'invalid_payload', 'Images payload must be a JSON array.');
  }

  return value.map((item, index) => {
    const record = asRecord(item, `Image ${index + 1}`);
    return {
      r2Key: requiredString(record, 'r2Key'),
      altText: requiredString(record, 'altText'),
      caption: optionalString(record, 'caption'),
      displayOrder: integer(record, 'displayOrder', index),
      isCover: booleanValue(record, 'isCover', index === 0),
    };
  });
}
