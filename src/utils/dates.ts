import { toJsDate } from './firestoreDate';

const DAY_IN_MS = 1000 * 60 * 60 * 24;

export function getRentalDays(startDate: Date, endDate: Date) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  return Math.max(1, Math.ceil((end.getTime() - start.getTime()) / DAY_IN_MS) + 1);
}

export function formatDate(date: Date) {
  const normalizedDate = toJsDate(date);
  const today = startOfDay(new Date());
  const target = startOfDay(normalizedDate);
  const diffDays = Math.round((target.getTime() - today.getTime()) / DAY_IN_MS);

  if (diffDays === 0) return "Aujourd'hui";
  if (diffDays === 1) return 'Demain';
  if (diffDays === -1) return 'Hier';

  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(normalizedDate);
}

export function formatFullDate(date: Date) {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(toJsDate(date));
}

export function formatDateRange(startDate: Date, endDate: Date) {
  return `${formatDate(startDate)} -> ${formatDate(endDate)}`;
}

export function formatInputDate(date: Date) {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(toJsDate(date));
}

export function parseHumanDate(value: string): Date | null {
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) return null;

  const numericMatch = trimmed.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})$/);
  if (numericMatch) {
    return buildDate(Number(numericMatch[3]), Number(numericMatch[2]), Number(numericMatch[1]));
  }

  const isoMatch = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (isoMatch) {
    return buildDate(Number(isoMatch[1]), Number(isoMatch[2]), Number(isoMatch[3]));
  }

  const monthNames: Record<string, number> = {
    janvier: 1,
    fevrier: 2,
    février: 2,
    mars: 3,
    avril: 4,
    mai: 5,
    juin: 6,
    juillet: 7,
    aout: 8,
    août: 8,
    septembre: 9,
    octobre: 10,
    novembre: 11,
    decembre: 12,
    décembre: 12,
  };
  const textMatch = trimmed.match(/^(\d{1,2})\s+([a-zéûîôàèùç]+)\s+(\d{4})$/i);
  if (textMatch) {
    return buildDate(Number(textMatch[3]), monthNames[textMatch[2]], Number(textMatch[1]));
  }

  return null;
}

function startOfDay(date: Date) {
  const d = toJsDate(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function buildDate(year: number, month: number, day: number): Date | null {
  if (!year || !month || !day || month < 1 || month > 12 || day < 1 || day > 31) return null;

  const date = new Date(year, month - 1, day);
  date.setHours(0, 0, 0, 0);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}
