import { describe, expect, it } from 'vitest';
import { buildEqualTimelineLayout } from '../lib/timeline-layout.ts';

describe('equal milestone timeline layout', () => {
  it('uses exactly the same gap between every milestone dot', () => {
    const layout = buildEqualTimelineLayout(5, {
      topPadding: 100,
      gap: 220,
      bottomPadding: 140,
    });

    expect(layout.positions).toEqual([100, 320, 540, 760, 980]);
    expect(layout.positions.slice(1).map((position, index) => position - layout.positions[index]!))
      .toEqual([220, 220, 220, 220]);
  });

  it('gives separate equal-spaced positions even when milestones share the same month', () => {
    const layout = buildEqualTimelineLayout(3, { gap: 200 });

    expect(layout.positions[1]! - layout.positions[0]!).toBe(200);
    expect(layout.positions[2]! - layout.positions[1]!).toBe(200);
  });

  it('returns enough canvas height for the final milestone and bottom breathing room', () => {
    const layout = buildEqualTimelineLayout(4, {
      topPadding: 110,
      gap: 220,
      bottomPadding: 150,
    });

    expect(layout.positions.at(-1)).toBe(770);
    expect(layout.height).toBe(920);
  });

  it('handles an empty timeline without creating phantom space', () => {
    expect(buildEqualTimelineLayout(0)).toEqual({ positions: [], height: 0 });
  });
});
