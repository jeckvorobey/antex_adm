import { describe, expect, it } from 'vitest';

import {
  formatAdminDate,
  formatAdminDateTime,
  serializeAdminDateForApi,
} from '@/utils/date';

describe('formatAdminDateTime', () => {
  it('форматирует дату как dd.mm.yyyy hh:mm', () => {
    expect(formatAdminDateTime('1970-01-01T16:20:00Z')).toBe('01.01.1970 16:20');
  });

  it('возвращает прочерк для пустых и некорректных значений', () => {
    expect(formatAdminDateTime(null)).toBe('—');
    expect(formatAdminDateTime(undefined)).toBe('—');
    expect(formatAdminDateTime('not-a-date')).toBe('—');
  });
});

describe('formatAdminDate', () => {
  it('форматирует дату как dd.mm.yyyy', () => {
    expect(formatAdminDate('2026-04-16T10:20:00Z')).toBe('16.04.2026');
  });

  it('возвращает прочерк для пустых и некорректных date-only значений', () => {
    expect(formatAdminDate(null)).toBe('—');
    expect(formatAdminDate(undefined)).toBe('—');
    expect(formatAdminDate('not-a-date')).toBe('—');
  });
});

describe('serializeAdminDateForApi', () => {
  it('конвертирует dd.mm.yyyy в yyyy-mm-dd для backend', () => {
    expect(serializeAdminDateForApi('16.04.2026')).toBe('2026-04-16');
  });

  it('возвращает пустую строку для пустой или некорректной даты', () => {
    expect(serializeAdminDateForApi('')).toBe('');
    expect(serializeAdminDateForApi('2026-04-16')).toBe('');
    expect(serializeAdminDateForApi('99.99.2026')).toBe('');
  });
});
