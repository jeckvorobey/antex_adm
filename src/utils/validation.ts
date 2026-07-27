/** Результат синхронного правила валидации Quasar. */
export type ValidationRule = (value: unknown) => true | string;

/** Проверяет, что значение заполнено, считая пробельную строку пустой. */
export function requiredValue(message: string): ValidationRule {
  return (value) => {
    if (typeof value === 'string') {
      return Boolean(value.trim()) || message;
    }

    return (value !== null && value !== undefined) || message;
  };
}

/** Ограничивает длину необязательного текстового значения. */
export function maxTextLength(maximum: number, message: string): ValidationRule {
  return (value) => value == null || String(value).length <= maximum || message;
}

/** Преобразует поддерживаемую дату в ISO-day без зависимости от timezone браузера. */
function normalizeDateOnly(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const match = /^(?:(\d{4})-(\d{2})-(\d{2})|(\d{2})\.(\d{2})\.(\d{4}))$/.exec(value);
  if (!match) {
    return null;
  }

  const [, isoYear, isoMonth, isoDay, displayDay, displayMonth, displayYear] = match;
  const year = Number(isoYear ?? displayYear);
  const month = Number(isoMonth ?? displayMonth);
  const day = Number(isoDay ?? displayDay);
  const date = new Date(Date.UTC(year, month - 1, day));
  const isValid =
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;

  return isValid
    ? `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    : null;
}

/** Проверяет необязательный день в ISO- или отображаемой европейской маске. */
export function optionalDate(message: string): ValidationRule {
  return (value) => !value || normalizeDateOnly(value) !== null || message;
}

/** Не позволяет дате окончания быть раньше переданной даты начала. */
export function dateOnOrAfter(startDate: string, message: string): ValidationRule {
  return (value) => {
    if (!value || !startDate) {
      return true;
    }

    const normalizedStartDate = normalizeDateOnly(startDate);
    const normalizedEndDate = normalizeDateOnly(value);
    if (!normalizedStartDate || !normalizedEndDate) {
      return true;
    }

    return normalizedEndDate >= normalizedStartDate || message;
  };
}

/** Проверяет обязательное неотрицательное число и не допускает нечисловые значения. */
export function nonNegative(message: string): ValidationRule {
  return (value) => validateNonNegative(value, message, false);
}

/** Проверяет необязательное неотрицательное число и не допускает нечисловые значения. */
export function optionalNonNegative(message: string): ValidationRule {
  return (value) => validateNonNegative(value, message, true);
}

/** Выполняет общую проверку чисел для обязательных и необязательных полей. */
function validateNonNegative(value: unknown, message: string, optional: boolean): true | string {
  if (value === null || value === undefined || value === '') {
    return optional || message;
  }

  if (typeof value !== 'number' && typeof value !== 'string') {
    return message;
  }

  const numericValue = Number(value);
  return (Number.isFinite(numericValue) && numericValue >= 0) || message;
}
