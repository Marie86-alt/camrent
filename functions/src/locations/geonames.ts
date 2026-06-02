import type { Request, Response } from 'express';

import { optionalEnv } from '../config';
import { sendJson } from '../http';

type GeoNamesPlace = {
  adminName1?: string;
  countryCode?: string;
  name?: string;
  population?: number;
  toponymName?: string;
};

type GeoNamesResponse = {
  geonames?: GeoNamesPlace[];
  status?: {
    message?: string;
    value?: number;
  };
};

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function uniqueCities(places: GeoNamesPlace[]) {
  const seen = new Set<string>();

  return places
    .map((place) => ({
      city: place.name ?? place.toponymName ?? '',
      country: place.countryCode ?? 'CM',
      region: place.adminName1 ?? '',
      population: place.population ?? 0,
    }))
    .filter((place) => {
      if (!place.city) {
        return false;
      }

      const key = normalize(place.city);

      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    })
    .slice(0, 10);
}

export async function handleCitySearch(request: Request, response: Response) {
  if (request.method !== 'GET') {
    response.set('Allow', 'GET');
    sendJson(response, 405, { error: 'Method not allowed' });
    return;
  }

  const username = optionalEnv('GEONAMES_USERNAME', 'marie92');
  const query = String(request.query.q ?? '').trim();

  if (query.length < 2) {
    sendJson(response, 200, { cities: [] });
    return;
  }

  const url = new URL('https://secure.geonames.org/searchJSON');
  url.searchParams.set('name_startsWith', query);
  url.searchParams.set('country', 'CM');
  url.searchParams.set('featureClass', 'P');
  url.searchParams.set('lang', 'fr');
  url.searchParams.set('maxRows', '10');
  url.searchParams.set('orderby', 'population');
  url.searchParams.set('username', username);

  const geoNamesResponse = await fetch(url);

  if (!geoNamesResponse.ok) {
    sendJson(response, 502, { error: 'GeoNames request failed' });
    return;
  }

  const body = (await geoNamesResponse.json()) as GeoNamesResponse;

  if (body.status) {
    sendJson(response, 502, { error: body.status.message ?? 'GeoNames error' });
    return;
  }

  sendJson(response, 200, {
    cities: uniqueCities(body.geonames ?? []),
  });
}
