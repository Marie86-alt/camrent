const DAY_IN_MS = 1000 * 60 * 60 * 24;

export function getRentalDays(startDate: Date, endDate: Date) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  return Math.max(1, Math.ceil((end.getTime() - start.getTime()) / DAY_IN_MS) + 1);
}

export function formatDate(date: Date) {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date);
}
