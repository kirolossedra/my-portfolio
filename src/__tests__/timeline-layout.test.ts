import { describe, expect, it } from 'vitest';
import { resolveTimelineLabelLayout } from '../lib/timeline-layout.ts';

describe('mobile timeline label layout', () => {
  it('keeps close chronological anchors unchanged while separating readable cards', () => {
    const layout = resolveTimelineLabelLayout([
      { id: 1, anchorY: 110, height: 150 },
      { id: 2, anchorY: 138, height: 150 },
    ]);

    expect(layout.offsets[1]).toBe(-18);
    expect(layout.offsets[2]).toBeGreaterThan(100);
    expect(138 - 110).toBe(28);
  });

  it('does not unnecessarily move cards when timeline anchors are already far apart', () => {
    const layout = resolveTimelineLabelLayout([
      { id: 1, anchorY: 110, height: 120 },
      { id: 2, anchorY: 420, height: 120 },
    ]);

    expect(layout.offsets[1]).toBe(-18);
    expect(layout.offsets[2]).toBe(-18);
  });

  it('stacks same-month milestones deterministically without moving their dots', () => {
    const layout = resolveTimelineLabelLayout([
      { id: 8, anchorY: 200, height: 100 },
      { id: 4, anchorY: 200, height: 100 },
    ]);

    expect(layout.offsets[4]).toBe(-18);
    expect(layout.offsets[8]).toBe(110);
  });
});
