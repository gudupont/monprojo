const HOURS_PER_DAY = 24;
const DAYS_PER_MONTH = 30;

function pluralize(value: number, unit: string): string {
  return `${value} ${unit}${value > 1 ? "s" : ""}`;
}

export function formatWatchDuration(minutes: number): string {
  if (minutes < 60) {
    return pluralize(minutes, "minute");
  }

  const totalHours = Math.floor(minutes / 60);

  const months = Math.floor(totalHours / (HOURS_PER_DAY * DAYS_PER_MONTH));
  const remainingAfterMonths = totalHours % (HOURS_PER_DAY * DAYS_PER_MONTH);
  const days = Math.floor(remainingAfterMonths / HOURS_PER_DAY);
  const hours = remainingAfterMonths % HOURS_PER_DAY;

  if (months > 0) {
    return days > 0 ? `${months} mois ${pluralize(days, "jour")}` : `${months} mois`;
  }
  if (days > 0) {
    return hours > 0 ? `${pluralize(days, "jour")} ${pluralize(hours, "heure")}` : pluralize(days, "jour");
  }
  return pluralize(hours, "heure");
}
