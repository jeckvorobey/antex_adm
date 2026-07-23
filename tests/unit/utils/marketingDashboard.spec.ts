import { describe, expect, it } from 'vitest';

import { dateRangeForPeriod, formatChartCategory, integerYAxis } from '@/utils/marketingDashboard';

describe('marketing dashboard helpers', () => {
  it('рассчитывает неделю с понедельника до текущей даты', () => {
    expect(dateRangeForPeriod('week', new Date(2026, 6, 23))).toEqual({
      dateFrom: '2026-07-20',
      dateTo: '2026-07-23',
    });
  });

  it('рассчитывает текущий месяц и квартал', () => {
    const now = new Date(2026, 6, 23);
    expect(dateRangeForPeriod('month', now)).toEqual({
      dateFrom: '2026-07-01',
      dateTo: '2026-07-23',
    });
    expect(dateRangeForPeriod('quarter', now)).toEqual({
      dateFrom: '2026-07-01',
      dateTo: '2026-07-23',
    });
  });

  it('подписывает неделю днями, месяц числами и длинный период адаптивно', () => {
    expect(formatChartCategory('2026-07-20', 0, 7)).toBe('пн');
    expect(formatChartCategory('2026-07-20', 0, 31)).toBe('20');
    expect(formatChartCategory('2026-07-20', 1, 90)).toBe('');
    expect(formatChartCategory('2026-07-20', 12, 90)).toBe('20.07');
  });

  it('задаёт целочисленную ось Y с минимумом 1 для ненулевых рядов', () => {
    expect(integerYAxis([[0, 1.2, 2.1]])).toEqual({
      min: 0,
      max: 3,
      tickAmount: 3,
      forceNiceScale: true,
    });
  });
});
