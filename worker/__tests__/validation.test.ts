import { describe, expect, it } from 'vitest';
import { HttpError } from '../http.ts';
import { validateMilestoneWriteInput } from '../validation.ts';

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
