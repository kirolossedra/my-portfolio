import { describe, expect, it } from 'vitest';
import { seasonForMonth } from '../lib/season-utils.ts';

describe('seasonForMonth', () => {
  it('maps calendar months to four seasonal transitions', () => {
    expect(seasonForMonth(1)).toBe('winter');
    expect(seasonForMonth(4)).toBe('spring');
    expect(seasonForMonth(7)).toBe('summer');
    expect(seasonForMonth(10)).toBe('fall');
    expect(seasonForMonth(12)).toBe('winter');
  });
});
