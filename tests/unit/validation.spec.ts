import { describe, expect, it } from 'vitest';

import {
  dateOnOrAfter,
  maxTextLength,
  nonNegative,
  optionalDate,
  optionalNonNegative,
  requiredValue,
} from '@/utils/validation';

describe('переиспользуемые правила валидации', () => {
  it('проверяет обязательные и ограниченные по длине текстовые значения', () => {
    expect(requiredValue('Укажите название')('  ')).toBe('Укажите название');
    expect(requiredValue('Укажите название')('Кампания')).toBe(true);
    expect(maxTextLength(3, 'Не более 3 символов')('abcd')).toBe('Не более 3 символов');
    expect(maxTextLength(3, 'Не более 3 символов')('abc')).toBe(true);
  });

  it('разрешает пустой бюджет, но отклоняет отрицательные и некорректные значения', () => {
    const rule = optionalNonNegative('Бюджет не может быть отрицательным');

    expect(rule(undefined)).toBe(true);
    expect(rule('')).toBe(true);
    expect(rule(0)).toBe(true);
    expect(rule('12.5')).toBe(true);
    expect(rule(-1)).toBe('Бюджет не может быть отрицательным');
    expect(rule(Number.NaN)).toBe('Бюджет не может быть отрицательным');
    expect(nonNegative('Значение не может быть отрицательным')('')).toBe(
      'Значение не может быть отрицательным',
    );
  });

  it('сравнивает календарные дни вместо ISO- и display-строк', () => {
    const rule = dateOnOrAfter('2026-07-17', 'Дата окончания раньше даты начала');

    expect(optionalDate('Введите корректную дату')('17.07.2026')).toBe(true);
    expect(optionalDate('Введите корректную дату')('2026-07-17')).toBe(true);
    expect(optionalDate('Введите корректную дату')('31.02.2026')).toBe('Введите корректную дату');
    expect(rule('19.07.2026')).toBe(true);
    expect(rule('2026-07-19')).toBe(true);
    expect(rule('16.07.2026')).toBe('Дата окончания раньше даты начала');
  });
});
