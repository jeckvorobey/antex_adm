export type MarketingPeriod = 'quarter' | 'month' | 'week' | 'interval';

interface DateRange {
  dateFrom: string;
  dateTo: string;
}

const weekdayLabels = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];

function isoDate(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function dateRangeForPeriod(
  period: Exclude<MarketingPeriod, 'interval'>,
  now = new Date(),
): DateRange {
  const dateTo = isoDate(now);
  const dateFrom = new Date(now);
  if (period === 'week') {
    dateFrom.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  } else if (period === 'month') {
    dateFrom.setDate(1);
  } else {
    dateFrom.setMonth(Math.floor(now.getMonth() / 3) * 3, 1);
  }
  return { dateFrom: isoDate(dateFrom), dateTo };
}

export function formatChartCategory(value: string, period: MarketingPeriod): string {
  const date = new Date(`${value}T00:00:00`);
  if (period === 'week') return weekdayLabels[date.getDay()];
  if (period === 'month') return String(date.getDate());
  return `${String(date.getDate()).padStart(2, '0')}.${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function chartTickAmount(points: number): number {
  return Math.min(points, points <= 7 ? 7 : 10);
}

export function integerYAxis(series: number[][]) {
  const maximum = Math.max(0, ...series.flat());
  const step = Math.max(1, Math.ceil(maximum / 10));
  const max = Math.max(1, Math.ceil(maximum / step) * step);
  const tickAmount = Math.ceil(max / step);
  return { min: 0, max, tickAmount, forceNiceScale: true };
}
