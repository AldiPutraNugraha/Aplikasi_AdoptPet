const LATE_GRACE_PERIOD_MS = 14 * 24 * 60 * 60 * 1000;

export function addOneMonth(date: Date) {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const day = date.getUTCDate();
  const lastDayOfTargetMonth = new Date(Date.UTC(year, month + 2, 0)).getUTCDate();

  return new Date(
    Date.UTC(
      year,
      month + 1,
      Math.min(day, lastDayOfTargetMonth),
      date.getUTCHours(),
      date.getUTCMinutes(),
      date.getUTCSeconds(),
      date.getUTCMilliseconds(),
    ),
  );
}

export function isLate(dueAt: Date, now: Date) {
  return now.getTime() > dueAt.getTime() + LATE_GRACE_PERIOD_MS;
}
