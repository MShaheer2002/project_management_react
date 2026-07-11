const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_ONLY_PATTERN = /^\d{2}:\d{2}$/;
const ISO_TIME_FRAGMENT_PATTERN = /(?:T|\s)(\d{2}:\d{2})(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:?\d{2})?$/i;

const pad = (value: number) => String(value).padStart(2, '0');

const formatLocalDateParts = (date: Date) => {
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  return `${year}-${month}-${day}`;
};

export const isDateOnlyString = (value: unknown): value is string =>
  typeof value === 'string' && DATE_ONLY_PATTERN.test(value.trim());

export const normalizeDateForInput = (value: unknown): string => {
  if (typeof value !== 'string' || !value.trim()) return '';
  const trimmed = value.trim();

  if (DATE_ONLY_PATTERN.test(trimmed)) {
    return trimmed;
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return '';
  return formatLocalDateParts(parsed);
};

export const normalizeTimeForInput = (value: unknown, fallback = ''): string => {
  if (typeof value !== 'string' || !value.trim()) return fallback;
  const trimmed = value.trim();

  if (TIME_ONLY_PATTERN.test(trimmed)) {
    return trimmed;
  }

  const isoMatch = trimmed.match(ISO_TIME_FRAGMENT_PATTERN);
  if (isoMatch?.[1]) {
    return isoMatch[1];
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return fallback;
  return `${pad(parsed.getHours())}:${pad(parsed.getMinutes())}`;
};

export const addDaysToDateInput = (days: number, baseDate = new Date()): string => {
  const next = new Date(baseDate);
  next.setHours(12, 0, 0, 0);
  next.setDate(next.getDate() + days);
  return formatLocalDateParts(next);
};

export const formatCalendarDate = (
  value?: string | null,
  locale?: string,
  options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
): string => {
  if (!value) return 'No due date';

  if (DATE_ONLY_PATTERN.test(value)) {
    const [year, month, day] = value.split('-').map(Number);
    return new Intl.DateTimeFormat(locale, options).format(new Date(year, month - 1, day, 12, 0, 0, 0));
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'No due date';
  return new Intl.DateTimeFormat(locale, options).format(parsed);
};
