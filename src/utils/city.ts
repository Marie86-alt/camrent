export function normalizeCity(city: string): string {
  return city.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();
}
