import { useEffect, useMemo, useState } from 'react';

export const POLL_DATE_PAGE_SIZE = 7;

function dateAnchor(date: string): Date {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(Date.UTC(year ?? 1970, (month ?? 1) - 1, day ?? 1, 16));
}

function monthDay(date: string): { month: string; day: string; year: string } {
  const anchor = dateAnchor(date);
  return {
    month: new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Toronto', month: 'short' }).format(anchor),
    day: new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Toronto', day: 'numeric' }).format(anchor),
    year: new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Toronto', year: 'numeric' }).format(anchor),
  };
}

export function compactDateParts(date: string): { weekday: string; day: string } {
  const anchor = dateAnchor(date);
  return {
    weekday: new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Toronto', weekday: 'narrow' }).format(anchor),
    day: new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Toronto', day: 'numeric' }).format(anchor),
  };
}

export function formatDatePageRange(dates: string[]): string {
  const firstDate = dates[0];
  const lastDate = dates.at(-1);
  if (!firstDate || !lastDate) return '';
  const first = monthDay(firstDate);
  const last = monthDay(lastDate);
  if (firstDate === lastDate) return `${first.month} ${first.day}`;
  if (first.month === last.month && first.year === last.year) return `${first.month} ${first.day} – ${last.day}`;
  return `${first.month} ${first.day} – ${last.month} ${last.day}`;
}

export function useDateWindow(dates: string[]) {
  const totalPages = Math.max(1, Math.ceil(dates.length / POLL_DATE_PAGE_SIZE));
  const [pageIndex, setPageIndex] = useState(0);

  useEffect(() => {
    setPageIndex((current) => Math.min(current, totalPages - 1));
  }, [totalPages]);

  const startIndex = pageIndex * POLL_DATE_PAGE_SIZE;
  const visibleDates = useMemo(
    () => dates.slice(startIndex, startIndex + POLL_DATE_PAGE_SIZE),
    [dates, startIndex],
  );

  const pageDates = useMemo<Array<string | null>>(
    () => [
      ...visibleDates,
      ...Array.from({ length: Math.max(0, POLL_DATE_PAGE_SIZE - visibleDates.length) }, () => null),
    ],
    [visibleDates],
  );

  return {
    visibleDates,
    pageDates,
    visibleCount: visibleDates.length,
    startIndex,
    endIndex: Math.min(dates.length, startIndex + visibleDates.length),
    pageIndex,
    totalPages,
    canPrevious: pageIndex > 0,
    canNext: pageIndex < totalPages - 1,
    previous: () => setPageIndex((current) => Math.max(0, current - 1)),
    next: () => setPageIndex((current) => Math.min(totalPages - 1, current + 1)),
  };
}
