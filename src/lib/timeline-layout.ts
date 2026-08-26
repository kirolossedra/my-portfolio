export interface TimelineLabelMeasurement {
  id: number;
  anchorY: number;
  height: number;
}

export interface TimelineLabelLayoutOptions {
  naturalOffset?: number;
  minimumGap?: number;
}

export interface TimelineLabelLayout {
  offsets: Record<number, number>;
  contentBottom: number;
}

const DEFAULT_NATURAL_OFFSET = -18;
const DEFAULT_MINIMUM_GAP = 28;

/**
 * Keeps timeline dots at their true chronological coordinates while moving only
 * the readable cards when those cards would collide. The returned offset is
 * relative to each milestone's unchanged anchor/dot Y position.
 */
export function resolveTimelineLabelLayout(
  measurements: TimelineLabelMeasurement[],
  options: TimelineLabelLayoutOptions = {},
): TimelineLabelLayout {
  const naturalOffset = options.naturalOffset ?? DEFAULT_NATURAL_OFFSET;
  const minimumGap = options.minimumGap ?? DEFAULT_MINIMUM_GAP;
  const ordered = [...measurements].sort((a, b) => a.anchorY - b.anchorY || a.id - b.id);

  const offsets: Record<number, number> = {};
  let previousBottom = Number.NEGATIVE_INFINITY;
  let contentBottom = 0;

  for (const item of ordered) {
    const safeHeight = Math.max(0, item.height);
    const naturalTop = item.anchorY + naturalOffset;
    const resolvedTop = Math.max(naturalTop, previousBottom + minimumGap);

    offsets[item.id] = resolvedTop - item.anchorY;
    previousBottom = resolvedTop + safeHeight;
    contentBottom = Math.max(contentBottom, previousBottom);
  }

  return { offsets, contentBottom };
}
