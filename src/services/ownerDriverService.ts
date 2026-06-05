import { auth } from './firebase';

export type CreateOwnerDriverPayload = {
  city: string;
  email: string;
  experienceYears: number;
  fullName: string;
  licenseCategories: string;
  licenseExpiryDate: string;
  licenseNumber: string;
  nationalIdNumber: string;
  password: string;
  phone: string;
  pricePerDay: number;
  profilePhotoUrl?: string;
  nationalIdUrl?: string;
  nationalIdBackUrl?: string;
  driverLicenseUrl?: string;
};

function getCreateDriverEndpoint() {
  const explicit = process.env.EXPO_PUBLIC_CREATE_DRIVER_API_URL;
  if (explicit) return explicit;

  const projectId = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID;
  return projectId ? `https://us-central1-${projectId}.cloudfunctions.net/createOwnerDriver` : undefined;
}

export async function createOwnerDriver(payload: CreateOwnerDriverPayload) {
  const endpoint = getCreateDriverEndpoint();
  if (!endpoint) {
    throw new Error('Endpoint createOwnerDriver manquant.');
  }

  const token = await auth.currentUser?.getIdToken();
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'Creation chauffeur impossible.');
  }

  return response.json() as Promise<{ driverId: string; email: string; status: string }>;
}
