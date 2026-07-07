const HOURS_PER_DAY = 24;
const DAYS_PER_MONTH = 30;

function pluralize(value: number, unit: string): string {
  return `${value} ${unit}${value > 1 ? "s" : ""}`;
}

export function formatWatchDuration(minutes: number): string {
  const totalHours = Math.floor(minutes / 60);

  const months = Math.floor(totalHours / (HOURS_PER_DAY * DAYS_PER_MONTH));
  const remainingAfterMonths = totalHours % (HOURS_PER_DAY * DAYS_PER_MONTH);
  const days = Math.floor(remainingAfterMonths / HOURS_PER_DAY);
  const hours = remainingAfterMonths % HOURS_PER_DAY;

  const parts: string[] = [];
  if (months > 0) parts.push(`${months} mois`);
  if (days > 0) parts.push(pluralize(days, "jour"));
  if (hours > 0 || parts.length === 0) parts.push(pluralize(hours, "heure"));

  return parts.join(" ");
}
