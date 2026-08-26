import { describe, expect, it } from 'vitest';
import { HttpError } from '../http.ts';
import {
  base64ByteSize,
  validateImageWriteInput,
  validateMilestoneWriteInput,
  validateOpinionModerationInput,
  validateOpinionSubmissionInput,
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


describe('opinion validation', () => {
  it('accepts a consented public opinion and trims fields', () => {
    const result = validateOpinionSubmissionInput({
      displayName: '  Ada  ',
      relationship: '  Collaborator  ',
      opinion: '  Thoughtful engineering partner.  ',
      consentToPublish: true,
      website: '',
    });

    expect(result.displayName).toBe('Ada');
    expect(result.relationship).toBe('Collaborator');
    expect(result.opinion).toBe('Thoughtful engineering partner.');
  });

  it('requires explicit publication consent', () => {
    expect(() => validateOpinionSubmissionInput({
      displayName: 'Ada',
      opinion: 'Thoughtful engineering partner.',
      consentToPublish: false,
    })).toThrow(HttpError);
  });

  it('rejects honeypot submissions', () => {
    expect(() => validateOpinionSubmissionInput({
      displayName: 'Bot',
      opinion: 'This is a spam submission body.',
      consentToPublish: true,
      website: 'https://spam.example',
    })).toThrow(HttpError);
  });

  it('accepts only explicit moderation outcomes', () => {
    expect(validateOpinionModerationInput({ status: 'approved' })).toEqual({ status: 'approved' });
    expect(() => validateOpinionModerationInput({ status: 'pending' })).toThrow(HttpError);
  });
});
