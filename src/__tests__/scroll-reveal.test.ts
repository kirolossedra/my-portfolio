import { describe, expect, it } from 'vitest';
import { autoScrollDistance, skillRevealLine, shouldRevealSkill } from '../lib/scroll-reveal.ts';

describe('skill scroll reveal', () => {
  it('reveals once the progress line reaches the item', () => {
    expect(shouldRevealSkill(700, skillRevealLine(0, 1000))).toBe(true);
    expect(shouldRevealSkill(900, skillRevealLine(0, 1000))).toBe(false);
  });

  it('is reversible when the user scrolls back up', () => {
    const itemCenter = 1300;
    expect(shouldRevealSkill(itemCenter, skillRevealLine(800, 1000))).toBe(true);
    expect(shouldRevealSkill(itemCenter, skillRevealLine(300, 1000))).toBe(false);
  });

  it('keeps autoscroll time-proportional when animation frames are throttled', () => {
    expect(autoScrollDistance(1000, 26)).toBe(26);
    expect(autoScrollDistance(2500, 26)).toBe(65);
  });

  it('does not scroll backward for a negative elapsed time', () => {
    expect(autoScrollDistance(-100, 26)).toBe(0);
  });
});
