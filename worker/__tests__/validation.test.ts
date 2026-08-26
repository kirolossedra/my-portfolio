import { describe, expect, it } from 'vitest';
import { HttpError } from '../http.ts';
import {
  base64ByteSize,
  validateImageWriteInput,
  validateMilestoneWriteInput,
} from '../validation.ts';

describe('milestone input validation', () => {
  it('normalizes a valid milestone payload', () => {
    const result = validateMilestoneWriteInput({
      slug: 'First-Role',
      year: 2024,
      month: 9,
      title: 'First role',
      shortDescription: 'Short summary',
      isPublished: true,
    });

    expect(result.slug).toBe('first-role');
    expect(result.displayOrder).toBe(0);
    expect(result.isPublished).toBe(true);
  });

  it('rejects invalid calendar months', () => {
    expect(() => validateMilestoneWriteInput({
      slug: 'bad-month',
      year: 2024,
      month: 13,
      title: 'Bad',
      shortDescription: 'Bad month',
    })).toThrow(HttpError);
  });
});

describe('Base64 image validation', () => {
  it('calculates decoded byte size', () => {
    expect(base64ByteSize('AQID')).toBe(3);
  });

  it('accepts supported image MIME types with valid Base64', () => {
    const result = validateImageWriteInput({
      mimeType: 'IMAGE/PNG',
      base64Data: 'AQID',
      altText: 'Example image',
      isCover: true,
    });

    expect(result.mimeType).toBe('image/png');
    expect(result.base64Data).toBe('AQID');
    expect(result.isCover).toBe(true);
  });

  it('does not make a single-image POST a cover unless requested', () => {
    const result = validateImageWriteInput({
      mimeType: 'image/png',
      base64Data: 'AQID',
      altText: 'Example image',
    });

    expect(result.isCover).toBe(false);
  });

  it('rejects malformed Base64', () => {
    expect(() => validateImageWriteInput({
      mimeType: 'image/png',
      base64Data: 'not-base64!!!',
      altText: 'Broken',
    })).toThrow(HttpError);
  });
});
