export type Season = 'winter' | 'spring' | 'summer' | 'fall';

export function seasonForMonth(month: number): Season {
  if (month === 12 || month <= 2) return 'winter';
  if (month <= 5) return 'spring';
  if (month <= 8) return 'summer';
  return 'fall';
}
