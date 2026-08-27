export interface EqualTimelineLayoutOptions {
  topPadding?: number;
  gap?: number;
  bottomPadding?: number;
}

export interface EqualTimelineLayout {
  positions: number[];
  height: number;
}

const DEFAULT_TOP_PADDING = 110;
const DEFAULT_GAP = 220;
const DEFAULT_BOTTOM_PADDING = 150;

/**
 * Places milestones at a fixed center-to-center distance. Calendar dates still
 * determine chronological ordering, but no longer distort the visual spacing.
 */
export function buildEqualTimelineLayout(
  count: number,
  options: EqualTimelineLayoutOptions = {},
): EqualTimelineLayout {
  const safeCount = Math.max(0, Math.floor(count));
  const topPadding = Math.max(0, options.topPadding ?? DEFAULT_TOP_PADDING);
  const gap = Math.max(1, options.gap ?? DEFAULT_GAP);
  const bottomPadding = Math.max(0, options.bottomPadding ?? DEFAULT_BOTTOM_PADDING);

  if (safeCount === 0) {
    return { positions: [], height: 0 };
  }

  const positions = Array.from({ length: safeCount }, (_, index) => topPadding + index * gap);
  const lastPosition = positions[positions.length - 1] ?? topPadding;

  return {
    positions,
    height: lastPosition + bottomPadding,
  };
}

/**
 * A milestone is revealed only after the growing timeline reaches its dot.
 * Because this is derived from the current scroll traversal rather than a
 * one-way observer, the same threshold naturally hides the milestone again
 * when the user scrolls back above it.
 */
export function isTimelineMilestoneRevealed(
  milestoneY: number,
  traversedY: number,
): boolean {
  return traversedY >= milestoneY;
}
