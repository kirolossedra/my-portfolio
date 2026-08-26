import type {
  MilestoneImageWriteInput,
  MilestoneSectionWriteInput,
  MilestoneWriteInput,
} from '../shared/milestone.ts';
import { HttpError } from './http.ts';

export const ALLOWED_IMAGE_MIME_TYPES = new Set([
  'image/avif',
  'image/gif',
  'image/jpeg',
  'image/png',
  'image/webp',
]);

// D1 rows are limited to 2 MB. Base64 expands binary input by roughly one third,
// so 1.25 MiB leaves practical room for the encoded image plus row metadata.
export const MAX_IMAGE_BYTES = 1_310_720;

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

function normalizedMimeType(value: string): string {
  return value.toLowerCase().split(';', 1)[0]?.trim() ?? '';
}

export function base64ByteSize(value: string): number {
  const base64 = value.replace(/\s+/g, '');
  if (!base64 || base64.length % 4 !== 0 || !/^[A-Za-z0-9+/]*={0,2}$/.test(base64)) {
    throw new HttpError(400, 'invalid_image_base64', 'base64Data must contain valid standard Base64 data.');
  }

  const padding = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0;
  const byteSize = (base64.length / 4) * 3 - padding;
  if (byteSize <= 0) {
    throw new HttpError(400, 'invalid_image_base64', 'base64Data must not decode to an empty image.');
  }
  return byteSize;
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

export function validateImageWriteInput(
  value: unknown,
  defaultOrder = 0,
  defaultCover = false,
): MilestoneImageWriteInput {
  const record = asRecord(value, 'Image');
  const mimeType = normalizedMimeType(requiredString(record, 'mimeType'));
  if (!ALLOWED_IMAGE_MIME_TYPES.has(mimeType)) {
    throw new HttpError(415, 'unsupported_media_type', 'Milestone images must be AVIF, GIF, JPEG, PNG, or WebP.');
  }

  const base64Data = requiredString(record, 'base64Data').replace(/\s+/g, '');
  const byteSize = base64ByteSize(base64Data);
  if (byteSize > MAX_IMAGE_BYTES) {
    throw new HttpError(
      413,
      'media_too_large',
      `Milestone images must be ${MAX_IMAGE_BYTES} bytes or smaller before Base64 encoding.`,
    );
  }

  return {
    mimeType,
    base64Data,
    altText: requiredString(record, 'altText'),
    caption: optionalString(record, 'caption'),
    displayOrder: integer(record, 'displayOrder', defaultOrder),
    isCover: booleanValue(record, 'isCover', defaultCover),
  };
}

export function validateImagesWriteInput(value: unknown): MilestoneImageWriteInput[] {
  if (!Array.isArray(value)) {
    throw new HttpError(400, 'invalid_payload', 'Images payload must be a JSON array.');
  }

  const images = value.map((item, index) => validateImageWriteInput(item, index, index === 0));
  if (images.filter((image) => image.isCover).length > 1) {
    throw new HttpError(400, 'multiple_cover_images', 'Only one image can be marked as the cover image.');
  }
  return images;
}
