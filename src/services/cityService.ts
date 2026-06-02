import { CAMEROON_CITIES } from '../constants/cameroon';
import type { CameroonCity } from '../types/models';

type CitySearchResult = {
  city: string;
  country?: string;
  region?: string;
};

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function localCitySearch(query: string) {
  const normalizedQuery = normalize(query);

  if (!normalizedQuery) {
    return CAMEROON_CITIES.slice(0, 8);
  }

  return CAMEROON_CITIES.filter((city) => normalize(city).includes(normalizedQuery)).slice(0, 10);
}

export async function searchCameroonCities(query: string): Promise<CameroonCity[]> {
  const endpoint = process.env.EXPO_PUBLIC_CITY_SEARCH_API_URL;

  if (!endpoint || query.trim().length < 2) {
    return localCitySearch(query);
  }

  try {
    const url = `${endpoint}?q=${encodeURIComponent(query.trim())}&country=CM`;
    const response = await fetch(url);

    if (!response.ok) {
      return localCitySearch(query);
    }

    const data = (await response.json()) as CitySearchResult[] | { cities?: CitySearchResult[] };
    const items = Array.isArray(data) ? data : data.cities ?? [];
    const cities = items
      .map((item) => item.city)
      .filter((city): city is string => Boolean(city))
      .slice(0, 10);

    return cities.length > 0 ? cities : localCitySearch(query);
  } catch {
    return localCitySearch(query);
  }
}
