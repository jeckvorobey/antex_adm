import { describe, expect, it } from 'vitest';

import {
  chartTickAmount,
  dateRangeForPeriod,
  formatChartCategory,
  integerYAxis,
} from '@/utils/marketingDashboard';

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

  it('подписывает неделю днями, месяц числами, а интервал датой', () => {
    expect(formatChartCategory('2026-07-20', 'week')).toBe('пн');
    expect(formatChartCategory('2026-07-20', 'month')).toBe('20');
    expect(formatChartCategory('2026-07-20', 'interval')).toBe('20.07');
    expect(chartTickAmount(7)).toBe(7);
    expect(chartTickAmount(90)).toBe(10);
  });

  it('задаёт целочисленную ось Y с минимумом 1 для ненулевых рядов', () => {
    expect(integerYAxis([[0, 1.2, 2.1]])).toEqual({
      min: 0,
      max: 3,
      tickAmount: 3,
      forceNiceScale: true,
    });
  });

  it('ограничивает число целочисленных отметок оси Y', () => {
    expect(integerYAxis([[0, 1_000]])).toEqual({
      min: 0,
      max: 1_000,
      tickAmount: 10,
      forceNiceScale: true,
    });
  });
});
