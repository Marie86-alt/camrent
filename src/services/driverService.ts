import type { AppUser } from '../types/models';

function getDriversEndpoint() {
  const explicit = process.env.EXPO_PUBLIC_AVAILABLE_DRIVERS_API_URL;
  if (explicit) return explicit;

  const projectId = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID;
  return projectId ? `https://us-central1-${projectId}.cloudfunctions.net/listAvailableDrivers` : undefined;
}

export async function listAvailableDrivers(params: {
  carId?: string;
  city: string;
  endDate?: string;
  startDate?: string;
}): Promise<AppUser[]> {
  const endpoint = getDriversEndpoint();
  if (!endpoint) {
    throw new Error('Endpoint listAvailableDrivers manquant.');
  }

  const url = new URL(endpoint);
  url.searchParams.set('city', params.city);
  if (params.carId) url.searchParams.set('carId', params.carId);
  if (params.startDate) url.searchParams.set('startDate', params.startDate);
  if (params.endDate) url.searchParams.set('endDate', params.endDate);

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error('Impossible de charger les chauffeurs.');
  }

  const body = (await response.json()) as { drivers?: AppUser[] };
  return body.drivers ?? [];
}
