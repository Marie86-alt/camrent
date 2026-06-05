import { FieldValue } from 'firebase-admin/firestore';
import type { Request, Response } from 'express';

import { adminAuth, db } from '../firebase';
import { getAuthenticatedUid, sendJson } from '../http';

type CreateOwnerDriverRequest = {
  city?: string;
  email?: string;
  experienceYears?: number;
  fullName?: string;
  licenseCategories?: string;
  licenseExpiryDate?: string;
  licenseNumber?: string;
  nationalIdNumber?: string;
  password?: string;
  phone?: string;
  pricePerDay?: number;
  profilePhotoUrl?: string;
  nationalIdUrl?: string;
  nationalIdBackUrl?: string;
  driverLicenseUrl?: string;
};

function assertString(value: unknown, field: string) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${field} est requis.`);
  }
  return value.trim();
}

function assertNumber(value: unknown, field: string, fallback = 0) {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }

  const numberValue = Number(value);
  if (!Number.isFinite(numberValue) || numberValue < 0) {
    throw new Error(`${field} est invalide.`);
  }
  return numberValue;
}

async function assertOwner(uid: string) {
  const userSnapshot = await db.collection('users').doc(uid).get();
  const role = userSnapshot.data()?.role;

  if (role !== 'owner' && role !== 'admin') {
    throw new Error('Seul un proprietaire peut creer un chauffeur.');
  }
}

export async function handleCreateOwnerDriver(request: Request, response: Response) {
  const ownerId = await getAuthenticatedUid(request);
  if (!ownerId) {
    sendJson(response, 401, { error: 'Unauthorized' });
    return;
  }

  await assertOwner(ownerId);

  const body = request.body as CreateOwnerDriverRequest;
  const email = assertString(body.email, 'email').toLowerCase();
  const fullName = assertString(body.fullName, 'fullName');
  const phone = assertString(body.phone, 'phone');
  const city = assertString(body.city, 'city');
  const password = assertString(body.password, 'password');

  if (password.length < 6) {
    throw new Error('Le mot de passe doit contenir au moins 6 caracteres.');
  }

  const authUser = await adminAuth.createUser({
    displayName: fullName,
    email,
    password,
    phoneNumber: phone.startsWith('+') ? phone : undefined,
  });

  const driverProfile = {
    blockedDates: [],
    experienceYears: assertNumber(body.experienceYears, 'experienceYears'),
    isAvailable: true,
    licenseCategories: assertString(body.licenseCategories, 'licenseCategories'),
    licenseExpiryDate: assertString(body.licenseExpiryDate, 'licenseExpiryDate'),
    licenseNumber: assertString(body.licenseNumber, 'licenseNumber'),
    nationalIdNumber: assertString(body.nationalIdNumber, 'nationalIdNumber'),
    pricePerDay: assertNumber(body.pricePerDay, 'pricePerDay', 10000),
    profilePhotoUrl: typeof body.profilePhotoUrl === 'string' ? body.profilePhotoUrl.trim() : '',
  };

  await db.collection('users').doc(authUser.uid).set({
    city,
    createdAt: FieldValue.serverTimestamp(),
    documents: {
      driverLicenseUrl: typeof body.driverLicenseUrl === 'string' ? body.driverLicenseUrl.trim() : '',
      nationalIdBackUrl: typeof body.nationalIdBackUrl === 'string' ? body.nationalIdBackUrl.trim() : '',
      nationalIdUrl: typeof body.nationalIdUrl === 'string' ? body.nationalIdUrl.trim() : '',
    },
    driverProfile,
    email,
    fullName,
    kycStatus: 'pending',
    ownerId,
    phone,
    role: 'driver',
    status: 'pending_validation',
  });

  sendJson(response, 201, {
    driverId: authUser.uid,
    email,
    status: 'pending_validation',
  });
}

function isAvailableForDates(blockedDates: unknown, startDate?: string, endDate?: string) {
  if (!startDate || !endDate) return true;
  if (!Array.isArray(blockedDates) || blockedDates.length === 0) return true;

  const blocked = new Set(blockedDates.filter((item): item is string => typeof item === 'string'));
  const current = new Date(startDate);
  const end = new Date(endDate);

  if (Number.isNaN(current.getTime()) || Number.isNaN(end.getTime())) return true;

  while (current <= end) {
    if (blocked.has(current.toISOString().slice(0, 10))) return false;
    current.setDate(current.getDate() + 1);
  }

  return true;
}

export async function handleListAvailableDrivers(request: Request, response: Response) {
  const city = typeof request.query.city === 'string' ? request.query.city.trim() : '';
  const startDate = typeof request.query.startDate === 'string' ? request.query.startDate : undefined;
  const endDate = typeof request.query.endDate === 'string' ? request.query.endDate : undefined;

  if (!city) {
    sendJson(response, 400, { error: 'city is required' });
    return;
  }

  const snapshot = await db
    .collection('users')
    .where('role', '==', 'driver')
    .where('city', '==', city)
    .where('status', '==', 'active')
    .where('kycStatus', '==', 'approved')
    .get();

  const drivers = snapshot.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }))
    .filter((driver) => {
      const profile = (driver as any).driverProfile ?? {};
      return profile.isAvailable === true && isAvailableForDates(profile.blockedDates, startDate, endDate);
    })
    .map((driver) => {
      const data = driver as any;
      const profile = data.driverProfile ?? {};
      return {
        city: data.city,
        driverProfile: {
          experienceYears: profile.experienceYears ?? 0,
          licenseCategories: profile.licenseCategories ?? '',
          pricePerDay: profile.pricePerDay ?? 10000,
          profilePhotoUrl: profile.profilePhotoUrl ?? '',
        },
        fullName: data.fullName,
        id: data.id,
        missionsCount: data.missionsCount ?? 0,
        ratingAverage: data.ratingAverage ?? null,
        role: 'driver',
      };
    });

  sendJson(response, 200, { drivers });
}
