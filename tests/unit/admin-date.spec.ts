import { describe, expect, it } from 'vitest';

import { formatAdminDateTime } from '@/utils/date';

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
