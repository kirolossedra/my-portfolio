const monthFormatter = new Intl.DateTimeFormat('en', {
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

export function monthIndex(date) {
  return date.year * 12 + (date.month - 1);
}

export function compareMilestoneDates(a, b) {
  return monthIndex(a.date) - monthIndex(b.date);
}

export function formatMilestoneDate(date) {
  return monthFormatter.format(new Date(Date.UTC(date.year, date.month - 1, 1)));
}

export function timelinePosition(date, firstDate, pixelsPerMonth) {
  return (monthIndex(date) - monthIndex(firstDate)) * pixelsPerMonth;
}
