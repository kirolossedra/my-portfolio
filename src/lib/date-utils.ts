import type { MilestoneDate, TimelineMilestone } from '../../shared/milestone.ts';

const monthFormatter = new Intl.DateTimeFormat('en', {
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

export function monthIndex(date: MilestoneDate): number {
  return date.year * 12 + (date.month - 1);
}

export function compareMilestoneDates(
  a: TimelineMilestone,
  b: TimelineMilestone,
): number {
  return monthIndex(a.date) - monthIndex(b.date);
}

export function formatMilestoneDate(date: MilestoneDate): string {
  return monthFormatter.format(new Date(Date.UTC(date.year, date.month - 1, 1)));
}

export function timelinePosition(
  date: MilestoneDate,
  firstDate: MilestoneDate,
  pixelsPerMonth: number,
): number {
  return (monthIndex(date) - monthIndex(firstDate)) * pixelsPerMonth;
}
