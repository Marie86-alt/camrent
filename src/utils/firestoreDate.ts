export type FirestoreDateLike =
  | Date
  | { toDate: () => Date }
  | string
  | number
  | null
  | undefined;

export function toJsDate(value: FirestoreDateLike): Date {
  if (!value) return new Date(NaN);
  if (value instanceof Date) return value;
  if (typeof value === 'object' && typeof value.toDate === 'function') {
    return value.toDate();
  }
  return new Date(value as string | number);
}
