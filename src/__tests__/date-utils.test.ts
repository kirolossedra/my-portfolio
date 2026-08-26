import { describe, expect, it } from 'vitest';
import { monthIndex, timelinePosition } from '../lib/date-utils.ts';

describe('timeline date utilities', () => {
  it('converts year and month to a monotonically increasing month index', () => {
    expect(monthIndex({ year: 2024, month: 1 })).toBe(2024 * 12);
    expect(monthIndex({ year: 2024, month: 12 })).toBe(2024 * 12 + 11);
  });

  it('makes visual distance proportional to calendar-month distance', () => {
    const first = { year: 2020, month: 1 };
    expect(timelinePosition({ year: 2020, month: 7 }, first, 14)).toBe(6 * 14);
    expect(timelinePosition({ year: 2021, month: 1 }, first, 14)).toBe(12 * 14);
  });
});
