import { useEffect, useMemo, useState } from 'react';

function visibleDateCountForWidth(width: number): number {
  if (width <= 420) return 2;
  if (width <= 820) return 3;
  if (width <= 1180) return 4;
  return 5;
}

export function useDateWindow(dates: string[]) {
  const [requestedCount, setRequestedCount] = useState(() => (
    typeof window === 'undefined' ? 5 : visibleDateCountForWidth(window.innerWidth)
  ));
  const [startIndex, setStartIndex] = useState(0);

  useEffect(() => {
    const update = () => setRequestedCount(visibleDateCountForWidth(window.innerWidth));
    update();
    window.addEventListener('resize', update, { passive: true });
    return () => window.removeEventListener('resize', update);
  }, []);

  const visibleCount = Math.max(1, Math.min(requestedCount, Math.max(1, dates.length)));
  const maxStart = Math.max(0, dates.length - visibleCount);

  useEffect(() => {
    setStartIndex((current) => Math.min(current, maxStart));
  }, [maxStart]);

  const visibleDates = useMemo(
    () => dates.slice(startIndex, startIndex + visibleCount),
    [dates, startIndex, visibleCount],
  );

  const previous = () => setStartIndex((current) => Math.max(0, current - visibleCount));
  const next = () => setStartIndex((current) => Math.min(maxStart, current + visibleCount));

  return {
    visibleDates,
    visibleCount,
    startIndex,
    endIndex: Math.min(dates.length, startIndex + visibleCount),
    canPrevious: startIndex > 0,
    canNext: startIndex < maxStart,
    previous,
    next,
  };
}
